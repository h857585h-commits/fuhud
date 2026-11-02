import { createFileRoute } from "@tanstack/react-router";
import { TournamentDetail } from "@/components/competition";
import { useApp } from "@/components/context";
import { NotFoundView } from "@/components/not-found";

export const Route = createFileRoute("/_site/tournaments/$id")({
  head: () => ({
    meta: [
      { title: "بطولة | كرة المنار" },
      { name: "description", content: "جدول البطولة ومبارياتها." },
      { property: "og:title", content: "بطولة | كرة المنار" },
      { property: "og:description", content: "جدول البطولة ومبارياتها." },
    ],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { data } = useApp();
  const item = data.tournaments.find(x => x.id === Number(id));
  if (!item) return <NotFoundView />;
  return <TournamentDetail key={item.id} id={item.id} />;
}
