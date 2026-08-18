import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DependencyGraphTypes } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import * as d3Shape from 'd3-shape';

export interface RelationDetail {
  /** Origin of this relation (e.g. "kibana-apm"). */
  source?: string;
  /** ISO-8601 timestamp of the last observation. */
  lastSeen?: string;
}

/**
 * Edge data shape used by `ExtendedEntityCatalogGraphCard`.
 * Compatible with `EntityEdgeData` (superset: adds `details`).
 */
export interface ExtendedEdgeData {
  relations?: string[];
  label?: 'visible' | 'hidden';
  /**
   * Per-relation-type metadata.  Only present for APM-sourced edges;
   * standard catalog relations have no entry here.
   */
  details?: Record<string, RelationDetail>;
}

const useStyles = makeStyles(
  theme => ({
    label: {
      fill: theme.palette.text.primary,
      fontSize: '0.75rem',
      fontWeight: 500,
      cursor: 'default',
    },
    tooltip: {
      position: 'fixed',
      zIndex: 9999,
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 4,
      padding: '8px 12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      pointerEvents: 'none',
      minWidth: 160,
      maxWidth: 300,
    },
    row: {
      display: 'flex',
      gap: 8,
      fontSize: '0.75rem',
      lineHeight: 1.6,
      color: theme.palette.text.primary,
    },
    key: {
      color: theme.palette.text.secondary,
      fontWeight: 600,
      minWidth: 64,
      flexShrink: 0,
    },
    divider: {
      borderTop: `1px solid ${theme.palette.divider}`,
      margin: '4px 0',
    },
  }),
  { name: 'ExtendedRelationTooltipLabel' },
);

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Label renderer for `ExtendedEntityCatalogGraphCard`.
 *
 * Shows the primary relation type as SVG text.  On hover, opens a small HTML
 * tooltip (via React portal) with full details: type, source, and last-seen
 * timestamp.  Standard catalog relations (no `details` entry) show type only.
 */
export function ExtendedRelationTooltipLabel({
  edge,
}: DependencyGraphTypes.RenderLabelProps<ExtendedEdgeData>) {
  const classes = useStyles();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseLeave = useCallback(() => setPos(null), []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  }, []);

  const relations = edge.relations ?? [];
  if (relations.length === 0) return null;

  const label =
    relations.length === 1
      ? relations[0]
      : `${relations[0]} +${relations.length - 1}`;

  return (
    <>
      {/* SVG text — always visible */}
      <text
        className={classes.label}
        textAnchor="middle"
        dominantBaseline="middle"
        paintOrder="stroke"
        stroke="rgba(255,255,255,0.75)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pointerEvents: 'all' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {label}
      </text>

      {/* HTML tooltip — rendered outside SVG via portal */}
      {pos &&
        createPortal(
          <TooltipContent
            classes={classes}
            relations={relations}
            details={edge.details}
            pos={pos}
          />,
          document.body,
        )}
    </>
  );
}

// ---------------------------------------------------------------------------
// TooltipContent — shared HTML tooltip markup
// ---------------------------------------------------------------------------

interface TooltipContentProps {
  classes: ReturnType<typeof useStyles>;
  relations: string[];
  details: Record<string, RelationDetail> | undefined;
  pos: { x: number; y: number };
}

