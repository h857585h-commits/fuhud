import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { StandingsView } from "@/components/competition";

export const Route = createFileRoute("/_site/standings")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "جدول الترتيب | منصة الفهود الرياضية" },
      { name: "description", content: "جداول ترتيب بطولات الأحياء في الفهود." },
      { property: "og:title", content: "جدول الترتيب | منصة الفهود الرياضية" },
      { property: "og:description", content: "جداول ترتيب بطولات الأحياء في الفهود." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: () => <StandingsView />,
});
