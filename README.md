# Paternoster Records

Concept site for a fictional Prague record shop on a lift that never stops. See [CONCEPT.md](CONCEPT.md).

- `src/` is the source: markup, styles, generative sleeves, synthesised audio and interactions.
- `node build.mjs` inlines it all into `dist/index.html`.
- `dist/` is a static site. Deploy it to Cloudflare with `npx wrangler deploy`.

Live at https://paternoster-records.webtix.workers.dev
