import {
  DEFAULT_NAMESPACE,
  Entity,
  parseEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { DependencyGraphTypes } from '@backstage/core-components';
import { EntityNode } from '@backstage/plugin-catalog-graph';
import { useEntityPresentation } from '@backstage/plugin-catalog-react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import SvgIcon from '@material-ui/core/SvgIcon';
import clsx from 'clsx';
import { useLayoutEffect, useRef, useState } from 'react';
import type { ElementType } from 'react';
import {
  getNodeBadgeLabel,
  getNodeColor,
  getNodeIcon,
  getNodeTintFill,
  withAlpha,
} from './graphUtils';

function EntityIcon({
  icon,
  width,
  height,
  ...props
}: {
  icon: ElementType | undefined;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  className?: string;
}) {
  const Icon = icon ?? SvgIcon;
  return (
    <Icon
      style={{ width, height, fontSize: height }}
      width={width}
      height={height}
      {...props}
    />
  );
}

const useStyles = makeStyles(
  theme => ({
    node: {
      fill: theme.palette.grey[300],
      stroke: theme.palette.grey[300],
    },
    text: {
      fill: theme.palette.text.primary,
      '&.focused': {
        fontWeight: 'bold',
      },
    },
    secondaryText: {
      fill: theme.palette.text.secondary,
      fontSize: '0.7em',
      opacity: 0.9,
    },
    kindBadgeText: {
      fontSize: '0.6rem',
      fill: theme.palette.text.secondary,
      fontWeight: 500,
    },
    clickable: {
      cursor: 'pointer',
      '&:hover .node-body': {
        filter: 'url(#node-hover-glow)',
      },
    },
  }),
  { name: 'CustomCatalogGraphNode' },
);

export function CustomGraphNode({
  node: { id, entity, focused, onClick },
}: DependencyGraphTypes.RenderNodeProps<EntityNode>) {
  const entityObj = entity as Entity;
  const classes = useStyles();
  const theme = useTheme();
  const [titleWidth, setTitleWidth] = useState(0);
  const [titleHeight, setTitleHeight] = useState(0);
  const [subtitleWidth, setSubtitleWidth] = useState(0);
  const [subtitleHeight, setSubtitleHeight] = useState(0);
  const [badgeWidth, setBadgeWidth] = useState(0);
  const titleRef = useRef<SVGTextElement | null>(null);
  const subtitleRef = useRef<SVGTextElement | null>(null);
  const badgeRef = useRef<SVGTextElement | null>(null);
  const entityRefPresentationSnapshot = useEntityPresentation(entityObj, {
    defaultNamespace: DEFAULT_NAMESPACE,
  });

  const rawSystemName =
    entityObj.spec?.system && typeof entityObj.spec.system === 'string'
      ? entityObj.spec.system
      : undefined;
  const systemEntityRef = rawSystemName
    ? stringifyEntityRef(
        parseEntityRef(rawSystemName, {
          defaultKind: 'System',
          defaultNamespace: entityObj.metadata.namespace ?? DEFAULT_NAMESPACE,
        }),
      )
    : `system:${DEFAULT_NAMESPACE}/__none__`;
  const systemPresentation = useEntityPresentation(systemEntityRef, {
    defaultNamespace: DEFAULT_NAMESPACE,
  });
  const productDisplayName = rawSystemName
    ? systemPresentation.primaryTitle ?? rawSystemName
    : undefined;

  useLayoutEffect(() => {
    if (titleRef.current) {
      let { height: renderedHeight, width: renderedWidth } =
        titleRef.current.getBBox();
      renderedHeight = Math.round(renderedHeight);
      renderedWidth = Math.round(renderedWidth);
      if (renderedHeight !== titleHeight || renderedWidth !== titleWidth) {
        setTitleWidth(renderedWidth);
        setTitleHeight(renderedHeight);
      }
    }
  }, [titleWidth, titleHeight]);

  useLayoutEffect(() => {
    if (subtitleRef.current) {
      const renderedHeight = Math.round(subtitleRef.current.getBBox().height);
      const renderedWidth = Math.round(subtitleRef.current.getBBox().width);
      if (
        renderedHeight !== subtitleHeight ||
        renderedWidth !== subtitleWidth
      ) {
        setSubtitleWidth(renderedWidth);
        setSubtitleHeight(renderedHeight);
      }
    }
  }, [subtitleWidth, subtitleHeight]);

  useLayoutEffect(() => {
    if (badgeRef.current) {
      const renderedWidth = Math.round(badgeRef.current.getBBox().width);
      if (renderedWidth !== badgeWidth) setBadgeWidth(renderedWidth);
    }
  }, [badgeWidth]);

  const baseTitle = entityRefPresentationSnapshot.primaryTitle ?? id;
  const specType = entityObj.spec?.type as string | undefined;
  const kindLabel = getNodeBadgeLabel(entity.kind, specType);
  const nodeIcon =
    getNodeIcon(entity.kind, specType, entity.metadata?.name) ??
    (entityRefPresentationSnapshot.Icon as ElementType | undefined);

  const hasKindIcon = !!nodeIcon;
  const padding = 10;
  const lineGap = 4;
  const accentWidth = 8;
  const iconSize = titleHeight;
  const paddedIconWidth = hasKindIcon ? iconSize + padding : 0;
  const textWidth = Math.max(titleWidth, subtitleWidth);
  const minWidthForBadge =
    badgeWidth > 0 ? accentWidth + 4 + badgeWidth + 10 + 4 : 0;
  const contentWidth = accentWidth + paddedIconWidth + textWidth + padding * 2;
  const paddedWidth = Math.max(contentWidth, minWidthForBadge);
  const contentHeight =
    titleHeight + (productDisplayName ? lineGap + subtitleHeight : 0);
  const paddedHeight = contentHeight + padding * 2;

  const textCenterX = accentWidth + (textWidth + padding * 2) / 2;
  const titleY = padding + titleHeight / 2;
  const subtitleY = titleY + titleHeight / 2 + lineGap + subtitleHeight / 2;

  const nodeColor = getNodeColor(entity.kind);
  const tintFill = getNodeTintFill(entity.kind, theme.palette.type === 'dark');
  const borderColor = withAlpha(nodeColor, 0.7);

  const sanitizedId = id.replace(/[^a-zA-Z0-9]/g, '-');
  const clipId = `accent-clip-${sanitizedId}`;

  return (
    <g onClick={onClick} className={clsx(onClick && classes.clickable)}>
      <defs>
        <clipPath id={clipId}>
          <rect width={paddedWidth} height={paddedHeight} rx={10} />
        </clipPath>
      </defs>

      <rect
        className={clsx(classes.node, 'node-body')}
        style={{ fill: tintFill, stroke: borderColor }}
        width={paddedWidth}
        height={paddedHeight}
        rx={10}
        strokeWidth={1.5}
        filter="url(#node-shadow)"
      />

      <rect
        width={accentWidth}
        height={paddedHeight}
        fill={nodeColor}
        clipPath={`url(#${clipId})`}
      />

      {hasKindIcon && (
        <EntityIcon
          icon={nodeIcon}
          y={padding}
          x={accentWidth + textWidth + padding * 2}
          width={iconSize}
          height={iconSize}
          className={clsx(classes.text, focused && 'focused')}
        />
      )}

      {kindLabel &&
        (() => {
          const badgePadX = 5;
          const badgeH = 14;
          const badgeX = accentWidth + 4;
          const badgeY = -(badgeH / 2);
          const badgeW = badgeWidth + badgePadX * 2;
          const r = 4;
          return (
            <g>
              <rect
                x={badgeX + 0.75}
                y={badgeY}
                width={badgeW - 1.5}
                height={badgeH / 2 + 1}
                fill={tintFill}
              />
              <path
                d={[
                  `M ${badgeX},0`,
                  `L ${badgeX},${badgeY + r}`,
                  `Q ${badgeX},${badgeY} ${badgeX + r},${badgeY}`,
                  `L ${badgeX + badgeW - r},${badgeY}`,
                  `Q ${badgeX + badgeW},${badgeY} ${badgeX + badgeW},${
                    badgeY + r
                  }`,
                  `L ${badgeX + badgeW},0`,
                ].join(' ')}
                fill="none"
                stroke={borderColor}
                strokeWidth={1.5}
              />
              <text
                ref={badgeRef}
                x={badgeX + badgePadX}
                y={badgeY + badgeH / 2}
                textAnchor="start"
                dominantBaseline="central"
                className={classes.kindBadgeText}
              >
                {kindLabel}
              </text>
            </g>
          );
        })()}

      <text
        ref={titleRef}
        className={clsx(classes.text, focused && 'focused')}
        y={titleY}
        x={textCenterX}
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        {baseTitle}
      </text>
      {productDisplayName && (
        <text
          ref={subtitleRef}
          className={classes.secondaryText}
          y={subtitleY}
          x={textCenterX}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {productDisplayName}
        </text>
      )}
      <title>{entityRefPresentationSnapshot.entityRef}</title>
    </g>
  );
}
