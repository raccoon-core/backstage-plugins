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

## Configuration

### Node text

Choose which entity fields the node's two text lines show. Both are optional;
the defaults reproduce the previous behaviour (`title` + `system`):

```yaml
catalogGraph:
  extendedRelations:
    node:
      title: name # title | name | system | owner | description | type | lifecycle
      subtitle: system # same values, or `none` to hide the second line
```

`system`/`owner` show the referenced entity's display title. If the chosen
`title` field is missing on an entity the node falls back to its display name;
a missing `subtitle` field just hides the second line. `description` is
truncated to 40 characters.

### Node colors

The node color palette (same one reused by `getNodeColor`/`getNodeTintFill`
for e.g. search result kind badges) can be overridden per app via
`app-config.yaml`. Each entry overrides either a whole `kind`'s palette, or —
with `type` — just that `kind`+`spec.type` combination:

```yaml
catalogGraph:
  extendedRelations:
    palette:
      # Whole-kind override
      - kind: component
        accent: '#3b82f6'
        tint: '#eff6ff'
        darkTint: '#1e40af'
      # kind+spec.type override — only entities with this exact combination
      - kind: Component
        type: third-party
        accent: &thirdPartyAccent '#6b7280'
        tint: &thirdPartyTint '#f3f4f6'
        darkTint: &thirdPartyDarkTint '#384250'
      - kind: Group
        type: third-parties
        accent: *thirdPartyAccent
        tint: *thirdPartyTint
        darkTint: *thirdPartyDarkTint
```

`accent` is the node's left border bar / badge text color, `tint`/`darkTint`
are the node background fill for light/dark theme respectively. See
[`config.d.ts`](./config.d.ts) for the full schema. Kinds/types without a
matching entry keep the built-in palette.

See `CLAUDE.md` for the file layout and implementation notes.
