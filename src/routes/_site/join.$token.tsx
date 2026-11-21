import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { JoinPage } from "@/components/chat";

export const Route = createFileRoute("/_site/join/$token")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "دعوة مجموعة | منصة الفهود الرياضية" },
      { name: "description", content: "انضم إلى مجموعة محادثة في منصة الفهود الرياضية." },
      { property: "og:title", content: "دعوة مجموعة | منصة الفهود الرياضية" },
      { property: "og:description", content: "انضم إلى مجموعة محادثة في منصة الفهود الرياضية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: Page,
});
function Page() { const { token } = Route.useParams(); return <JoinPage token={token} />; }
