import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { NewsView } from "@/components/listing";

export const Route = createFileRoute("/_site/news/")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "من قلب الملاعب | منصة الفهود الرياضية" },
      { name: "description", content: "آخر أخبار الفرق الشعبية والبطولات في الفهود." },
      { property: "og:title", content: "من قلب الملاعب | منصة الفهود الرياضية" },
      { property: "og:description", content: "آخر أخبار الفرق الشعبية والبطولات في الفهود." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: () => <NewsView />,
});
