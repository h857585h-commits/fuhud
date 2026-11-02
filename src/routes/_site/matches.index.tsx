import { createFileRoute } from "@tanstack/react-router";
import { MatchesView } from "@/components/listing";

export const Route = createFileRoute("/_site/matches/")({
  head: () => ({
    meta: [
      { title: "جدول المواجهات | كرة المنار" },
      { name: "description", content: "جدول مباريات الفرق الشعبية في الناصرية: مباشر، قادم ومنتهٍ." },
      { property: "og:title", content: "جدول المواجهات | كرة المنار" },
      { property: "og:description", content: "جدول مباريات الفرق الشعبية في الناصرية: مباشر، قادم ومنتهٍ." },
    ],
  }),
  component: () => <MatchesView />,
});
