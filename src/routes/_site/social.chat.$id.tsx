import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { ChatRoom } from "@/components/chat";

export const Route = createFileRoute("/_site/social/chat/$id")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "محادثة | منصة الفهود الرياضية" },
      { name: "description", content: "محادثتك في منصة الفهود الرياضية." },
      { property: "og:title", content: "محادثة | منصة الفهود الرياضية" },
      { property: "og:description", content: "محادثتك في منصة الفهود الرياضية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: Page,
});
function Page() { const { id } = Route.useParams(); return <ChatRoom id={Number(id)} />; }
