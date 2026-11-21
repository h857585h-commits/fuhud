import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { TeamsView } from "@/components/listing";

export const Route = createFileRoute("/_site/teams/")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "الفرق الشعبية | منصة الفهود الرياضية" },
      { name: "description", content: "فرق الأحياء الشعبية في الفهود." },
      { property: "og:title", content: "الفرق الشعبية | منصة الفهود الرياضية" },
      { property: "og:description", content: "فرق الأحياء الشعبية في الفهود." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: () => <TeamsView />,
});
