import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardView } from "@/components/dashboard";

export const Route = createFileRoute("/_site/admin")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "لوحة مدير المنصة | منصة الفهود الرياضية" },
      { name: "description", content: "لوحة إدارة منصة منصة الفهود الرياضية." },
      { property: "og:title", content: "لوحة مدير المنصة | منصة الفهود الرياضية" },
      { property: "og:description", content: "لوحة إدارة منصة منصة الفهود الرياضية." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: () => <DashboardView />,
});
