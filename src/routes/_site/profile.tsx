import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "@/components/profile";

export const Route = createFileRoute("/_site/profile")({
  head: () => ({
    meta: [
      { title: "ملفي الشخصي | كرة المنار" },
      { name: "description", content: "إدارة ملفك الشخصي في كرة المنار." },
      { property: "og:title", content: "ملفي الشخصي | كرة المنار" },
      { property: "og:description", content: "إدارة ملفك الشخصي في كرة المنار." },
    ],
  }),
  component: () => <ProfileView />,
});
