export interface Config {
  catalogGraph?: {
    extendedRelations?: {
      /**
       * Overrides for the entity-kind color palette used by the catalog
       * dependency graph (and anywhere else in the app that reuses
       * `getNodeColor`/`getNodeTintFill`, e.g. search result kind badges).
       *
       * Each entry overrides either a whole `kind`'s palette, or - when
       * `type` is also given - just that `kind`+`spec.type` combination
       * (e.g. kind: Component, type: third-party).
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
         * @visibility frontend
         */
        accent: string;
        /**
         * Node background fill used in light theme.
         * @visibility frontend
         */
        tint: string;
        /**
         * Node background fill used in dark theme.
         * @visibility frontend
         */
        darkTint: string;
      }>;
    };
  };
}
