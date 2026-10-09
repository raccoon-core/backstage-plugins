import type { Entity } from '@backstage/catalog-model';
import { mockApis } from '@backstage/frontend-test-utils';
import {
  DEFAULT_NODE_DISPLAY,
  readNodeDisplayConfig,
  resolveNodeField,
} from './nodeDisplay';
import type { NodeFieldSources } from './nodeDisplay';

const entity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'bai',
    title: 'Bank Account Identification',
    description: 'Identifies bank accounts',
  },
  spec: { type: 'application', lifecycle: 'production' },
};

const sources: NodeFieldSources = {
  entity,
  presentationTitle: 'bai',
  systemTitle: 'Payments',
  ownerTitle: 'Team Alpha',
};

describe('readNodeDisplayConfig', () => {
  it('defaults to title + system when unset', () => {
    expect(readNodeDisplayConfig(mockApis.config())).toEqual(
      DEFAULT_NODE_DISPLAY,
    );
  });

  it('reads configured fields, including none', () => {
    const config = mockApis.config({
      data: {
        catalogGraph: {
          extendedRelations: { node: { title: 'name', subtitle: 'none' } },
        },
      },
    });
    expect(readNodeDisplayConfig(config)).toEqual({
      title: 'name',
      subtitle: 'none',
    });
  });

  it('falls back to defaults on unknown values', () => {
    const config = mockApis.config({
      data: {
        catalogGraph: {
          extendedRelations: { node: { title: 'none', subtitle: 'bogus' } },
        },
      },
    });
    expect(readNodeDisplayConfig(config)).toEqual(DEFAULT_NODE_DISPLAY);
  });
});

describe('resolveNodeField', () => {
  it.each([
    ['title', 'bai'],
    ['name', 'bai'],
    ['system', 'Payments'],
    ['owner', 'Team Alpha'],
    ['description', 'Identifies bank accounts'],
    ['type', 'application'],
    ['lifecycle', 'production'],
  ] as const)('resolves %s', (field, expected) => {
    expect(resolveNodeField(field, sources)).toBe(expected);
  });

  it('returns undefined for none', () => {
    expect(resolveNodeField('none', sources)).toBeUndefined();
  });

  it('returns undefined when the entity lacks the field', () => {
    const bare: NodeFieldSources = {
      entity: { ...entity, spec: {} },
      presentationTitle: undefined,
      systemTitle: undefined,
      ownerTitle: undefined,
    };
    expect(resolveNodeField('system', bare)).toBeUndefined();
    expect(resolveNodeField('type', bare)).toBeUndefined();
    expect(resolveNodeField('lifecycle', bare)).toBeUndefined();
  });

  it('truncates long descriptions', () => {
    const long: Entity = {
      ...entity,
      metadata: { ...entity.metadata, description: 'x'.repeat(100) },
    };
    const result = resolveNodeField('description', {
      ...sources,
      entity: long,
    });
    expect(result).toHaveLength(40);
    expect(result?.endsWith('…')).toBe(true);
  });
});
