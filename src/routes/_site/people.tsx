import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { PeopleView } from "@/components/people";

export const Route = createFileRoute("/_site/people")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "الأصدقاء والمتابعون | منصة الفهود الرياضية" },
      { name: "description", content: "الأصدقاء والمتابعون في مجتمع منصة الفهود الرياضية." },
      { property: "og:title", content: "الأصدقاء والمتابعون | منصة الفهود الرياضية" },
      { property: "og:description", content: "الأصدقاء والمتابعون في مجتمع منصة الفهود الرياضية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: () => <PeopleView />,
});
