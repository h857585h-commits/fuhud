import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/selftest")({
  server: { handlers: { GET: async () => {
    const { eq, sql, desc } = await import("drizzle-orm");
    const { db } = await import("@/db");
    const s = await import("@/db/schema");
    const out: Record<string, unknown> = {};
    const [t] = await db.insert(s.teams).values({ name: "اختبار 'quote' $1 returning", shortName: "x", neighborhood: "n", stadium: "s", manager: "m", achievements: ["a", "b's"] }).returning();
    out.inserted = t;
    await db.update(s.teams).set({ views: sql`${s.teams.views} + 5` }).where(eq(s.teams.id, t.id));
    const [p] = await db.insert(s.players).values({ teamId: t.id, name: "لاعب", age: 20, position: "MID", number: 8 }).returning({ id: s.players.id });
    const joined = await db.select({ tid: s.teams.id, pid: s.players.id, tname: s.teams.name }).from(s.players).innerJoin(s.teams, eq(s.players.teamId, s.teams.id)).where(eq(s.teams.id, t.id));
    out.joined = joined;
    await db.insert(s.news).values({ title: "has returning word", excerpt: "e", body: "b", image: "", category: "c", teamId: t.id });
    const [n] = await db.select().from(s.news).orderBy(desc(s.news.id)).limit(1);
    out.newsDate = n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt);
    out.raw = await db.execute(sql`select count(*)::int as c from teams where id = ${t.id}`);
    await db.transaction(async tx => { await tx.delete(s.players).where(eq(s.players.id, p.id)); });
    await db.delete(s.news).where(eq(s.news.id, n.id));
    await db.delete(s.teams).where(eq(s.teams.id, t.id));
    const [after] = await db.select().from(s.teams).where(eq(s.teams.id, t.id));
    out.cleaned = !after;
    return Response.json(out);
  } } },
});