function TooltipContent({
  classes,
  relations,
  details,
  pos,
}: TooltipContentProps) {
  return (
    <div
      className={classes.tooltip}
      style={{ left: pos.x + 14, top: pos.y - 10 }}
    >
      {relations.map((rel, i) => {
        const detail = details?.[rel];
        return (
          <div key={rel}>
            {i > 0 && <div className={classes.divider} />}
            <div className={classes.row}>
              <span className={classes.key}>type</span>
              <span>{rel}</span>
            </div>
            {detail?.source && (
              <div className={classes.row}>
                <span className={classes.key}>source</span>
                <span>{detail.source}</span>
              </div>
            )}
            {detail?.lastSeen && (
              <div className={classes.row}>
                <span className={classes.key}>last seen</span>
                <span>{formatDate(detail.lastSeen)}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ExtendedEdgeWithTooltip — combined path + label + tooltip in one component.
//
// Used as the `renderEdge` prop of DependencyGraph so that hovering anywhere
// on the arrow (line OR label text) triggers the tooltip.
// ---------------------------------------------------------------------------

type EdgeWithExtras = DependencyGraphTypes.DependencyEdge<ExtendedEdgeData> & {
  x?: number;
  y?: number;
  points?: { x: number; y: number }[];
};

/**
 * Stable render-prop wrapper for `ExtendedEdgeWithTooltip`.
 *
 * `DependencyGraph` calls the `renderEdge` prop as a plain function
 * (`renderEdge({ edge, id })`), NOT as a JSX component. Passing a React
 * function component directly would execute its hooks in the parent's hook
 * scope, making the hook count vary with the edge count and triggering the
 * "Rendered more hooks than during the previous render" error.
 *
 * Use this wrapper wherever `renderEdge` is needed so that DependencyGraph
 * receives a plain function that returns a React element, keeping
 * `ExtendedEdgeWithTooltip`'s hooks inside their own component scope.
 */
export function renderExtendedEdge(
  props: DependencyGraphTypes.RenderEdgeProps<ExtendedEdgeData>,
): JSX.Element {
  return <ExtendedEdgeWithTooltip {...props} />;
}

export function ExtendedEdgeWithTooltip({
  edge,
}: DependencyGraphTypes.RenderEdgeProps<ExtendedEdgeData>) {
  const theme = useTheme();
  const classes = useStyles();
  const catalogApi = useApi(catalogApiRef);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  // Lazily fetched details for edges that arrive without them (e.g. from /catalog-graph).
  const [fetchedDetails, setFetchedDetails] = useState<
    Record<string, RelationDetail> | undefined
  >(undefined);
  // Prevent duplicate in-flight fetches.
  const fetchedRef = useRef(false);

  const e = edge as unknown as EdgeWithExtras;

  const createPath = d3Shape
    .line<{ x: number; y: number }>()
    .x(p => p.x)
    .y(p => p.y)
    .curve(d3Shape.curveMonotoneX);

  const pathD = e.points ? createPath(e.points) || '' : '';

  const handleMouseEnter = useCallback(
    (ev: React.MouseEvent) => {
      setPos({ x: ev.clientX, y: ev.clientY });
      // If the edge already carries details (from ExtendedEntityCatalogGraphCard) skip fetch.
      if (e.details || fetchedRef.current) return;
      fetchedRef.current = true;
      const fromRef = (e as any).from as string | undefined;
      const toRef = (e as any).to as string | undefined;
      if (!fromRef || !toRef) return;
      catalogApi
        .getEntityByRef(fromRef)
        .then(sourceEntity => {
          if (!sourceEntity?.spec?.extendedRelations) return;
          const extRels = sourceEntity.spec.extendedRelations as Array<{
            targetRef: string;
            type: string;
            source?: string;
            lastSeen?: string;
          }>;
          const details: Record<string, RelationDetail> = {};
          for (const rel of extRels) {
            if (rel.targetRef === toRef) {
              details[rel.type] = {
                source: rel.source,
                lastSeen: rel.lastSeen,
              };
            }
          }
          if (Object.keys(details).length > 0) setFetchedDetails(details);
        })
        .catch(() => {
          /* ignore */
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalogApi, e.details],
  );
  const handleMouseLeave = useCallback(() => setPos(null), []);
  const handleMouseMove = useCallback((ev: React.MouseEvent) => {
    setPos({ x: ev.clientX, y: ev.clientY });
  }, []);

  const relations = e.relations ?? [];
  const effectiveDetails = e.details ?? fetchedDetails;

  return (
    <>
      {/* Visible arrow path */}
      {pathD && (
        <path
          data-testid="edge"
          d={pathD}
          fill="none"
          stroke={theme.palette.text.secondary}
          strokeWidth={1.3}
          markerEnd="url(#arrow-marker)"
        />
      )}

      {/* Wide transparent hit-area so the whole arrow is hoverable */}
      {pathD && (
        <path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth={12}
          style={{ pointerEvents: 'stroke', cursor: 'default' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        />
      )}

      {/* HTML tooltip rendered outside SVG */}
      {pos &&
        relations.length > 0 &&
        createPortal(
          <TooltipContent
            classes={classes}
            relations={relations}
            details={effectiveDetails}
            pos={pos}
          />,
          document.body,
        )}
    </>
  );
}
