import { createFileRoute } from "@tanstack/react-router";
import { HomeView } from "@/components/home";

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "كرة المنار | نبض الكرة الشعبية في الناصرية" },
      { name: "description", content: "منصة الفرق الشعبية في الناصرية. مباريات مباشرة، نتائج، ترتيب البطولات، تشكيلات وبوسترات كروية بهوية كرة المنار." },
      { property: "og:title", content: "كرة المنار | نبض الكرة الشعبية في الناصرية" },
      { property: "og:description", content: "منصة الفرق الشعبية في الناصرية. مباريات مباشرة، نتائج، ترتيب البطولات، تشكيلات وبوسترات كروية بهوية كرة المنار." },
    ],
  }),
  component: () => <HomeView />,
});
