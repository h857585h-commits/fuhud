import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { InviteForm } from "@/components/invite";
import { fetchInvite } from "@/lib/app.functions";

export const Route = createFileRoute("/_site/invite/$token")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "دعوة إدارة فريق | منصة الفهود الرياضية" },
      { name: "description", content: "قبول دعوة لإدارة فريق في منصة الفهود الرياضية." },
      { property: "og:title", content: "دعوة إدارة فريق | منصة الفهود الرياضية" },
      { property: "og:description", content: "قبول دعوة لإدارة فريق في منصة الفهود الرياضية." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: Page,
});
function Page() {
  const { token } = Route.useParams();
  const { data } = useQuery({ queryKey: ["invite", token], queryFn: () => fetchInvite({ data: token }) });
  if (!data) return <div className="min-h-[40vh]" />;
  return <InviteForm token={token} teamName={data.teamName} valid={data.valid} />;
}
