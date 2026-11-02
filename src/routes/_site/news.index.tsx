import { createFileRoute } from "@tanstack/react-router";
import { NewsView } from "@/components/listing";

export const Route = createFileRoute("/_site/news/")({
  head: () => ({
    meta: [
      { title: "من قلب الملاعب | كرة المنار" },
      { name: "description", content: "آخر أخبار الفرق الشعبية والبطولات في الناصرية." },
      { property: "og:title", content: "من قلب الملاعب | كرة المنار" },
      { property: "og:description", content: "آخر أخبار الفرق الشعبية والبطولات في الناصرية." },
    ],
  }),
  component: () => <NewsView />,
});
