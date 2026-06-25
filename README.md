# 🦄 Unstable Unicorns

A complete, playable digital build of the card game **Unstable Unicorns** (base
1st‑generation / Kickstarter deck) — realtime multiplayer for **2–8 players**,
with a Hearthstone‑inspired board, animations, and procedural sound.

Build a Unicorn Army, betray your friends. Unicorns are your friends now.

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

- **Quick Play** (`/debug`) — start a full game instantly with hotseat humans
  - AI bots, no lobby needed. One screen, switchable viewpoint. Best for testing.
- **Host game** — creates a lobby with a join code; add bots, then start.
- **Join** — enter a friend's join code to take a seat.
- **Find 4-player game** — join the solo queue and start automatically when four
  active players are ready.

## What's implemented

- **All 84 base‑deck cards** (127 copies) with exact 2nd‑edition rules text, art,
  and fully implemented effects — Magical Unicorns, Magic, Upgrades, Downgrades,
  Neigh / Super Neigh, and every aura/replacement/triggered interaction.
- **The Neigh reaction window** — when any card is played, every eligible player
  gets a ~20-second window to Neigh it. Neighs chain (odd count cancels, even
  resolves); Super Neigh ends the chain. Yay / Slowdown / Ginormous are honored.
- **Continuous auras & edge cases** — Pandamonium (Pandas do not count toward
  victory and are immune to _targeted_ unicorn effects), Blinding Light, Queen Bee, Rainbow Aura, Tiny Stable,
  Barbed Wire, Black Knight & Phoenix replacement effects, Unicorn Lasso borrow/
  return, Puppicorn relocation, Change of Luck extra turns, and more.
- **Realtime multiplayer** — authoritative live engine on the server, SSE push
  of per-player sanitized state, commands via server functions, and durable
  settled snapshots in Postgres. Bots play themselves server-side.

## Architecture

```
Browser (React) ──command (server fn)──▶ GameEngine (live, authoritative)
       ▲                                      │             │
       └────── SSE sanitized state ◀──────────┘             ▼
                                               Neon Postgres snapshots
```

- `src/game/` — the pure, framework‑free rules engine (unit‑tested).
  - `engine/GameEngine.ts` — command queue, deferred‑based player choices,
    chokepoints (`destroy`/`sacrifice`/`moveUnicornToStable`), reaction chain,
    state‑based actions, turn flow.
  - `derive.ts` — the effective‑identity selector layer (auras rewrite what a
    card _is_; every chokepoint reads through here).
  - `cards/` — `cardData.ts` (generated) + `effects/*` (per‑card behavior).
  - `ai/bot.ts` — simple auto‑responder bots.
- `src/server/` — `registry.ts` (lobbies + live engines) and `actions.ts`
  (lobby + command server functions).
- `src/routes/api/stream.$gameId.tsx` — the SSE stream.
- `src/components/game/` — the board UI; `src/lib/gameClient.ts` abstracts local
  (in‑process) vs. remote (SSE) play behind one interface.

Live engines, SSE subscribers, and the solo matchmaking queue are process-local,
so run one active app instance. Lobby data and settled game snapshots are stored
in Postgres and hydrated after a restart. If the process restarts during a card
choice or Neigh window, that in-flight command rolls back to the last settled
snapshot.

## Database

Neon Postgres is accessed through Prisma ORM with the Postgres driver adapter.
Copy a Neon connection string into `DATABASE_URL`, then apply the schema:

```bash
cp .env.example .env.local
vp run db:migrate
```

Without `DATABASE_URL`, development and tests fall back to process memory and
print a warning. Never expose `DATABASE_URL` through a `VITE_` variable.

## Optional support link

Set `VITE_PAYPAL_DONATE_URL` to a PayPal.Me link or a PayPal-hosted donation
link to show a small "Tip" action on the home screen and a "Support" link in
the footer.

## Card data

Card text and art were scraped from the community wiki + unicornsdatabase and
live in `data/cards_research.json`. Regenerate the typed table with:

```bash
pnpm gen-cards
```

Art is in `public/cards/<slug>.{jpg,png}`.

## Audio

Sound effects and fallback background music are synthesized at runtime via the
Web Audio API. To use custom music, drop an MP3/OGG at
`public/audio/music.mp3`; Vite copies it to `.output/public/audio/music.mp3` for
production and it will loop automatically. Volume and mute persist to
`localStorage`.

## Scripts

```bash
pnpm dev        # dev server
pnpm build      # production build (Nitro server output in .output/)
pnpm test       # engine unit tests (vitest, deterministic via seeded RNG)
pnpm gen-cards  # regenerate src/game/cards/cardData.ts from research JSON
vp run db:migrate # apply the Postgres schema
vp run db:generate # regenerate Prisma Client after schema changes
```

## Tech

TanStack Start + Router · Nitro · React 19 · Tailwind v4 · shadcn/ui · Prisma ·
Neon Postgres · Vitest.
