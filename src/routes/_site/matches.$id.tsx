import { createFileRoute } from "@tanstack/react-router";
import { MatchDetail } from "@/components/details";
import { useApp } from "@/components/context";
import { NotFoundView } from "@/components/not-found";

export const Route = createFileRoute("/_site/matches/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل المباراة | كرة المنار" },
      { name: "description", content: "تفاصيل المباراة والأحداث والتشكيلات." },
      { property: "og:title", content: "تفاصيل المباراة | كرة المنار" },
      { property: "og:description", content: "تفاصيل المباراة والأحداث والتشكيلات." },
    ],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { data } = useApp();
  const item = data.matches.find(x => x.id === Number(id));
  if (!item) return <NotFoundView />;
  return <MatchDetail key={item.id} id={item.id} />;
}
