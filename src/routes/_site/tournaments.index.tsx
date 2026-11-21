import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { TournamentsView } from "@/components/listing";

export const Route = createFileRoute("/_site/tournaments/")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "بطولات الأحياء | منصة الفهود الرياضية" },
      { name: "description", content: "دوريات وكؤوس الأحياء في الفهود." },
      { property: "og:title", content: "بطولات الأحياء | منصة الفهود الرياضية" },
      { property: "og:description", content: "دوريات وكؤوس الأحياء في الفهود." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: () => <TournamentsView />,
});
