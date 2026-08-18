import {
  DependencyGraph,
  DependencyGraphTypes,
  InfoCard,
  Progress,
} from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';
import type { Entity } from '@backstage/catalog-model';
import type { EntityNode } from '@backstage/plugin-catalog-graph';
import { catalogGraphRouteRef } from '@backstage/plugin-catalog-graph';
import {
  catalogApiRef,
  entityRouteParams,
  entityRouteRef,
  useEntity,
} from '@backstage/plugin-catalog-react';
import { useApi } from '@backstage/core-plugin-api';
import { useState } from 'react';
import { useAsync } from 'react-use';
import { useNavigate } from 'react-router-dom';
import { stringifyEntityRef } from '@backstage/catalog-model';
import qs from 'qs';
import IconButton from '@material-ui/core/IconButton';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';
import { CustomGraphNode } from './CustomGraphNode';
import {
  renderExtendedEdge,
  type ExtendedEdgeData,
  type RelationDetail,
} from './ExtendedRelationTooltipLabel';

/**
 * Maps each relation type stored on the "part/owned" side of a well-known
 * Backstage relation pair to the type stored on the "container/owner" side
 * (see `RELATION_*` constants in `@backstage/catalog-model`). `entity.relations`
 * holds whichever side of the pair applies to the viewed entity, so without
 * normalising, the same real-world relationship renders with the arrow
 * pointing opposite ways depending on which entity happens to be in view
 * (e.g. a Domain's `hasPart` vs. a System's `partOf`). Edges are normalised to
 * always point from container/owner to part/owned (e.g. Group -> Domain,
 * Domain -> System), not the reverse.
 */
const CONTAINED_RELATION_TO_CONTAINER: Record<string, string> = {
  dependencyOf: 'dependsOn',
  partOf: 'hasPart',
  ownedBy: 'ownerOf',
  apiProvidedBy: 'providesApi',
  apiConsumedBy: 'consumesApi',
  childOf: 'parentOf',
  memberOf: 'hasMember',
};

interface ExtendedRelationEntry {
  targetRef: string;
  type: string;
  source?: string;
  lastSeen?: string;
}

interface Props {
  height?: number;
  /**
   * Entity kinds to include as graph nodes. Leave unset to include related
   * entities of any kind. The focused root entity is always included
   * regardless of its kind.
   */
  kinds?: string[];
  title?: string;
}

/**
 * A catalog graph card that renders both the standard Backstage `entity.relations`
 * AND the APM-discovered `spec.extendedRelations` in a single unified graph.
 *
 * Unlike `EntityCatalogGraphCard`, this card reads `spec.extendedRelations`
 * directly without injecting synthetic entries into `entity.relations`.
 */
