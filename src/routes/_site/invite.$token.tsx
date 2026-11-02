import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { InviteForm } from "@/components/invite";
import { fetchInvite } from "@/lib/app.functions";

export const Route = createFileRoute("/_site/invite/$token")({
  head: () => ({
    meta: [
      { title: "دعوة إدارة فريق | كرة المنار" },
      { name: "description", content: "قبول دعوة لإدارة فريق في كرة المنار." },
      { property: "og:title", content: "دعوة إدارة فريق | كرة المنار" },
      { property: "og:description", content: "قبول دعوة لإدارة فريق في كرة المنار." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});
function Page() {
  const { token } = Route.useParams();
  const { data } = useQuery({ queryKey: ["invite", token], queryFn: () => fetchInvite({ data: token }) });
  if (!data) return <div className="min-h-[40vh]" />;
  return <InviteForm token={token} teamName={data.teamName} valid={data.valid} />;
}
