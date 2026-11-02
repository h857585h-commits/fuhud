import { createFileRoute } from "@tanstack/react-router";
import { DashboardView } from "@/components/dashboard";

export const Route = createFileRoute("/_site/admin")({
  head: () => ({
    meta: [
      { title: "لوحة مدير المنصة | كرة المنار" },
      { name: "description", content: "لوحة إدارة منصة كرة المنار." },
      { property: "og:title", content: "لوحة مدير المنصة | كرة المنار" },
      { property: "og:description", content: "لوحة إدارة منصة كرة المنار." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <DashboardView />,
});
