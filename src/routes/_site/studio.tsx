import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { StudioView } from "@/components/listing";

export const Route = createFileRoute("/_site/studio")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "استوديو التصميم | منصة الفهود الرياضية" },
      { name: "description", content: "صمّم بوسترات المباريات وجداول الترتيب وبطاقات اللاعبين." },
      { property: "og:title", content: "استوديو التصميم | منصة الفهود الرياضية" },
      { property: "og:description", content: "صمّم بوسترات المباريات وجداول الترتيب وبطاقات اللاعبين." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: () => <StudioView />,
});
