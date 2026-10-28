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

- The storefront lives under the pathless `_site` layout; the home page is `_site.index.tsx` (route `/_site/`), never a root-level `index.tsx` — a root `index.tsx` conflicts with `_site` on the `/` path and breaks the route-tree build.
- The admin (`/admin/*`) has no user accounts: each admin server function takes an `adminPassword` field checked against the `ADMIN_PASSWORD` secret with a timing-safe hash comparison; the browser keeps the password in localStorage (`src/lib/admin-auth.ts`). Do not replace this with RLS/Supabase auth without a deliberate redesign.
- Checkout shipping must go through `orderShipping()` in `src/lib/shop-constants.ts` — both the server order handler and the checkout UI read it, so the displayed and charged shipping can never drift.
