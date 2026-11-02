/** Minimal stand-ins for the Next.js response helpers used by the ported action handlers. */
export type ActionResponse = { body: Record<string, unknown>; status: number };
export const NextResponse = {
  json(body: Record<string, unknown>, init?: { status?: number; headers?: Record<string, string> }): ActionResponse {
    return { body, status: init?.status ?? 200 };
  },
};
export type NextRequest = { json(): Promise<unknown>; headers: Headers };
