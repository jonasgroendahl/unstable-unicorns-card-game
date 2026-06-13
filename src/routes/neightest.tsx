import { createFileRoute } from "@tanstack/react-router";
import { NeighedScene } from "#/components/game/NeighedScene.tsx";

export const Route = createFileRoute("/neightest")({ component: NeighTest });

function NeighTest() {
  return (
    <div className="uu-root uu-starfield h-dvh">
      <NeighedScene
        event={{
          t: 1,
          mine: true,
          ownerName: "You",
          card: {
            instanceId: "x",
            slug: "americorn",
            name: "Americorn",
            kind: "magical",
            cardClass: "unicorn",
            text: "When this card enters your Stable, you may take a card at random from any player's hand.",
            image: "/cards/americorn.jpg",
            ownerId: null,
          },
        }}
        onDismiss={() => {}}
      />
    </div>
  );
}
