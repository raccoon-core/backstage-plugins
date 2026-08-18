# @racooncorp/backstage-plugin-catalog-graph-module-extended-relations

A frontend module (`pluginId: 'catalog-graph'`) that overrides two extensions
from `@backstage/plugin-catalog-graph`:

- `entity-card:catalog-graph/relations` — merges `spec.extendedRelations`
  (written by `catalog-backend-module-extended-relations`) into the graph
  alongside native catalog relations.
- `page:catalog-graph` — the standalone `/catalog-graph` page, with the same
  custom node/edge rendering as the entity card.

It also mounts a global fix for `DependencyGraph`'s zoom/pan reset-on-render
behaviour.

See `CLAUDE.md` for the file layout and implementation notes.