export function ExtendedEntityCatalogGraphCard({
  height = 400,
  kinds,
  title = 'Relations',
}: Props) {
  const { entity } = useEntity();
  const catalogApi = useApi(catalogApiRef);
  const getEntityRoute = useRouteRef(entityRouteRef);
  const getCatalogGraphRoute = useRouteRef(catalogGraphRouteRef);
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const rootRef = stringifyEntityRef(entity);

  const catalogGraphUrl = `${getCatalogGraphRoute()}${qs.stringify(
    { rootEntityRefs: [rootRef], maxDepth: 1, selectedKinds: kinds },
    { arrayFormat: 'brackets', addQueryPrefix: true },
  )}`;

  /** Single renderer that draws path + label + tooltip via ExtendedEdgeWithTooltip. */

  const { value, loading } = useAsync(async () => {
    // Collect all referenced entity refs from both relation sources.
    const standardTargetRefs = (entity.relations ?? []).map(r => r.targetRef);
    const extendedTargetRefs = (
      (entity.spec?.extendedRelations as ExtendedRelationEntry[] | undefined) ??
      []
    )
      .map(r => r?.targetRef)
      .filter((r): r is string => Boolean(r));

    const allTargetRefs = [
      ...new Set([...standardTargetRefs, ...extendedTargetRefs]),
    ];

    if (allTargetRefs.length === 0) {
      return { nodes: [makeRootNode(entity, rootRef)], edges: [] };
    }

    // Batch-fetch all referenced entities.
    const { items } = await catalogApi.getEntitiesByRefs({
      entityRefs: allTargetRefs,
      fields: [
        'kind',
        'metadata.name',
        'metadata.namespace',
        'metadata.title',
        'spec.type',
        'spec.lifecycle',
        'spec.system',
      ],
    });

    const entityByRef = new Map<string, Entity>([[rootRef, entity]]);
    for (let i = 0; i < allTargetRefs.length; i++) {
      const e = items[i];
      if (e) entityByRef.set(allTargetRefs[i], e);
    }

    const isAllowed = (ref: string) => {
      if (ref === rootRef) return true;
      if (!kinds || kinds.length === 0) return true;
      const e = entityByRef.get(ref);
      return e ? kinds.includes(e.kind) : false;
    };

    // Build edge map: key = "from\0to", value = { types, details per type }
    const edgeMap = new Map<
      string,
      { types: string[]; details: Record<string, RelationDetail> }
    >();
    const addEdge = (
      from: string,
      to: string,
      type: string,
      detail?: RelationDetail,
    ) => {
      if (!isAllowed(from) || !isAllowed(to) || from === to) return;
      const key = `${from}\0${to}`;
      if (!edgeMap.has(key)) edgeMap.set(key, { types: [], details: {} });
      const entry = edgeMap.get(key)!;
      if (!entry.types.includes(type)) entry.types.push(type);
      if (detail) entry.details[type] = detail;
    };

    for (const rel of entity.relations ?? []) {
      if (entityByRef.has(rel.targetRef)) {
        const containerType = CONTAINED_RELATION_TO_CONTAINER[rel.type];
        if (containerType) {
          addEdge(rel.targetRef, rootRef, containerType);
        } else {
          addEdge(rootRef, rel.targetRef, rel.type);
        }
      }
    }

    for (const rel of (entity.spec?.extendedRelations as
      | ExtendedRelationEntry[]
      | undefined) ?? []) {
      if (rel?.targetRef && entityByRef.has(rel.targetRef)) {
        addEdge(rootRef, rel.targetRef, rel.type, {
          source: rel.source,
          lastSeen: rel.lastSeen,
        });
      }
    }

    // Collect all node refs that appear in at least one edge plus root.
    const nodeRefs = new Set<string>([rootRef]);
    for (const key of edgeMap.keys()) {
      const sep = key.indexOf('\0');
      nodeRefs.add(key.slice(0, sep));
      nodeRefs.add(key.slice(sep + 1));
    }

    const nodes: EntityNode[] = [...nodeRefs]
      .filter(ref => entityByRef.has(ref))
      .map(ref => {
        const e = entityByRef.get(ref)!;
        const isFocused = ref === rootRef;
        return {
          id: ref,
          entity: e,
          focused: isFocused,
          onClick: isFocused
            ? undefined
            : () => navigate(getEntityRoute(entityRouteParams(e))),
        } as EntityNode & { onClick?: () => void };
      });

    const edges: DependencyGraphTypes.DependencyEdge<ExtendedEdgeData>[] = [
      ...edgeMap.entries(),
    ].map(([key, { types, details }]) => {
      const sep = key.indexOf('\0');
      return {
        from: key.slice(0, sep),
        to: key.slice(sep + 1),
        relations: types,
        label: 'visible',
        details: Object.keys(details).length > 0 ? details : undefined,
      };
    });

    return { nodes, edges };
  }, [rootRef]);

  if (loading || !value) {
    return (
      <InfoCard title={title}>
        <div style={{ height }}>
          <Progress />
        </div>
      </InfoCard>
    );
  }

  const graph = (
    <DependencyGraph
      nodes={value.nodes}
      edges={value.edges}
      renderNode={
        CustomGraphNode as DependencyGraphTypes.RenderNodeFunction<EntityNode>
      }
      renderEdge={renderExtendedEdge}
      direction={DependencyGraphTypes.Direction.LEFT_RIGHT}
      zoom="enable-on-click"
      curve="curveMonotoneX"
      showArrowHeads
      allowFullscreen={false}
      fit={isFullscreen ? 'grow' : 'contain'}
      paddingX={24}
      paddingY={24}
      style={{ width: '100%', ...(isFullscreen ? {} : { height }) }}
    />
  );

  if (isFullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px 8px',
            borderBottom: '1px solid rgba(0,0,0,0.12)',
          }}
        >
          <span style={{ flex: 1, fontWeight: 600, fontSize: '1rem' }}>
            {title}
          </span>
          <IconButton
            size="small"
            onClick={() => setIsFullscreen(false)}
            aria-label="exit fullscreen"
          >
            <FullscreenExitIcon />
          </IconButton>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>{graph}</div>
      </div>
    );
  }

  return (
    <InfoCard
      title={title}
      noPadding
      deepLink={{ title: 'View in catalog graph', link: catalogGraphUrl }}
    >
      <div style={{ position: 'relative', height }}>
        <IconButton
          size="small"
          onClick={() => setIsFullscreen(true)}
          aria-label="fullscreen"
          style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }}
        >
          <FullscreenIcon />
        </IconButton>
        {graph}
      </div>
    </InfoCard>
  );
}

function makeRootNode(entity: Entity, rootRef: string): EntityNode {
  return { id: rootRef, entity, focused: true } as EntityNode;
}
