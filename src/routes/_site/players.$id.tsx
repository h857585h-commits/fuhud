import { createFileRoute } from "@tanstack/react-router";
import { PlayerDetail } from "@/components/details";
import { useApp } from "@/components/context";
import { NotFoundView } from "@/components/not-found";

export const Route = createFileRoute("/_site/players/$id")({
  head: () => ({
    meta: [
      { title: "لاعب | كرة المنار" },
      { name: "description", content: "ملف اللاعب وإحصاءاته ومسيرته." },
      { property: "og:title", content: "لاعب | كرة المنار" },
      { property: "og:description", content: "ملف اللاعب وإحصاءاته ومسيرته." },
    ],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { data } = useApp();
  const item = data.players.find(x => x.id === Number(id));
  if (!item) return <NotFoundView />;
  return <PlayerDetail id={item.id} />;
}
