import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "@/components/profile";

export const Route = createFileRoute("/_site/profile")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "ملفي الشخصي | منصة الفهود الرياضية" },
      { name: "description", content: "إدارة ملفك الشخصي في منصة الفهود الرياضية." },
      { property: "og:title", content: "ملفي الشخصي | منصة الفهود الرياضية" },
      { property: "og:description", content: "إدارة ملفك الشخصي في منصة الفهود الرياضية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: () => <ProfileView />,
});
