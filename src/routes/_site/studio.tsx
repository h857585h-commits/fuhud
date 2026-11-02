import { createFileRoute } from "@tanstack/react-router";
import { StudioView } from "@/components/listing";

export const Route = createFileRoute("/_site/studio")({
  head: () => ({
    meta: [
      { title: "استوديو التصميم | كرة المنار" },
      { name: "description", content: "صمّم بوسترات المباريات وجداول الترتيب وبطاقات اللاعبين." },
      { property: "og:title", content: "استوديو التصميم | كرة المنار" },
      { property: "og:description", content: "صمّم بوسترات المباريات وجداول الترتيب وبطاقات اللاعبين." },
    ],
  }),
  component: () => <StudioView />,
});
