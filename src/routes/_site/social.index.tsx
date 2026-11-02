import { createFileRoute } from "@tanstack/react-router";
import { SocialHub } from "@/components/social";

export const Route = createFileRoute("/_site/social/")({
  head: () => ({
    meta: [
      { title: "الساحة | كرة المنار" },
      { name: "description", content: "ساحة جماهير الكرة الشعبية: منشورات وقصص ومقاطع." },
      { property: "og:title", content: "الساحة | كرة المنار" },
      { property: "og:description", content: "ساحة جماهير الكرة الشعبية: منشورات وقصص ومقاطع." },
    ],
  }),
  component: () => <SocialHub />,
});
