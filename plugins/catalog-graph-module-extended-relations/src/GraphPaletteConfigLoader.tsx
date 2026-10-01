import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { useEffect } from 'react';
import { applyPaletteOverrides } from './graphUtils';

const CONFIG_KEY = 'catalogGraph.extendedRelations.palette';

/**
 * Mounted once at the app root (see `module.tsx`) to read
 * `catalogGraph.extendedRelations.palette` from app-config and apply it as
 * overrides onto the module-level palette that `getNodeColor`/
 * `getNodeTintFill` read from. Renders nothing - same side-effect-only
 * pattern as `DependencyGraphZoomOverrides`.
 */
export function GraphPaletteConfigLoader(): null {
  const config = useApi(configApiRef);

  useEffect(() => {
    const entries = config.getOptionalConfigArray(CONFIG_KEY) ?? [];
    applyPaletteOverrides(
      entries.map(entry => ({
        kind: entry.getString('kind'),
        type: entry.getOptionalString('type'),
        accent: entry.getString('accent'),
        tint: entry.getString('tint'),
        darkTint: entry.getString('darkTint'),
      })),
    );
  }, [config]);

  return null;
}
