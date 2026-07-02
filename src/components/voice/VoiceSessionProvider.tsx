import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useSessionSeatId } from "#/lib/useSessionSeatId.ts";
import type {
  VoiceClientMessage,
  VoiceIceServer,
  VoiceServerEvent,
  VoiceSignal,
} from "#/lib/voiceProtocol.ts";
import {
  isVoiceToggleShortcut,
  readMutedPlayers,
  writeMutedPlayers,
} from "#/lib/voicePreferences.ts";
import {
  VoiceSessionContext,
  type VoiceConnectionStatus,
  type VoiceMicState,
  type VoicePeerState,
  type VoiceSessionValue,
} from "./voiceSessionContext.ts";

interface PeerRuntime {
  connection: RTCPeerConnection;
  audio: HTMLAudioElement;
  canNegotiate: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
  settingRemoteAnswer: boolean;
  pendingCandidates: RTCIceCandidateInit[];
}

function toRtcIceServers(servers: VoiceIceServer[]): RTCIceServer[] {
  return servers.map((server) => ({ ...server }));
}

export function VoiceRouteProvider({ children }: { children: React.ReactNode }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const match = /^\/(?:lobby|play)\/([^/]+)\/?$/.exec(pathname);
  let gameId: string | null = null;
  if (match) {
    try {
      gameId = decodeURIComponent(match[1]);
    } catch {
      gameId = match[1];
    }
  }
  const seatId = useSessionSeatId(gameId ?? "__no_voice_game__");

  return (
    <VoiceSessionProvider gameId={gameId} playerId={seatId ?? null}>
      {children}
    </VoiceSessionProvider>
  );
}

