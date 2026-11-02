import { createFileRoute } from "@tanstack/react-router";
import { NotificationsView } from "@/components/notifications";

export const Route = createFileRoute("/_site/notifications")({
  head: () => ({
    meta: [
      { title: "الإشعارات | كرة المنار" },
      { name: "description", content: "إشعاراتك في كرة المنار." },
      { property: "og:title", content: "الإشعارات | كرة المنار" },
      { property: "og:description", content: "إشعاراتك في كرة المنار." },
    ],
  }),
  component: () => <NotificationsView />,
});
