import { createFileRoute } from "@tanstack/react-router";
import { DashboardView } from "@/components/dashboard";

export const Route = createFileRoute("/_site/team-admin")({
  head: () => ({
    meta: [
      { title: "لوحة الفريق | كرة المنار" },
      { name: "description", content: "لوحة إدارة الفريق في كرة المنار." },
      { property: "og:title", content: "لوحة الفريق | كرة المنار" },
      { property: "og:description", content: "لوحة إدارة الفريق في كرة المنار." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <DashboardView teamMode />,
});
