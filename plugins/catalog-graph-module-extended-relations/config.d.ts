export interface Config {
  catalogGraph?: {
    extendedRelations?: {
      /**
       * Which entity fields the graph nodes display. Read by frontend code
       * only, hence `@visibility frontend`.
       * @visibility frontend
       */
      node?: {
        /**
         * First (bold) line of the node. Defaults to `title`
         * (`metadata.title`, else the entity's display name).
         * @visibility frontend
         */
        title?:
          | 'title'
          | 'name'
          | 'system'
          | 'owner'
          | 'description'
          | 'type'
          | 'lifecycle';
        /**
         * Second (smaller) line of the node, `none` to hide it. Defaults to
         * `system`. Hidden automatically when the entity lacks the field.
         * @visibility frontend
         */
        subtitle?:
          | 'title'
          | 'name'
          | 'system'
          | 'owner'
          | 'description'
          | 'type'
          | 'lifecycle'
          | 'none';
      };
      /**
       * Overrides for the entity-kind color palette used by the catalog
       * dependency graph (and anywhere else in the app that reuses
       * `getNodeColor`/`getNodeTintFill`, e.g. search result kind badges).
       *
       * Each entry overrides either a whole `kind`'s palette, or - when
       * `type` is also given - just that `kind`+`spec.type` combination
       * (e.g. kind: Component, type: third-party).
       *
       * Read by frontend code only (`GraphPaletteConfigLoader.tsx`) - every
       * field below must stay `@visibility frontend` or it gets stripped
       * before reaching the browser (config defaults to backend-only
       * visibility unless a schema says otherwise).
       * @deepVisibility frontend
       */
      palette?: Array<{
        /**
         * Entity kind to recolor, case-insensitive (e.g. "Component").
         */
        kind: string;
        /**
         * Optional spec.type to scope this override to, case-insensitive
         * (e.g. "third-party"). Omit to override the whole kind's palette.
         */
        type?: string;
        /**
         * Accent color (CSS color string) used for the node's left border
         * bar and badge text/border.
         */
        accent: string;
        /**
         * Node background fill used in light theme.
         */
        tint: string;
        /**
         * Node background fill used in dark theme.
         */
        darkTint: string;
      }>;
    };
  };
}
