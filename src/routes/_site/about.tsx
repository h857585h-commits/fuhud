import { createFileRoute } from "@tanstack/react-router";
import { AboutView } from "@/components/about";

export const Route = createFileRoute("/_site/about")({
  head: () => ({
    meta: [
      { title: "من نحن | كرة المنار" },
      { name: "description", content: "تعرّف على كرة المنار، منصة الفرق الشعبية في الناصرية." },
      { property: "og:title", content: "من نحن | كرة المنار" },
      { property: "og:description", content: "تعرّف على كرة المنار، منصة الفرق الشعبية في الناصرية." },
    ],
  }),
  component: () => <AboutView />,
});
