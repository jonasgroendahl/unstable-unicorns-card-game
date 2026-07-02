function mutedStorageKey(gameId: string) {
  return `uu.voice.muted.${gameId}`;
}

export function readMutedPlayers(gameId: string, storage: Storage = sessionStorage): Set<string> {
  try {
    const value: unknown = JSON.parse(storage.getItem(mutedStorageKey(gameId)) ?? "[]");
    return new Set(
      Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [],
    );
  } catch {
    return new Set();
  }
}

export function writeMutedPlayers(
  gameId: string,
  players: Set<string>,
  storage: Storage = sessionStorage,
) {
  storage.setItem(mutedStorageKey(gameId), JSON.stringify([...players]));
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])"),
  );
}

export function isVoiceToggleShortcut(
  event: Pick<
    KeyboardEvent,
    "key" | "repeat" | "altKey" | "ctrlKey" | "metaKey" | "defaultPrevented" | "target"
  >,
): boolean {
  return (
    event.key.toLowerCase() === "m" &&
    !event.repeat &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.defaultPrevented &&
    !isEditableTarget(event.target)
  );
}
