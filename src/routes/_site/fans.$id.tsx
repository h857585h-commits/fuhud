import { createFileRoute } from "@tanstack/react-router";
import { PublicProfile } from "@/components/people";

export const Route = createFileRoute("/_site/fans/$id")({
  head: () => ({
    meta: [
      { title: "ملف مشجّع | كرة المنار" },
      { name: "description", content: "الملف العام لعضو في مجتمع كرة المنار." },
      { property: "og:title", content: "ملف مشجّع | كرة المنار" },
      { property: "og:description", content: "الملف العام لعضو في مجتمع كرة المنار." },
    ],
  }),
  component: Page,
});
function Page() { const { id } = Route.useParams(); return <PublicProfile id={Number(id)} />; }
