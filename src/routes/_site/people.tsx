import { createFileRoute } from "@tanstack/react-router";
import { PeopleView } from "@/components/people";

export const Route = createFileRoute("/_site/people")({
  head: () => ({
    meta: [
      { title: "الأصدقاء والمتابعون | كرة المنار" },
      { name: "description", content: "الأصدقاء والمتابعون في مجتمع كرة المنار." },
      { property: "og:title", content: "الأصدقاء والمتابعون | كرة المنار" },
      { property: "og:description", content: "الأصدقاء والمتابعون في مجتمع كرة المنار." },
    ],
  }),
  component: () => <PeopleView />,
});
