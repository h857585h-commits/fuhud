import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { NewsDetail } from "@/components/details";
import { useApp } from "@/components/context";
import { NotFoundView } from "@/components/not-found";

export const Route = createFileRoute("/_site/news/$id")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "خبر | منصة الفهود الرياضية" },
      { name: "description", content: "خبر من قلب ملاعب الفهود." },
      { property: "og:title", content: "خبر | منصة الفهود الرياضية" },
      { property: "og:description", content: "خبر من قلب ملاعب الفهود." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { data } = useApp();
  const item = data.news.find(x => x.id === Number(id));
  if (!item) return <NotFoundView />;
  return <NewsDetail id={item.id} />;
}
