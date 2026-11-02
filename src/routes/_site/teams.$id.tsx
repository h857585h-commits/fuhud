import { createFileRoute } from "@tanstack/react-router";
import { TeamDetail } from "@/components/details";
import { useApp } from "@/components/context";
import { NotFoundView } from "@/components/not-found";

export const Route = createFileRoute("/_site/teams/$id")({
  head: () => ({
    meta: [
      { title: "فريق | كرة المنار" },
      { name: "description", content: "ملف الفريق ولاعبوه ومبارياته." },
      { property: "og:title", content: "فريق | كرة المنار" },
      { property: "og:description", content: "ملف الفريق ولاعبوه ومبارياته." },
    ],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { data } = useApp();
  const item = data.teams.find(x => x.id === Number(id));
  if (!item) return <NotFoundView />;
  return <TeamDetail id={item.id} />;
}
