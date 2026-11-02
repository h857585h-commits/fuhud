import { createFileRoute } from "@tanstack/react-router";
import { NewsDetail } from "@/components/details";
import { useApp } from "@/components/context";
import { NotFoundView } from "@/components/not-found";

export const Route = createFileRoute("/_site/news/$id")({
  head: () => ({
    meta: [
      { title: "خبر | كرة المنار" },
      { name: "description", content: "خبر من قلب ملاعب الناصرية." },
      { property: "og:title", content: "خبر | كرة المنار" },
      { property: "og:description", content: "خبر من قلب ملاعب الناصرية." },
    ],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { data } = useApp();
  const item = data.news.find(x => x.id === Number(id));
  if (!item) return <NotFoundView />;
  return <NewsDetail id={item.id} />;
}
