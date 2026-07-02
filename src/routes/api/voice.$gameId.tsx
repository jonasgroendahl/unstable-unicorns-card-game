import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { VoiceServerEvent } from "#/lib/voiceProtocol.ts";
import { parseVoiceIceServers } from "#/server/voiceConfig.ts";
import { voiceRegistry } from "#/server/voiceRegistry.ts";

const descriptionSchema = z.object({
  type: z.enum(["offer", "answer", "pranswer", "rollback"]),
  sdp: z.string().max(100_000).optional(),
});

const candidateSchema = z.object({
  candidate: z.string().max(10_000),
  sdpMid: z.string().max(500).nullable().optional(),
  sdpMLineIndex: z.number().int().nonnegative().nullable().optional(),
  usernameFragment: z.string().max(500).nullable().optional(),
});

const signalSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("description"), description: descriptionSchema }),
  z.object({ type: z.literal("candidate"), candidate: candidateSchema }),
]);

const messageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("signal"),
    fromPlayerId: z.string().min(1).max(100),
    toPlayerId: z.string().min(1).max(100),
    signal: signalSchema,
  }),
  z.object({
    type: z.literal("mic-state"),
    playerId: z.string().min(1).max(100),
    enabled: z.boolean(),
  }),
]);

export const Route = createFileRoute("/api/voice/$gameId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const url = new URL(request.url);
        const playerId = url.searchParams.get("playerId") ?? "";
        if (!(await voiceRegistry.isEligible(params.gameId, playerId))) {
          return new Response("Only seated human players may join voice chat.", { status: 403 });
        }

        const encoder = new TextEncoder();
        const connectionId = `${playerId}_${crypto.randomUUID()}`;
        let cleanup = () => {};
        let keepalive: ReturnType<typeof setInterval> | undefined;

        const stream = new ReadableStream({
          async start(controller) {
            const send = (event: VoiceServerEvent) => {
              const withConfig =
                event.type === "ready" ? { ...event, iceServers: parseVoiceIceServers() } : event;
              try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(withConfig)}\n\n`));
              } catch {
                cleanup();
              }
            };

            const handle = await voiceRegistry.connect(params.gameId, playerId, connectionId, send);
            if (!handle) {
              controller.error(new Error("Voice session is no longer available."));
              return;
            }

            let closed = false;
            cleanup = () => {
              if (closed) return;
              closed = true;
              if (keepalive) clearInterval(keepalive);
              handle.disconnect();
              try {
                controller.close();
              } catch {
                // The stream may already be closed by the browser.
              }
            };

            keepalive = setInterval(() => {
              try {
                controller.enqueue(encoder.encode(": ping\n\n"));
              } catch {
                cleanup();
              }
            }, 15_000);
            request.signal.addEventListener("abort", cleanup, { once: true });
          },
          cancel() {
            cleanup();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },

      POST: async ({ request, params }) => {
        let parsed: z.infer<typeof messageSchema>;
        try {
          parsed = messageSchema.parse(await request.json());
        } catch {
          return Response.json({ ok: false, error: "Invalid voice message." }, { status: 400 });
        }

        const accepted =
          parsed.type === "signal"
            ? voiceRegistry.relaySignal(
                params.gameId,
                parsed.fromPlayerId,
                parsed.toPlayerId,
                parsed.signal,
              )
            : voiceRegistry.updateMicState(params.gameId, parsed.playerId, parsed.enabled);

        return accepted
          ? Response.json({ ok: true }, { status: 202 })
          : Response.json(
              { ok: false, error: "Voice participant is not connected." },
              { status: 403 },
            );
      },
    },
  },
});
