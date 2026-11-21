import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { TournamentDetail } from "@/components/competition";
import { useApp } from "@/components/context";
import { NotFoundView } from "@/components/not-found";

export const Route = createFileRoute("/_site/tournaments/$id")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "بطولة | منصة الفهود الرياضية" },
      { name: "description", content: "جدول البطولة ومبارياتها." },
      { property: "og:title", content: "بطولة | منصة الفهود الرياضية" },
      { property: "og:description", content: "جدول البطولة ومبارياتها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
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
