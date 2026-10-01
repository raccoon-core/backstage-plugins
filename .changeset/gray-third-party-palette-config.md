---
'@raccoon-core/backstage-plugin-catalog-graph-module-extended-relations': minor
---

Made the node color palette configurable via `catalogGraph.extendedRelations.palette` in app-config. Each entry overrides a whole `kind`'s palette, or — with `type` — just that `kind`+`spec.type` combination, overriding both light/dark theme colors. `getNodeColor`/`getNodeTintFill` gained an optional `specType` parameter to resolve type-scoped overrides.
