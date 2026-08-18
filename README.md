# backstage-plugins

Set of Backstage plugins used in production before pushing them to
[backstage/community-plugins](https://github.com/backstage/community-plugins).

Published to npm under the [`@racooncorp`](https://www.npmjs.com/org/racooncorp) scope, versioned with
[Changesets](https://github.com/changesets/changesets).

## Plugins

| Plugin                                                                                     | Package                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [catalog-graph-module-extended-relations](plugins/catalog-graph-module-extended-relations) | [`@racooncorp/backstage-plugin-catalog-graph-module-extended-relations`](https://www.npmjs.com/package/@racooncorp/backstage-plugin-catalog-graph-module-extended-relations) |

## Local development

```
yarn install
yarn lint:all
yarn tsc
yarn build:all
yarn test:all
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the release process.
