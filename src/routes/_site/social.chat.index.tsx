import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { ChatList } from "@/components/chat";

export const Route = createFileRoute("/_site/social/chat/")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "الرسائل | منصة الفهود الرياضية" },
      { name: "description", content: "رسائلك ومحادثاتك في منصة الفهود الرياضية." },
      { property: "og:title", content: "الرسائل | منصة الفهود الرياضية" },
      { property: "og:description", content: "رسائلك ومحادثاتك في منصة الفهود الرياضية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: () => <ChatList />,
});
