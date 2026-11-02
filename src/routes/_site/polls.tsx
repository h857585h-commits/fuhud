import { createFileRoute } from "@tanstack/react-router";
import { PollsView } from "@/components/listing";

export const Route = createFileRoute("/_site/polls")({
  head: () => ({
    meta: [
      { title: "صوت المدرجات | كرة المنار" },
      { name: "description", content: "استفتاءات جماهير الكرة الشعبية في الناصرية." },
      { property: "og:title", content: "صوت المدرجات | كرة المنار" },
      { property: "og:description", content: "استفتاءات جماهير الكرة الشعبية في الناصرية." },
    ],
  }),
  component: () => <PollsView />,
});
