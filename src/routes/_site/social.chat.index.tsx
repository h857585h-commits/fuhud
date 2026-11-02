import { createFileRoute } from "@tanstack/react-router";
import { ChatList } from "@/components/chat";

export const Route = createFileRoute("/_site/social/chat/")({
  head: () => ({
    meta: [
      { title: "الرسائل | كرة المنار" },
      { name: "description", content: "رسائلك ومحادثاتك في كرة المنار." },
      { property: "og:title", content: "الرسائل | كرة المنار" },
      { property: "og:description", content: "رسائلك ومحادثاتك في كرة المنار." },
    ],
  }),
  component: () => <ChatList />,
});
