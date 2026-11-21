import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { ArchiveView } from "@/components/archive";

export const Route = createFileRoute("/_site/archive")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "أرشيف المواسم | منصة الفهود الرياضية" },
      { name: "description", content: "أرشيف مواسم وبطولات الكرة الشعبية في الفهود." },
      { property: "og:title", content: "أرشيف المواسم | منصة الفهود الرياضية" },
      { property: "og:description", content: "أرشيف مواسم وبطولات الكرة الشعبية في الفهود." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: () => <ArchiveView />,
});
