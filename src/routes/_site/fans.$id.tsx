import { brandMeta } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { PublicProfile } from "@/components/people";

export const Route = createFileRoute("/_site/fans/$id")({
  head: ({ matches }) => ({
    meta: brandMeta([
      { title: "ملف مشجّع | منصة الفهود الرياضية" },
      { name: "description", content: "الملف العام لعضو في مجتمع منصة الفهود الرياضية." },
      { property: "og:title", content: "ملف مشجّع | منصة الفهود الرياضية" },
      { property: "og:description", content: "الملف العام لعضو في مجتمع منصة الفهود الرياضية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ], matches),
  }),
  component: Page,
});
function Page() { const { id } = Route.useParams(); return <PublicProfile id={Number(id)} />; }
