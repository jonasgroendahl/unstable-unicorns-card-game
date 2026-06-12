// Server-Sent Events stream: pushes per-player sanitized game state on every
// engine change. The client opens EventSource(`/api/stream/<gameId>?playerId=...`).

import { createFileRoute } from "@tanstack/react-router";
import { registry } from "../../server/registry";
import { sanitizeFor } from "../../game/view";

export const Route = createFileRoute("/api/stream/$gameId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const url = new URL(request.url);
        const playerId = url.searchParams.get("playerId") ?? "";
        const gameId = params.gameId;
        const connId = `${playerId}_${Math.random().toString(36).slice(2)}`;
        const engine = await registry.getEngine(gameId);

        const encoder = new TextEncoder();
        let unsub = () => {};

        const stream = new ReadableStream({
          start(controller) {
            const send = (data: unknown) => {
              try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
              } catch {
                /* closed */
              }
            };

            const pushState = () => {
              if (engine) send({ type: "state", view: sanitizeFor(engine.state, playerId) });
            };

            // Subscribe to engine changes for this game.
            unsub = registry.subscribe(gameId, connId, (state) => {
              send({ type: "state", view: sanitizeFor(state, playerId) });
            });

            // Initial frame + keepalive.
            pushState();
            const keepalive = setInterval(() => {
              try {
                controller.enqueue(encoder.encode(`: ping\n\n`));
              } catch {
                clearInterval(keepalive);
              }
            }, 15000);

            const cleanup = () => {
              clearInterval(keepalive);
              unsub();
              try {
                controller.close();
              } catch {
                /* already closed */
              }
            };
            request.signal.addEventListener("abort", cleanup);
          },
          cancel() {
            unsub();
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
    },
  },
});
