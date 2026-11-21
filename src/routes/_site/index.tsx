import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { HomeView } from "@/components/home";

export const Route = createFileRoute("/_site/")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "منصة الفهود الرياضية | نبض الكرة الشعبية في الفهود" },
      { name: "description", content: "منصة الفرق الشعبية في الفهود. مباريات مباشرة، نتائج، ترتيب البطولات، تشكيلات وبوسترات كروية بهوية منصة الفهود الرياضية." },
      { property: "og:title", content: "منصة الفهود الرياضية | نبض الكرة الشعبية في الفهود" },
      { property: "og:description", content: "منصة الفرق الشعبية في الفهود. مباريات مباشرة، نتائج، ترتيب البطولات، تشكيلات وبوسترات كروية بهوية منصة الفهود الرياضية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: () => <HomeView />,
});
