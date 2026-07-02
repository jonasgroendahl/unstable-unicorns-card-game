import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { GameThemeProvider } from "#/components/theme/GameThemeProvider.tsx";
import { Toaster } from "#/components/ui/sonner.tsx";
import { TooltipProvider } from "#/components/ui/tooltip.tsx";
import { VoiceRouteProvider } from "#/components/voice/VoiceSessionProvider.tsx";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "Card Party | Play Online" },
      {
        name: "description",
        content: "Pick a theme, gather your friends, and play a chaotic card game online.",
      },
      { name: "application-name", content: "Card Party" },
      { name: "theme-color", content: "#140b2d" },
      { name: "color-scheme", content: "dark" },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Card Party" },
      { property: "og:title", content: "Card Party | Play Online" },
      {
        property: "og:description",
        content: "Pick a theme, gather your friends, and play a chaotic card game online.",
      },
      { property: "og:image", content: "/logo512.png" },
      { property: "og:image:alt", content: "A golden sparkle on a dark violet background" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Card Party | Play Online" },
      {
        name: "twitter:description",
        content: "Pick a theme, gather your friends, and play a chaotic card game online.",
      },
      { name: "twitter:image", content: "/logo512.png" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Card Party" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "alternate icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/logo192.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" data-game-theme="unstable-unicorns">
      <head>
        <HeadContent />
      </head>
      <body>
        <GameThemeProvider>
          <TooltipProvider>
            <VoiceRouteProvider>
              {children}
              <Toaster theme="dark" position="top-center" richColors />
            </VoiceRouteProvider>
          </TooltipProvider>
        </GameThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
