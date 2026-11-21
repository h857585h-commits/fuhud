import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { PlayerDetail } from "@/components/details";
import { useApp } from "@/components/context";
import { NotFoundView } from "@/components/not-found";

export const Route = createFileRoute("/_site/players/$id")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "لاعب | منصة الفهود الرياضية" },
      { name: "description", content: "ملف اللاعب وإحصاءاته ومسيرته." },
      { property: "og:title", content: "لاعب | منصة الفهود الرياضية" },
      { property: "og:description", content: "ملف اللاعب وإحصاءاته ومسيرته." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
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
