import { alpha } from '@material-ui/core/styles';
import Build from '@material-ui/icons/Build';
import Cached from '@material-ui/icons/Cached';
import CloudQueue from '@material-ui/icons/CloudQueue';
import Code from '@material-ui/icons/Code';
import CompareArrows from '@material-ui/icons/CompareArrows';
import DeviceHub from '@material-ui/icons/DeviceHub';
import DynamicFeed from '@material-ui/icons/DynamicFeed';
import Folder from '@material-ui/icons/Folder';
import Functions from '@material-ui/icons/Functions';
import Http from '@material-ui/icons/Http';
import Language from '@material-ui/icons/Language';
import Layers from '@material-ui/icons/Layers';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import Memory from '@material-ui/icons/Memory';
import People from '@material-ui/icons/People';
import Person from '@material-ui/icons/Person';
import Queue from '@material-ui/icons/Queue';
import Settings from '@material-ui/icons/Settings';
import Share from '@material-ui/icons/Share';
import Storage from '@material-ui/icons/Storage';
import Sync from '@material-ui/icons/Sync';
import Timeline from '@material-ui/icons/Timeline';
import Web from '@material-ui/icons/Web';
import Widgets from '@material-ui/icons/Widgets';
import {
  SiApachecassandra,
  SiApachekafka,
  SiElasticsearch,
  SiKeycloak,
  SiMongodb,
  SiPostgresql,
  SiRedis,
} from 'react-icons/si';
import type { ComponentType } from 'react';

const KIND_PALETTE: Record<
  string,
  { accent: string; tint: string; darkTint: string }
> = {
  component: { accent: '#3b82f6', tint: '#eff6ff', darkTint: '#1e40af' },
  system: { accent: '#6366f1', tint: '#eef2ff', darkTint: '#3730a3' },
  domain: { accent: '#7c3aed', tint: '#f5f3ff', darkTint: '#5b21b6' },
  resource: { accent: '#0ea5e9', tint: '#f0f9ff', darkTint: '#075985' },
  api: { accent: '#06b6d4', tint: '#ecfeff', darkTint: '#155e75' },
  group: { accent: '#10b981', tint: '#ecfdf5', darkTint: '#065f46' },
  user: { accent: '#f59e0b', tint: '#fffbeb', darkTint: '#92400e' },
  location: { accent: '#64748b', tint: '#f8fafc', darkTint: '#1e293b' },
  template: { accent: '#8b5cf6', tint: '#f5f3ff', darkTint: '#6b21a8' },
};

const DEFAULT_KIND_PALETTE = {
  accent: '#6b7280',
  tint: '#f3f4f6',
  darkTint: '#1e293b',
};

export function getNodeColor(kind: string | undefined): string {
  if (!kind) return DEFAULT_KIND_PALETTE.accent;
  return (KIND_PALETTE[kind.toLowerCase()] ?? DEFAULT_KIND_PALETTE).accent;
}

export function getNodeTintFill(
  kind: string | undefined,
  isDark = false,
): string {
  const p = KIND_PALETTE[kind?.toLowerCase() ?? ''] ?? DEFAULT_KIND_PALETTE;
  return isDark ? p.darkTint : p.tint;
}

export function withAlpha(color: string, fraction: number): string {
  return alpha(color, fraction);
}

const KIND_FULL_LABELS: Record<string, string> = {
  domain: 'Domain',
  system: 'System',
  component: 'Component',
  resource: 'Resource',
  api: 'API',
  group: 'Group',
  user: 'User',
  location: 'Location',
  template: 'Template',
};

export function getNodeKindLabel(kind: string | undefined): string | undefined {
  if (!kind) return undefined;
  return KIND_FULL_LABELS[kind.toLowerCase()];
}

export function getNodeBadgeLabel(
  kind: string | undefined,
  specType: string | undefined,
): string | undefined {
  if (specType) {
    const spaced = specType.replace(/[_-]+/g, ' ');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
  }
  return getNodeKindLabel(kind);
}

const TYPE_ICONS: Record<string, ComponentType<any>> = {
  service: Settings,
  website: Web,
  frontend: Web,
  backend: Memory,
  library: LibraryBooks,
  worker: Build,
  job: Timeline,
  batch: Queue,
  function: Functions,
  queue: Queue,
  openapi: Code,
  rest: Http,
  grpc: CompareArrows,
  asyncapi: Sync,
  graphql: Share,
  database: Storage,
  s3: CloudQueue,
  bucket: CloudQueue,
  cache: Cached,
  topic: DynamicFeed,
  cdn: CloudQueue,
  postgresql: SiPostgresql,
  postgres: SiPostgresql,
  patroni: SiPostgresql,
  kafka: SiApachekafka,
  cassandra: SiApachecassandra,
  redis: SiRedis,
  mongodb: SiMongodb,
  mongo: SiMongodb,
  elasticsearch: SiElasticsearch,
  elastic: SiElasticsearch,
  elk: SiElasticsearch,
  keycloak: SiKeycloak,
  'ttg-sso': SiKeycloak,
};

const KIND_ICONS: Record<string, ComponentType<any>> = {
  component: Widgets,
  system: Layers,
  domain: Language,
  resource: Storage,
  api: DeviceHub,
  group: People,
  user: Person,
  location: Folder,
  template: LibraryBooks,
};

/**
 * Keywords to scan for inside entity names (order matters — first match wins).
 * Entries are lowercased substrings.
 */
const NAME_KEYWORD_ICONS: [string, ComponentType<any>][] = [
  ['kafka', SiApachekafka],
  ['cassandra', SiApachecassandra],
  ['redis', SiRedis],
  ['mongodb', SiMongodb],
  ['mongo', SiMongodb],
  ['elasticsearch', SiElasticsearch],
  ['elastic', SiElasticsearch],
  ['patroni', SiPostgresql],
  ['postgres', SiPostgresql],
  ['postgresql', SiPostgresql],
  ['keycloak', SiKeycloak],
  ['ttg-sso', SiKeycloak],
];

export function getNodeIcon(
  kind: string | undefined,
  specType: string | undefined,
  entityName?: string,
): ComponentType<any> | undefined {
  // Name-based tech detection takes highest priority
  if (entityName) {
    const lower = entityName.toLowerCase();
    for (const [keyword, icon] of NAME_KEYWORD_ICONS) {
      if (lower.includes(keyword)) return icon;
    }
  }
  if (specType) {
    const byType = TYPE_ICONS[specType.toLowerCase()];
    if (byType) return byType;
  }
  return kind ? KIND_ICONS[kind.toLowerCase()] : undefined;
}
