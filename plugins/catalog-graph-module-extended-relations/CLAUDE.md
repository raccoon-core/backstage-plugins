# catalog-graph-module-extended-relations

Frontend module (`pluginId: 'catalog-graph'`) that overrides two extensions of
`@backstage/plugin-catalog-graph`. Published standalone under `@racooncorp` —
it has no dependency on any host app, only upstream Backstage APIs. No
organisation-specific names, annotations, or hostnames anywhere in it, so it's
a candidate for graduating to `backstage/community-plugins` once stable (see
the repo root [CONTRIBUTING.md](../../CONTRIBUTING.md)).

```
src/
  module.tsx                      createFrontendModule — the 3 overrides below
  ExtendedEntityCatalogGraphCard.tsx   overrides entity-card:catalog-graph/relations
  CustomGraphNode.tsx              shared node renderer (icon, kind colour, badge)
  ExtendedRelationTooltipLabel.tsx overrides page:catalog-graph's edge renderer
  DependencyGraphZoomOverrides.tsx AppRootElementBlueprint — global d3-zoom patch
  graphUtils.ts                    kind -> {icon, colour} palette, badge helpers
  index.ts                         default export: catalogGraphModuleExtendedRelations
```

A consuming app registers this in its `features` array (`createApp`)
alongside the upstream `catalogGraphPlugin` — the module overrides two of
that plugin's extensions, it doesn't replace the plugin itself. There is no
host app in this repo; verify changes by consuming the built package from an
app, or via `backstage-cli package test`.

## What each override does

- **`entity-card:catalog-graph/relations`** (`ExtendedEntityCatalogGraphCard`)
  — replaces the default relations card. Reads both `entity.relations`
  (native catalog relations) and `entity.spec.extendedRelations` (written by
  `catalog-backend-module-extended-relations`, e.g. from APM discovery) and
  merges them into one graph, batch-fetching every referenced entity via
  `catalogApi.getEntitiesByRefs`. Edges carry `details` (source + lastSeen)
  only when they come from `extendedRelations` — native relations have no
  per-edge metadata.

- **`page:catalog-graph`** (via `@backstage/plugin-catalog-graph`'s
  `CatalogGraphPage`) — the standalone `/catalog-graph` page, given the same
  `CustomGraphNode` / `renderExtendedEdge` as the entity card so both surfaces
  look identical.

- **`AppRootElementBlueprint`** (`DependencyGraphZoomOverrides`) — mounts
  globally (not scoped to catalog-graph's DOM), patches `DependencyGraph`'s
  (from `@backstage/core-components`) d3-zoom behaviour so the user's
  pan/zoom survives re-renders instead of resetting to center. Targets
  `svg#dependency-graph` by selector since `DependencyGraph` exposes no ref/
  callback for this.

## Relation direction is normalised, not passed through as-is

`entity.relations` holds whichever side of a relation pair the _viewed_
entity happens to carry (e.g. a `System` has `partOf`, its parent `Domain`
has `hasPart`). Rendered naively, the same real-world relationship points
opposite ways depending on which entity is focused. `ExtendedEntityCatalogGraphCard`'s
`CONTAINED_RELATION_TO_CONTAINER` map flips the "part/owned" side to its
"container/owner" counterpart so edges always point container → part (Group
→ Domain → System → Component, etc.). `extendedRelations` entries are not
flipped — they're written pre-oriented by their source.

## Fullscreen is a manual `position: fixed` overlay, not `DependencyGraph`'s own

`ExtendedEntityCatalogGraphCard` passes `allowFullscreen={false}` and instead
toggles its own fixed-position overlay via local `isFullscreen` state. If
switching back to `DependencyGraph`'s built-in fullscreen, re-verify it against
`DependencyGraphZoomOverrides` (which selects the graph via
`svg#dependency-graph` in the DOM) — not verified to be compatible.
