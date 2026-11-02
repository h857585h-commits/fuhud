import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import Link from "@/lib/next-shims/link";
import { PostCard } from "@/components/social";
import { useApp } from "@/components/context";
import { NotFoundView } from "@/components/not-found";

export const Route = createFileRoute("/_site/social/post/$id")({
  head: () => ({
    meta: [
      { title: "منشور | كرة المنار" },
      { name: "description", content: "منشور وتعليقات من ساحة جماهير كرة المنار." },
      { property: "og:title", content: "منشور | كرة المنار" },
      { property: "og:description", content: "منشور وتعليقات من ساحة جماهير كرة المنار." },
    ],
  }),
  component: Page,
});
function Page() {
  const { id } = Route.useParams(); const { data } = useApp();
  const post = data.posts.find(p => p.id === Number(id));
  if (!post) return <NotFoundView />;
  return <div className="max-w-3xl mx-auto">
    <Link href="/social" className="text-link mb-4 inline-flex"><ArrowLeft size={14} className="rotate-180" />العودة إلى الساحة</Link>
    <div className="mb-4"><span className="badge badge-green">صفحة المنشور والتعليقات</span><p className="text-[11px] muted mt-2 leading-7">كل التعليقات والردود هنا، حتى لا تزحم الساحة — وتقدر تعدّل وتردّ بصورك.</p></div>
    <PostCard post={post} showAllComments />
  </div>;
}
