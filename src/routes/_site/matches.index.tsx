import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { MatchesView } from "@/components/listing";

export const Route = createFileRoute("/_site/matches/")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "جدول المواجهات | منصة الفهود الرياضية" },
      { name: "description", content: "جدول مباريات الفرق الشعبية في الفهود: مباشر، قادم ومنتهٍ." },
      { property: "og:title", content: "جدول المواجهات | منصة الفهود الرياضية" },
      { property: "og:description", content: "جدول مباريات الفرق الشعبية في الفهود: مباشر، قادم ومنتهٍ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: () => <MatchesView />,
});
