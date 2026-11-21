import { brandMeta } from "@/lib/brand";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { SetupForm } from "@/components/setup";
import { useApp } from "@/components/context";

export const Route = createFileRoute("/_site/setup")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "إطلاق المنصة | منصة الفهود الرياضية" },
      { name: "description", content: "إنشاء حساب مدير المنصة لأول مرة." },
      { property: "og:title", content: "إطلاق المنصة | منصة الفهود الرياضية" },
      { property: "og:description", content: "إنشاء حساب مدير المنصة لأول مرة." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: Page,
});
// The wizard closes itself the moment any account exists.
function Page() { const { data } = useApp(); if (data.ownerExists) return <Navigate to="/admin" />; return <SetupForm />; }
