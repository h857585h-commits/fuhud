import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { StatisticsView } from "@/components/competition";

export const Route = createFileRoute("/_site/statistics")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "أبطال الإحصاءات | منصة الفهود الرياضية" },
      { name: "description", content: "الهدافون وصنّاع اللعب وإحصاءات البطولات." },
      { property: "og:title", content: "أبطال الإحصاءات | منصة الفهود الرياضية" },
      { property: "og:description", content: "الهدافون وصنّاع اللعب وإحصاءات البطولات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: () => <StatisticsView />,
});
