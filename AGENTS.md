<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Data access: all reads/writes go through server code using Drizzle in proxy mode (`src/db/index.ts`) which executes SQL via the service-role-only `app_exec` database function; tables have RLS on with no client policies. Why: the app's permission logic (`src/lib/perms.ts`) lives server-side and the runtime has no raw Postgres socket.
- Never call `app_exec` from browser code or grant it to anon/authenticated; it runs arbitrary SQL.
- Classify statement mode on the parameterised SQL, and inline params only via `inlineParams` (single pass). Why: values must never change the query shape.
- Transactions are not atomic under the proxy (`db.transaction` runs statements sequentially). Why: stateless RPC per statement.
- Auth: Lovable Cloud auth in the browser; `getCurrentUser` maps the auth user to `users.authId`, linking an unlinked row by verified email on first login, else creating one (first account = owner, invite token in metadata = team admin). Why: preserves imported users' integer ids, roles and data.
- Roles/permissions stay on the `users` table because that table is server-only (no client grants).
- Site data flows through one snapshot server function (`fetchSnapshot`) and one action server function (`runAction`, the former /api/action). `router.refresh()` from the Next shim invalidates the snapshot query.
- `src/lib/next-shims/*` give imported components their old Next.js imports (Link, useRouter, cookies, NextResponse); prefer TanStack APIs in new code.
- Record migration path: dashboard backup JSON import (`backup.import`) strips password hashes, converts ISO timestamps and resets id sequences.
