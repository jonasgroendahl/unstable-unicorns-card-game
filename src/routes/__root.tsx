import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "#/components/ui/sonner.tsx";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "Unstable Unicorns | Play Online" },
      {
        name: "description",
        content:
          "Build a Unicorn Army, betray your friends, and play Unstable Unicorns online with 2–8 players.",
      },
      { name: "application-name", content: "Unstable Unicorns" },
      { name: "theme-color", content: "#140b2d" },
      { name: "color-scheme", content: "dark" },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Unstable Unicorns" },
      { property: "og:title", content: "Unstable Unicorns | Play Online" },
      {
        property: "og:description",
        content: "Build a Unicorn Army, betray your friends, and play online with 2–8 players.",
      },
      { property: "og:image", content: "/logo512.png" },
      { property: "og:image:alt", content: "A golden sparkle on a dark violet background" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Unstable Unicorns | Play Online" },
      {
        name: "twitter:description",
        content: "Build a Unicorn Army, betray your friends, and play online with 2–8 players.",
      },
      { name: "twitter:image", content: "/logo512.png" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Unstable Unicorns" },
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
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster theme="dark" position="top-center" richColors />
        <Scripts />
      </body>
    </html>
  );
}
