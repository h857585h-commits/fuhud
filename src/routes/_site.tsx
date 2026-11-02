import { createFileRoute, Outlet } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { AppProvider } from "@/components/context";
import { Shell } from "@/components/shell";
import { Onboarding } from "@/components/onboarding";
import { BrandingEffects } from "@/components/branding";
import { snapshotQuery } from "@/lib/snapshot-query";
import { useAuthKey } from "@/lib/auth-client";

export const Route = createFileRoute("/_site")({
  // Anonymous snapshot for the first paint; the signed-in view loads once the browser session is known.
  loader: ({ context }) => context.queryClient.ensureQueryData(snapshotQuery("anon")),
  component: SiteLayout,
  pendingComponent: Loading,
});

/** Escapes a value before it is inlined into a <style> tag. */
const safe = (value: string, fallback: string) => (/^#[0-9a-fA-F]{3,8}$/.test(value) ? value : fallback);
const text = (value: string, max = 80) => (value || "").replace(/[<>&"']/g, "").slice(0, max);

function Loading() {
  return <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4" role="status"><LoaderCircle size={32} className="mint spinner" /><p className="text-sm muted">نجهّز أجواء الملاعب…</p></div>;
}

function SiteLayout() {
  const authKey = useAuthKey();
  const initial = Route.useLoaderData();
  const { data } = useQuery({ ...snapshotQuery(authKey), initialData: authKey === "anon" ? initial : undefined, placeholderData: keepPreviousData });
  if (!data) return <Loading />;
  const b = (data.branding || {}) as Record<string, string>;
  const vars = [
    b.primary ? `--mint:${safe(b.primary, "#78dfab")}` : "",
    b.secondary ? `--gold:${safe(b.secondary, "#e9ce83")}` : "",
    b.background ? `--bg:${safe(b.background, "#101c23")}` : "",
    b.panel ? `--panel:${safe(b.panel, "#19272e")}` : "",
    b.accent ? `--gold:${safe(b.accent, "#e9ce83")}` : "",
  ].filter(Boolean).join(";");
  const title = text(b.siteName || "كرة المنار", 60);
  return (
    <AppProvider data={data}>
      {vars ? <style dangerouslySetInnerHTML={{ __html: `:root,html[data-theme=dark]{${vars}}` }} /> : null}
      <BrandingEffects />
      <a className="skip-link" href="#main-content">تخطّي إلى المحتوى</a>
      <span className="sr-only" aria-hidden>{title}</span>
      <Shell><Outlet /></Shell>
      <Onboarding />
    </AppProvider>
  );
}
