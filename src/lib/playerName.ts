export const PLAYER_NAME_STORAGE_KEY = "uu.player.name";

const ADJECTIVES = [
  "Cosmic",
  "Disco",
  "Fizzy",
  "Glitter",
  "Lucky",
  "Magic",
  "Mighty",
  "Neon",
  "Royal",
  "Turbo",
] as const;

const UNICORNS = [
  "Dreamhoof",
  "Moonhorn",
  "Neighstar",
  "Rainbow",
  "Sparkle",
  "Starhoof",
  "Sugarhorn",
  "Twinkle",
] as const;

interface PlayerNameStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createUnicornName(random = Math.random): string {
  const adjective = ADJECTIVES[Math.floor(random() * ADJECTIVES.length)] ?? ADJECTIVES[0];
  const unicorn = UNICORNS[Math.floor(random() * UNICORNS.length)] ?? UNICORNS[0];
  return `${adjective} ${unicorn}`;
}

export function loadOrCreatePlayerName(
  storage: PlayerNameStorage | undefined = getLocalStorage(),
): string {
  if (storage) {
    try {
      const storedName = storage.getItem(PLAYER_NAME_STORAGE_KEY)?.trim();
      if (storedName && storedName.length <= 20) return storedName;
    } catch {
      // A generated name still lets the player jump in when storage is unavailable.
    }
  }

  const generatedName = createUnicornName();
  savePlayerName(generatedName, storage);
  return generatedName;
}

export function savePlayerName(
  name: string,
  storage: PlayerNameStorage | undefined = getLocalStorage(),
): void {
  const validName = name.trim();
  if (!storage || !validName || validName.length > 20) return;

  try {
    storage.setItem(PLAYER_NAME_STORAGE_KEY, validName);
  } catch {
    // Keep the game usable when storage is blocked or full.
  }
}

function getLocalStorage(): PlayerNameStorage | undefined {
  return typeof localStorage === "undefined" ? undefined : localStorage;
}
