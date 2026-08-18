import {
  AppRootElementBlueprint,
  createFrontendModule,
} from '@backstage/frontend-plugin-api';
import catalogGraphPlugin from '@backstage/plugin-catalog-graph/alpha';
import { DependencyGraphZoomOverrides } from './DependencyGraphZoomOverrides';

/**
 * Replaces the default catalog-graph entity card with one that also merges in
 * `spec.extendedRelations` (populated by external discovery sources) and
 * applies the custom node/edge styling below.
 */
const customRelationsCard = catalogGraphPlugin
  .getExtension('entity-card:catalog-graph/relations')
  .override({
    factory: originalFactory =>
      originalFactory({
        params: {
          loader: () =>
            import('./ExtendedEntityCatalogGraphCard').then(m => (
              <m.ExtendedEntityCatalogGraphCard />
            )),
        },
      }),
  });

/**
 * Replaces the default standalone `/catalog-graph` page so it renders nodes
 * and edges with the same custom styling as the entity page relations card.
 */
const customGraphPage = catalogGraphPlugin
  .getExtension('page:catalog-graph')
  .override({
    factory: originalFactory =>
      originalFactory({
        params: {
          loader: () =>
            Promise.all([
              import('@backstage/plugin-catalog-graph'),
              import('./CustomGraphNode'),
              import('./ExtendedRelationTooltipLabel'),
            ]).then(([catalogGraph, customNode, tooltip]) => (
              <catalogGraph.CatalogGraphPage
                renderNode={customNode.CustomGraphNode}
                renderEdge={tooltip.renderExtendedEdge}
              />
            )),
        },
      }),
  });

/**
 * `DependencyGraph` (from core-components) resets zoom/pan on every re-render.
 * This mounts a global observer that patches its d3-zoom behaviour so the
 * user's viewport is preserved instead of re-centering on each update.
 */
const dependencyGraphZoomOverrides = AppRootElementBlueprint.make({
  params: {
    element: <DependencyGraphZoomOverrides />,
  },
});

export const catalogGraphModuleExtendedRelations = createFrontendModule({
  pluginId: 'catalog-graph',
  extensions: [
    customRelationsCard,
    customGraphPage,
    dependencyGraphZoomOverrides,
  ],
});