export function VoiceSessionProvider({
  gameId,
  playerId,
  children,
}: {
  gameId: string | null;
  playerId: string | null;
  children: React.ReactNode;
}) {
  const [connectionStatus, setConnectionStatus] = useState<VoiceConnectionStatus>("inactive");
  const [micState, setMicState] = useState<VoiceMicState>("off");
  const [micError, setMicError] = useState<string | null>(null);
  const [peers, setPeers] = useState<Record<string, VoicePeerState>>({});
  const [playbackBlocked, setPlaybackBlocked] = useState(false);

  const peerRuntimes = useRef(new Map<string, PeerRuntime>());
  const localTrack = useRef<MediaStreamTrack | null>(null);
  const source = useRef<EventSource | null>(null);
  const iceServers = useRef<RTCIceServer[]>([]);
  const identity = useRef({ gameId, playerId });
  const mutedPlayers = useRef(new Set<string>());

  identity.current = { gameId, playerId };

  const postMessage = useCallback((message: VoiceClientMessage) => {
    const currentGameId = identity.current.gameId;
    if (!currentGameId) return;
    void fetch(`/api/voice/${encodeURIComponent(currentGameId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    }).catch(() => {
      // EventSource reconnection and later peer events recover transient failures.
    });
  }, []);

  const sendSignal = useCallback(
    (toPlayerId: string, signal: VoiceSignal) => {
      const currentPlayerId = identity.current.playerId;
      if (!currentPlayerId) return;
      postMessage({
        type: "signal",
        fromPlayerId: currentPlayerId,
        toPlayerId,
        signal,
      });
    },
    [postMessage],
  );

  const closePeer = useCallback((peerId: string) => {
    const runtime = peerRuntimes.current.get(peerId);
    if (!runtime) return;
    runtime.audio.pause();
    runtime.audio.srcObject = null;
    runtime.connection.close();
    peerRuntimes.current.delete(peerId);
  }, []);

  const closeAllPeers = useCallback(() => {
    for (const peerId of peerRuntimes.current.keys()) closePeer(peerId);
  }, [closePeer]);

  const createPeer = useCallback(
    (peerId: string, initiator: boolean): PeerRuntime | null => {
      const currentPlayerId = identity.current.playerId;
      if (!currentPlayerId || typeof RTCPeerConnection === "undefined") return null;

      closePeer(peerId);
      const connection = new RTCPeerConnection({ iceServers: iceServers.current });
      const audio = new Audio();
      audio.autoplay = true;
      audio.setAttribute("playsinline", "");
      audio.muted = mutedPlayers.current.has(peerId);

      const runtime: PeerRuntime = {
        connection,
        audio,
        canNegotiate: initiator,
        makingOffer: false,
        ignoreOffer: false,
        settingRemoteAnswer: false,
        pendingCandidates: [],
      };
      peerRuntimes.current.set(peerId, runtime);

      const transceiver = connection.addTransceiver("audio", { direction: "sendrecv" });
      if (localTrack.current) void transceiver.sender.replaceTrack(localTrack.current);

      connection.ontrack = (event) => {
        audio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
        void audio.play().catch(() => setPlaybackBlocked(true));
      };

      connection.onicecandidate = ({ candidate }) => {
        if (!candidate) return;
        const serialized = candidate.toJSON();
        sendSignal(peerId, {
          type: "candidate",
          candidate: {
            candidate: serialized.candidate ?? "",
            sdpMid: serialized.sdpMid,
            sdpMLineIndex: serialized.sdpMLineIndex,
            usernameFragment: serialized.usernameFragment,
          },
        });
      };

      connection.onnegotiationneeded = async () => {
        if (!runtime.canNegotiate) return;
        try {
          runtime.makingOffer = true;
          await connection.setLocalDescription();
          if (connection.localDescription) {
            sendSignal(peerId, {
              type: "description",
              description: connection.localDescription.toJSON(),
            });
          }
        } catch {
          // A later negotiationneeded event or reconnect will retry.
        } finally {
          runtime.makingOffer = false;
        }
      };

      connection.onconnectionstatechange = () => {
        if (connection.connectionState === "failed") {
          connection.restartIce();
        }
      };

      return runtime;
    },
    [closePeer, sendSignal],
  );

  const handleSignal = useCallback(
    async (fromPlayerId: string, signal: VoiceSignal) => {
      const currentPlayerId = identity.current.playerId;
      if (!currentPlayerId) return;
      const runtime = peerRuntimes.current.get(fromPlayerId) ?? createPeer(fromPlayerId, false);
      if (!runtime) return;

      const connection = runtime.connection;
      try {
        if (signal.type === "description") {
          const description = signal.description as RTCSessionDescriptionInit;
          const readyForOffer =
            !runtime.makingOffer &&
            (connection.signalingState === "stable" || runtime.settingRemoteAnswer);
          const offerCollision = description.type === "offer" && !readyForOffer;
          runtime.ignoreOffer = currentPlayerId < fromPlayerId && offerCollision;
          if (runtime.ignoreOffer) return;

          runtime.settingRemoteAnswer = description.type === "answer";
          await connection.setRemoteDescription(description);
          runtime.settingRemoteAnswer = false;
          runtime.canNegotiate = true;

          for (const candidate of runtime.pendingCandidates.splice(0)) {
            await connection.addIceCandidate(candidate);
          }

          if (description.type === "offer") {
            await connection.setLocalDescription();
            if (connection.localDescription) {
              sendSignal(fromPlayerId, {
                type: "description",
                description: connection.localDescription.toJSON(),
              });
            }
          }
          return;
        }

        if (!connection.remoteDescription) {
          runtime.pendingCandidates.push(signal.candidate);
          return;
        }
        await connection.addIceCandidate(signal.candidate);
      } catch {
        if (!runtime.ignoreOffer) closePeer(fromPlayerId);
      }
    },
    [closePeer, createPeer, sendSignal],
  );

  useEffect(() => {
    source.current?.close();
    closeAllPeers();
    localTrack.current?.stop();
    localTrack.current = null;
    setPeers({});
    setMicState("off");
    setMicError(null);
    setPlaybackBlocked(false);

    if (!gameId || !playerId) {
      setConnectionStatus("inactive");
      return;
    }
    if (typeof RTCPeerConnection === "undefined" || typeof EventSource === "undefined") {
      setConnectionStatus("unsupported");
      setMicState("unavailable");
      return;
    }

    mutedPlayers.current = readMutedPlayers(gameId);
    setConnectionStatus("connecting");
    let disposed = false;
    const eventSource = new EventSource(
      `/api/voice/${encodeURIComponent(gameId)}?playerId=${encodeURIComponent(playerId)}`,
    );
    source.current = eventSource;

    eventSource.onmessage = (message) => {
      if (disposed) return;
      let event: VoiceServerEvent;
      try {
        event = JSON.parse(message.data) as VoiceServerEvent;
      } catch {
        return;
      }

      if (event.type === "ready") {
        closeAllPeers();
        iceServers.current = toRtcIceServers(event.iceServers);
        setPeers(
          Object.fromEntries(
            event.peers.map((peer) => [
              peer.playerId,
              { ...peer, muted: mutedPlayers.current.has(peer.playerId) },
            ]),
          ),
        );
        for (const peer of event.peers) createPeer(peer.playerId, true);
        setConnectionStatus("ready");
      } else if (event.type === "peer-joined") {
        setPeers((current) => ({
          ...current,
          [event.peer.playerId]: {
            ...event.peer,
            muted: mutedPlayers.current.has(event.peer.playerId),
          },
        }));
        createPeer(event.peer.playerId, false);
      } else if (event.type === "peer-left") {
        closePeer(event.playerId);
        setPeers((current) => {
          const next = { ...current };
          delete next[event.playerId];
          return next;
        });
      } else if (event.type === "peer-state") {
        setPeers((current) => ({
          ...current,
          [event.peer.playerId]: {
            ...event.peer,
            muted: mutedPlayers.current.has(event.peer.playerId),
          },
        }));
      } else if (event.type === "signal") {
        void handleSignal(event.fromPlayerId, event.signal);
      } else if (event.type === "replaced") {
        eventSource.close();
        closeAllPeers();
        localTrack.current?.stop();
        localTrack.current = null;
        setMicState("off");
        setConnectionStatus("replaced");
      }
    };

    eventSource.onerror = () => {
      if (!disposed && eventSource.readyState !== EventSource.CLOSED) {
        setConnectionStatus("connecting");
      }
    };

    return () => {
      disposed = true;
      eventSource.close();
      if (source.current === eventSource) source.current = null;
      closeAllPeers();
      localTrack.current?.stop();
      localTrack.current = null;
    };
  }, [closeAllPeers, closePeer, createPeer, gameId, handleSignal, playerId]);

  const toggleMicrophone = useCallback(async () => {
    const currentGameId = identity.current.gameId;
    const currentPlayerId = identity.current.playerId;
    if (!currentGameId || !currentPlayerId || micState === "requesting") return;

    const existingTrack = localTrack.current;
    if (micState === "on" && existingTrack) {
      existingTrack.enabled = false;
      setMicState("off");
      setMicError(null);
      postMessage({ type: "mic-state", playerId: currentPlayerId, enabled: false });
      return;
    }

    if (existingTrack && existingTrack.readyState === "live") {
      existingTrack.enabled = true;
      setMicState("on");
      setMicError(null);
      postMessage({ type: "mic-state", playerId: currentPlayerId, enabled: true });
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicState("unavailable");
      setMicError("Microphone access is unavailable in this browser or connection.");
      return;
    }

    setMicState("requesting");
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const track = stream.getAudioTracks()[0];
      if (!track) throw new Error("No microphone was found.");
      if (
        identity.current.gameId !== currentGameId ||
        identity.current.playerId !== currentPlayerId
      ) {
        track.stop();
        return;
      }

      track.enabled = true;
      track.onended = () => {
        if (localTrack.current !== track) return;
        localTrack.current = null;
        setMicState("error");
        setMicError("The microphone disconnected.");
        postMessage({ type: "mic-state", playerId: currentPlayerId, enabled: false });
      };
      localTrack.current = track;
      await Promise.all(
        [...peerRuntimes.current.values()].map((runtime) =>
          runtime.connection.getTransceivers()[0]?.sender.replaceTrack(track),
        ),
      );
      setMicState("on");
      postMessage({ type: "mic-state", playerId: currentPlayerId, enabled: true });
      await Promise.allSettled(
        [...peerRuntimes.current.values()].map((runtime) => runtime.audio.play()),
      );
    } catch (error) {
      const denied =
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "SecurityError");
      setMicState(denied ? "denied" : "error");
      setMicError(
        denied
          ? "Microphone permission was denied. Allow it in your browser settings and try again."
          : error instanceof Error
            ? error.message
            : "The microphone could not be started.",
      );
    }
  }, [micState, postMessage]);

  useEffect(() => {
    if (!gameId || !playerId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isVoiceToggleShortcut(event)) return;
      event.preventDefault();
      void toggleMicrophone();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gameId, playerId, toggleMicrophone]);

  const togglePeerMuted = useCallback(
    (targetPlayerId: string) => {
      if (!gameId) return;
      if (mutedPlayers.current.has(targetPlayerId)) mutedPlayers.current.delete(targetPlayerId);
      else mutedPlayers.current.add(targetPlayerId);
      writeMutedPlayers(gameId, mutedPlayers.current);

      const runtime = peerRuntimes.current.get(targetPlayerId);
      if (runtime) runtime.audio.muted = mutedPlayers.current.has(targetPlayerId);
      setPeers((current) => {
        const peer = current[targetPlayerId];
        return peer
          ? {
              ...current,
              [targetPlayerId]: {
                ...peer,
                muted: mutedPlayers.current.has(targetPlayerId),
              },
            }
          : current;
      });
    },
    [gameId],
  );

  const enablePlayback = useCallback(async () => {
    const results = await Promise.allSettled(
      [...peerRuntimes.current.values()].map((runtime) => runtime.audio.play()),
    );
    setPlaybackBlocked(results.some((result) => result.status === "rejected"));
  }, []);

  const getLocalAudioTrack = useCallback(() => localTrack.current, []);

  const value = useMemo<VoiceSessionValue>(
    () => ({
      connectionStatus,
      micState,
      micError,
      peers,
      playbackBlocked,
      toggleMicrophone,
      togglePeerMuted,
      enablePlayback,
      getLocalAudioTrack,
    }),
    [
      connectionStatus,
      enablePlayback,
      getLocalAudioTrack,
      micError,
      micState,
      peers,
      playbackBlocked,
      toggleMicrophone,
      togglePeerMuted,
    ],
  );

  return <VoiceSessionContext.Provider value={value}>{children}</VoiceSessionContext.Provider>;
}
