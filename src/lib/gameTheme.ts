export const GAME_THEME_IDS = ["unstable-unicorns", "unhinged-hedgehogs"] as const;

export type GameThemeId = (typeof GAME_THEME_IDS)[number];

export interface FeaturedThemeArt {
  src: string;
  alt: string;
}

export interface GameTheme {
  id: GameThemeId;
  name: string;
  shortName: string;
  mark: string;
  pageTitle: string;
  description: string;
  badge: string;
  eyebrow: string;
  title: readonly [string, string];
  tagline: string;
  featuredArtLabel: string;
  featuredArt: readonly FeaturedThemeArt[];
  firstSticker: string;
  secondSticker: string;
  footerLead: string;
  footerAside: string;
  lobbyHeading: string;
  lobbyDescription: string;
  historyHeading: string;
  historyDescription: string;
  championsHeading: string;
}

export const DEFAULT_GAME_THEME_ID: GameThemeId = "unstable-unicorns";

export const GAME_THEMES: Record<GameThemeId, GameTheme> = {
  "unstable-unicorns": {
    id: "unstable-unicorns",
    name: "Unstable Unicorns",
    shortName: "UU",
    mark: "/favicon.svg",
    pageTitle: "Unstable Unicorns | Play Online",
    description:
      "Build a Unicorn Army, betray your friends, and play Unstable Unicorns online with 2–8 players.",
    badge: "Second edition",
    eyebrow: "The friendship-destroying card game",
    title: ["Unstable", "Unicorns"],
    tagline: "Build your army. Play your magic. Betray your friends before they betray you.",
    featuredArtLabel: "Featured unicorn cards",
    featuredArt: [
      { src: "/cards/magical-kittencorn.jpg", alt: "Magical Kittencorn card" },
      { src: "/cards/rainbow-unicorn.jpg", alt: "Rainbow Unicorn card" },
      { src: "/cards/stabby-the-unicorn.jpg", alt: "Stabby the Unicorn card" },
      { src: "/cards/unicorn-phoenix.jpg", alt: "Unicorn Phoenix card" },
    ],
    firstSticker: "Friends?",
    secondSticker: "100% chaos",
    footerLead: "Unicorns are your friends now.",
    footerAside: "Probably.",
    lobbyHeading: "Gather your unicorn army",
    lobbyDescription:
      "Invite your friends, pick the deck, then unleash a completely reasonable amount of chaos.",
    historyHeading: "Legends of the stable",
    historyDescription:
      "Every glorious victory, devastating betrayal, and suspiciously lucky unicorn draw.",
    championsHeading: "Unicorn champions",
  },
  "unhinged-hedgehogs": {
    id: "unhinged-hedgehogs",
    name: "Unhinged Hedgehogs",
    shortName: "UH",
    mark: "/themes/unhinged-hedgehogs/mark.svg",
    pageTitle: "Unhinged Hedgehogs | Play Online",
    description:
      "Gather a prickly crew, outplay your friends, and play Unhinged Hedgehogs online with 2–8 players.",
    badge: "Public preview",
    eyebrow: "The friendship-prickling card game",
    title: ["Unhinged", "Hedgehogs"],
    tagline:
      "Gather your crew. Sharpen your strategy. Cause a perfectly reasonable amount of chaos.",
    featuredArtLabel: "Featured hedgehog crew",
    featuredArt: [
      {
        src: "/themes/unhinged-hedgehogs/cards/stabby-the-unicorn.svg",
        alt: "Pointy Pete",
      },
      {
        src: "/themes/unhinged-hedgehogs/cards/rainbow-unicorn.svg",
        alt: "Prism Prickles",
      },
      {
        src: "/themes/unhinged-hedgehogs/cards/blatant-thievery.svg",
        alt: "Brazen Burglary",
      },
      {
        src: "/themes/unhinged-hedgehogs/cards/queen-bee-unicorn.svg",
        alt: "Queen Bristle",
      },
    ],
    firstSticker: "Cuddly?",
    secondSticker: "100% prickly",
    footerLead: "Hedgehogs have entered the chat.",
    footerAside: "Handle with care.",
    lobbyHeading: "Gather your hedgehog crew",
    lobbyDescription:
      "Invite your friends, pick the deck, then unleash a completely reasonable amount of prickly chaos.",
    historyHeading: "Legends of the burrow",
    historyDescription:
      "Every glorious victory, devastating betrayal, and suspiciously lucky hedgehog draw.",
    championsHeading: "Hedgehog champions",
  },
};

export const GAME_THEME_OPTIONS = GAME_THEME_IDS.map((id) => GAME_THEMES[id]);

export function isGameThemeId(value: string | null): value is GameThemeId {
  return GAME_THEME_IDS.includes(value as GameThemeId);
}
