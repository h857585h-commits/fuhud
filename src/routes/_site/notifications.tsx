import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { NotificationsView } from "@/components/notifications";

export const Route = createFileRoute("/_site/notifications")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "الإشعارات | منصة الفهود الرياضية" },
      { name: "description", content: "إشعاراتك في منصة الفهود الرياضية." },
      { property: "og:title", content: "الإشعارات | منصة الفهود الرياضية" },
      { property: "og:description", content: "إشعاراتك في منصة الفهود الرياضية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: () => <NotificationsView />,
});
