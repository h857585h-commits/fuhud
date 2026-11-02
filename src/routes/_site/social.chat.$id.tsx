import { createFileRoute } from "@tanstack/react-router";
import { ChatRoom } from "@/components/chat";

export const Route = createFileRoute("/_site/social/chat/$id")({
  head: () => ({
    meta: [
      { title: "محادثة | كرة المنار" },
      { name: "description", content: "محادثتك في كرة المنار." },
      { property: "og:title", content: "محادثة | كرة المنار" },
      { property: "og:description", content: "محادثتك في كرة المنار." },
    ],
  }),
  component: Page,
});
function Page() { const { id } = Route.useParams(); return <ChatRoom id={Number(id)} />; }
