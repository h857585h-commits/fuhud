import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { sql } = await import("drizzle-orm");
          const { db } = await import("@/db");
          await db.execute(sql`select 1`);
          return Response.json({ ok: true, database: "connected" });
        } catch {
          return Response.json({ ok: false, database: "unreachable" }, { status: 503 });
        }
      },
    },
  },
});
