import { drizzle, type PgRemoteDatabase } from 'drizzle-orm/pg-proxy';

/**
 * Server-only database client.
 *
 * The original app used node-postgres. Lovable Cloud exposes no raw Postgres
 * socket to the server runtime, so Drizzle runs in "proxy" mode: each statement
 * is inlined (values safely quoted in a single pass) and executed by the
 * service-role-only `app_exec` database function. All query-building code in
 * the app stays unchanged.
 */

type Mode = 'array' | 'object' | 'none';

function literal(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return quote(value.toISOString());
  if (Array.isArray(value)) {
    const items = value.map(v => (v === null || v === undefined ? 'NULL' : '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'));
    return quote('{' + items.join(',') + '}');
  }
  if (typeof value === 'object') return quote(JSON.stringify(value));
  return quote(String(value));
}
function quote(text: string) { return "'" + text.replace(/\u0000/g, '').replace(/'/g, "''") + "'"; }

/** Single-pass substitution so a value containing "$2" can never be re-substituted. */
export function inlineParams(query: string, params: unknown[]) {
  return query.replace(/\$(\d+)/g, (match, n: string) => {
    const index = Number(n) - 1;
    return index >= 0 && index < params.length ? literal(params[index]) : match;
  });
}

const returnsRows = (q: string) => /^\s*(select|with|values)\b/i.test(q) || /\breturning\b/i.test(q);

async function run(query: string, params: unknown[], method: 'all' | 'execute' | string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const q = inlineParams(query, params).trim().replace(/;\s*$/, '');
  // Classify on the parameterised text so user-supplied values can never change the mode.
  const mode: Mode = !returnsRows(query) ? 'none' : method === 'all' ? 'array' : 'object';
  const { data, error } = await (supabaseAdmin.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>)('app_exec', { q, mode });
  if (error) throw new Error(error.message);
  return { rows: (data as unknown[]) ?? [] };
}

type DbClient = PgRemoteDatabase;
const base = drizzle(run) as DbClient;

/**
 * Transactions: the proxy cannot hold a connection open across calls, so the
 * callback runs statement-by-statement against the same client. Single-row
 * guards (`FOR UPDATE`, unique constraints) still apply per statement.
 */
(base as unknown as { transaction: (fn: (tx: DbClient) => Promise<unknown>) => Promise<unknown> }).transaction = async fn => fn(base);

export const db = base;
export function isDatabaseConfigured() { return true; }
export class DatabaseNotConfiguredError extends Error {}
export function resetDbClient() {}
