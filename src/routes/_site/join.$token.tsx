import { createFileRoute } from "@tanstack/react-router";
import { JoinPage } from "@/components/chat";

export const Route = createFileRoute("/_site/join/$token")({
  head: () => ({
    meta: [
      { title: "دعوة مجموعة | كرة المنار" },
      { name: "description", content: "انضم إلى مجموعة محادثة في كرة المنار." },
      { property: "og:title", content: "دعوة مجموعة | كرة المنار" },
      { property: "og:description", content: "انضم إلى مجموعة محادثة في كرة المنار." },
    ],
  }),
  component: Page,
});
function Page() { const { token } = Route.useParams(); return <JoinPage token={token} />; }
