import { createFileRoute } from "@tanstack/react-router";
import { StatisticsView } from "@/components/competition";

export const Route = createFileRoute("/_site/statistics")({
  head: () => ({
    meta: [
      { title: "أبطال الإحصاءات | كرة المنار" },
      { name: "description", content: "الهدافون وصنّاع اللعب وإحصاءات البطولات." },
      { property: "og:title", content: "أبطال الإحصاءات | كرة المنار" },
      { property: "og:description", content: "الهدافون وصنّاع اللعب وإحصاءات البطولات." },
    ],
  }),
  component: () => <StatisticsView />,
});
