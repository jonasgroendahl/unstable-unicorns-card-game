import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, Users, Plus, LogIn, Bug } from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
import { audio } from "#/lib/audio.ts";
import { createLobby, joinLobby } from "#/server/actions.ts";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const playerName = () => name.trim() || "Player";

  const host = async () => {
    audio.unlock();
    setBusy(true);
    try {
      const res = await createLobby({ data: { hostName: playerName() } });
      sessionStorage.setItem(`uu.you.${res.gameId}`, res.youId);
      await navigate({ to: "/lobby/$gameId", params: { gameId: res.gameId } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    audio.unlock();
    if (code.trim().length < 3) {
      toast.error("Enter a join code.");
      return;
    }
    setBusy(true);
    try {
      const res = await joinLobby({ data: { joinCode: code.trim(), name: playerName() } });
      sessionStorage.setItem(`uu.you.${res.gameId}`, res.youId);
      await navigate({ to: "/lobby/$gameId", params: { gameId: res.gameId } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="uu-root uu-starfield relative flex min-h-dvh flex-col items-center justify-center p-6">
      <div className="relative z-10 w-full max-w-md text-center">
        <Sparkles className="mx-auto mb-3 size-12 text-amber-300 drop-shadow" />
        <h1 className="uu-display text-5xl font-bold leading-tight text-amber-200">
          Unstable
          <br />
          Unicorns
        </h1>
        <p className="mt-3 text-sm text-white/70">
          Build a Unicorn Army. Betray your friends. Unicorns are your friends now.
        </p>

        <div className="uu-glass mt-8 space-y-4 rounded-2xl p-5 text-left">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
              Your name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Player"
              maxLength={20}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-amber-300"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={host}
              disabled={busy}
              className="bg-amber-400 text-black hover:bg-amber-300"
            >
              <Plus className="size-4" /> Host game
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                audio.unlock();
                void navigate({ to: "/debug" });
              }}
            >
              <Bug className="size-4" /> Quick play
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="JOIN CODE"
              maxLength={8}
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 font-mono tracking-widest text-white outline-none focus:border-amber-300"
            />
            <Button variant="secondary" onClick={join} disabled={busy}>
              <LogIn className="size-4" /> Join
            </Button>
          </div>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-white/40">
          <Users className="size-3.5" /> 2–8 players · base 1st-gen deck · 127 cards
        </p>
      </div>
    </div>
  );
}
