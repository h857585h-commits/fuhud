import { createFileRoute } from "@tanstack/react-router";
import { TournamentsView } from "@/components/listing";

export const Route = createFileRoute("/_site/tournaments/")({
  head: () => ({
    meta: [
      { title: "بطولات الأحياء | كرة المنار" },
      { name: "description", content: "دوريات وكؤوس الأحياء في الناصرية." },
      { property: "og:title", content: "بطولات الأحياء | كرة المنار" },
      { property: "og:description", content: "دوريات وكؤوس الأحياء في الناصرية." },
    ],
  }),
  component: () => <TournamentsView />,
});
