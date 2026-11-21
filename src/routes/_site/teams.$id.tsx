import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { TeamDetail } from "@/components/details";
import { useApp } from "@/components/context";
import { NotFoundView } from "@/components/not-found";

export const Route = createFileRoute("/_site/teams/$id")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "فريق | منصة الفهود الرياضية" },
      { name: "description", content: "ملف الفريق ولاعبوه ومبارياته." },
      { property: "og:title", content: "فريق | منصة الفهود الرياضية" },
      { property: "og:description", content: "ملف الفريق ولاعبوه ومبارياته." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
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
