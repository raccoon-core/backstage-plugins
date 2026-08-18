---
'@racooncorp/backstage-plugin-catalog-graph-module-extended-relations': patch
---

Fix `main` pointing at a `dist/index.cjs.js` that was never built. The
`frontend-plugin-module` role only ever emits `types` + `esm` output, so
`publishConfig.main` now points at `dist/index.esm.js`, matching how
upstream Backstage packages of the same role (e.g.
`@backstage/plugin-techdocs-module-addons-contrib`) ship. Previously,
CommonJS-based tooling (Jest) that resolved this package via its `main`
field failed with `MODULE_NOT_FOUND`; bundlers were unaffected since they
also consult the `module` field.
