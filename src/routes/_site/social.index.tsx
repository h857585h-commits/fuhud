import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { SocialHub } from "@/components/social";

export const Route = createFileRoute("/_site/social/")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "الساحة | منصة الفهود الرياضية" },
      { name: "description", content: "ساحة جماهير الكرة الشعبية: منشورات وقصص ومقاطع." },
      { property: "og:title", content: "الساحة | منصة الفهود الرياضية" },
      { property: "og:description", content: "ساحة جماهير الكرة الشعبية: منشورات وقصص ومقاطع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: () => <SocialHub />,
});
