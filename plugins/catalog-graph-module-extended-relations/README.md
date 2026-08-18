# @raccoon-core/backstage-plugin-catalog-graph-module-extended-relations

A frontend module (`pluginId: 'catalog-graph'`) that overrides two extensions
from `@backstage/plugin-catalog-graph`:

- `entity-card:catalog-graph/relations` — merges `spec.extendedRelations`
  (written by `catalog-backend-module-extended-relations`) into the graph
  alongside native catalog relations.
- `page:catalog-graph` — the standalone `/catalog-graph` page, with the same
  custom node/edge rendering as the entity card.

It also mounts a global fix for `DependencyGraph`'s zoom/pan reset-on-render
behaviour.

## Installation

Add the package to your app:

```sh
yarn --cwd packages/app add @raccoon-core/backstage-plugin-catalog-graph-module-extended-relations
```

Register it in `packages/app/src/App.tsx`'s `features` array, alongside the
upstream `catalogGraphPlugin` — this module overrides two of that plugin's
extensions, it doesn't replace it:

```tsx
import catalogGraphPlugin from '@backstage/plugin-catalog-graph/alpha';
import catalogGraphModuleExtendedRelations from '@raccoon-core/backstage-plugin-catalog-graph-module-extended-relations';

export const app = createApp({
  features: [
    catalogGraphPlugin,
    catalogGraphModuleExtendedRelations,
    // ...your other features
  ],
});
```

No further configuration is required. The relations card and the standalone
`/catalog-graph` page will pick up `spec.extendedRelations` on any entity that
has it, and fall back to native catalog relations otherwise.

See `CLAUDE.md` for the file layout and implementation notes.
