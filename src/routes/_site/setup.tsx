import { createFileRoute, Navigate } from "@tanstack/react-router";
import { SetupForm } from "@/components/setup";
import { useApp } from "@/components/context";

export const Route = createFileRoute("/_site/setup")({
  head: () => ({
    meta: [
      { title: "إطلاق المنصة | كرة المنار" },
      { name: "description", content: "إنشاء حساب مدير المنصة لأول مرة." },
      { property: "og:title", content: "إطلاق المنصة | كرة المنار" },
      { property: "og:description", content: "إنشاء حساب مدير المنصة لأول مرة." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});
// The wizard closes itself the moment any account exists.
function Page() { const { data } = useApp(); if (data.ownerExists) return <Navigate to="/admin" />; return <SetupForm />; }
