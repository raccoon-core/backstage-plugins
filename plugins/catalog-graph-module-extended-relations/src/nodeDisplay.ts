import type { ConfigApi } from '@backstage/core-plugin-api';
import type { Entity } from '@backstage/catalog-model';

export const NODE_FIELDS = [
  'title',
  'name',
  'system',
  'owner',
  'description',
  'type',
  'lifecycle',
] as const;

export type NodeField = (typeof NODE_FIELDS)[number];
export type NodeSubtitleField = NodeField | 'none';

export interface NodeDisplayConfig {
  title: NodeField;
  subtitle: NodeSubtitleField;
}

export const DEFAULT_NODE_DISPLAY: NodeDisplayConfig = {
  title: 'title',
  subtitle: 'system',
};

const CONFIG_KEY = 'catalogGraph.extendedRelations.node';
const MAX_DESCRIPTION_LENGTH = 40;

function isNodeField(value: string | undefined): value is NodeField {
  return NODE_FIELDS.some(field => field === value);
}

/**
 * Reads `catalogGraph.extendedRelations.node`. Unknown or missing values fall
 * back to the defaults so a typo never blanks the graph.
 */
export function readNodeDisplayConfig(config: ConfigApi): NodeDisplayConfig {
  const title = config.getOptionalString(`${CONFIG_KEY}.title`);
  const subtitle = config.getOptionalString(`${CONFIG_KEY}.subtitle`);
  return {
    title: isNodeField(title) ? title : DEFAULT_NODE_DISPLAY.title,
    subtitle:
      subtitle === 'none' || isNodeField(subtitle)
        ? subtitle
        : DEFAULT_NODE_DISPLAY.subtitle,
  };
}

export interface NodeFieldSources {
  entity: Entity;
  /** `useEntityPresentation` primary title of the entity itself. */
  presentationTitle: string | undefined;
  /** Display title of the entity's `spec.system`, when it has one. */
  systemTitle: string | undefined;
  /** Display title of the entity's `spec.owner`, when it has one. */
  ownerTitle: string | undefined;
}

function nonEmpty(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

/** Resolves one display field, or `undefined` when the entity lacks it. */
export function resolveNodeField(
  field: NodeSubtitleField,
  { entity, presentationTitle, systemTitle, ownerTitle }: NodeFieldSources,
): string | undefined {
  switch (field) {
    case 'none':
      return undefined;
    case 'title':
      return presentationTitle ?? nonEmpty(entity.metadata.title);
    case 'name':
      return entity.metadata.name;
    case 'system':
      return systemTitle;
    case 'owner':
      return ownerTitle;
    case 'description': {
      const description = nonEmpty(entity.metadata.description);
      return description && description.length > MAX_DESCRIPTION_LENGTH
        ? `${description.slice(0, MAX_DESCRIPTION_LENGTH - 1)}…`
        : description;
    }
    case 'type':
      return nonEmpty(entity.spec?.type);
    case 'lifecycle':
      return nonEmpty(entity.spec?.lifecycle);
    default:
      return undefined;
  }
}
