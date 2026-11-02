import { createFileRoute } from "@tanstack/react-router";
import { ArchiveView } from "@/components/archive";

export const Route = createFileRoute("/_site/archive")({
  head: () => ({
    meta: [
      { title: "أرشيف المواسم | كرة المنار" },
      { name: "description", content: "أرشيف مواسم وبطولات الكرة الشعبية في الناصرية." },
      { property: "og:title", content: "أرشيف المواسم | كرة المنار" },
      { property: "og:description", content: "أرشيف مواسم وبطولات الكرة الشعبية في الناصرية." },
    ],
  }),
  component: () => <ArchiveView />,
});
