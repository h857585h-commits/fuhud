import { createFileRoute } from "@tanstack/react-router";
import { StandingsView } from "@/components/competition";

export const Route = createFileRoute("/_site/standings")({
  head: () => ({
    meta: [
      { title: "جدول الترتيب | كرة المنار" },
      { name: "description", content: "جداول ترتيب بطولات الأحياء في الناصرية." },
      { property: "og:title", content: "جدول الترتيب | كرة المنار" },
      { property: "og:description", content: "جداول ترتيب بطولات الأحياء في الناصرية." },
    ],
  }),
  component: () => <StandingsView />,
});
