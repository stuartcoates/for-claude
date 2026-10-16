# stuartcoat.es

One static page (`index.html`), its fonts (`fonts/`, SIL Open Font License, licence texts alongside) and a `CNAME` file. No build step.

Built on the Stuart Coates design system (https://claude.ai/artifact/HohZfPPzx3RhV64z7TdoYw): Paper theme by day, Felt at night; a poster-register opener over a form-register page.

## Status

Draft v2, October 16, 2026. Not live. Content comes from `Stuart_Coates_Resume_v1_Ops.pdf` plus the design system README, and needs Stuart's correction pass before publishing.

Open items:
- ⚠️ Location reads Los Angeles and the newest role reads "Front Office Manager, Kimpton Hotel Palomar LA, 2026". Both come from the design system README, not a canon file. Confirm, and say whether anything after the Palomar belongs here.
- ❓ Ace Hotel title: the résumé says "Director of Operations"; the design system's sample ledger says "Director of Front Office". Which is right?
- ❓ Book line under "Also": keep it public or cut it?
- ❓ LinkedIn: add a link if wanted (URL not on file).
- Phone number deliberately left off. The résumé is "on request" so the phone number in it stays private.

## Going live (GitHub Pages + Hover)

1. Create a public repo (e.g. `stuartcoates/stuartcoat.es`) and put `index.html` and `CNAME` at its root.
2. Repo Settings → Pages → Source: deploy from branch `main`, folder `/ (root)`.
3. In Hover → stuartcoat.es → DNS:
   - Delete the existing `A` record for `@` (67.199.248.12, which points at Bitly).
   - Add four `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
   - Add a `CNAME` record for `www` → `stuartcoates.github.io`.
   - Leave the `MX`, SPF `TXT`, and `_atproto` `TXT` records alone. They run email and the Bluesky handle.
4. Back in Settings → Pages, once the domain check passes, tick "Enforce HTTPS". The certificate can take up to an hour.
