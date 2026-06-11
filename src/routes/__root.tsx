import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "#/components/ui/sonner.tsx";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Unstable Unicorns" },
      {
        name: "description",
        content:
          "Build a Unicorn Army, betray your friends. A digital, realtime multiplayer build of Unstable Unicorns.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
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
