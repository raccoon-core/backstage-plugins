# @racooncorp/backstage-plugin-catalog-graph-module-extended-relations

## 0.2.3

### Patch Changes

- 3acba61: Fix `main` pointing at a `dist/index.cjs.js` that was never built. The
  `frontend-plugin-module` role only ever emits `types` + `esm` output, so
  `publishConfig.main` now points at `dist/index.esm.js`, matching how
  upstream Backstage packages of the same role (e.g.
  `@backstage/plugin-techdocs-module-addons-contrib`) ship. Previously,
  CommonJS-based tooling (Jest) that resolved this package via its `main`
  field failed with `MODULE_NOT_FOUND`; bundlers were unaffected since they
  also consult the `module` field.

## 0.2.1

### Patch Changes

- f59b79a: add install instructions and switch to npm trusted publisher

## 0.2.0

### Minor Changes

- d40e0a0: Initial release. Frontend module for `@backstage/plugin-catalog-graph` that merges `spec.extendedRelations` into the catalog graph alongside native catalog relations, applies consistent node/edge styling across the entity card and standalone graph page, and fixes zoom/pan reset-on-render.
