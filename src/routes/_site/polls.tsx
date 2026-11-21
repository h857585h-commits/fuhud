import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { PollsView } from "@/components/listing";

export const Route = createFileRoute("/_site/polls")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "صوت المدرجات | منصة الفهود الرياضية" },
      { name: "description", content: "استفتاءات جماهير الكرة الشعبية في الفهود." },
      { property: "og:title", content: "صوت المدرجات | منصة الفهود الرياضية" },
      { property: "og:description", content: "استفتاءات جماهير الكرة الشعبية في الفهود." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: () => <PollsView />,
});
