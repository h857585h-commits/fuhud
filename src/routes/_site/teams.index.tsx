import { createFileRoute } from "@tanstack/react-router";
import { TeamsView } from "@/components/listing";

export const Route = createFileRoute("/_site/teams/")({
  head: () => ({
    meta: [
      { title: "الفرق الشعبية | كرة المنار" },
      { name: "description", content: "فرق الأحياء الشعبية في الناصرية." },
      { property: "og:title", content: "الفرق الشعبية | كرة المنار" },
      { property: "og:description", content: "فرق الأحياء الشعبية في الناصرية." },
    ],
  }),
  component: () => <TeamsView />,
});
