# Contributing Guidelines

`backstage-plugins` is [Apache 2.0 licensed](LICENSE) and accepts contributions via
GitHub pull requests. This document outlines some of the conventions on
development workflow, commit message formatting, contact points, and other
resources to make it easier to get your contribution accepted.

## Support Channels

The official support channels, for both users and contributors, are:

- GitHub [issues](https://github.com/raccoon-core/backstage-plugins/issues)

## How to Contribute

Pull Requests (PRs) are the main and exclusive way to contribute to the project.

## Local setup

### Create a fork

[Fork][fork], then clone the repository:

```
git clone git@github.com:your_github_username/backstage-plugins.git
cd backstage-plugins
git remote add upstream https://github.com/raccoon-core/backstage-plugins.git
git fetch upstream
```

### Install dependencies

```
yarn install
```

Each plugin package can be built, linted and tested standalone via
`backstage-cli package <build|lint|test>` (wired up as the `build`/`lint`/`test`
scripts in that package's `package.json`). This repo has no dev app — verify a
plugin against a real Backstage instance by linking it into one, or by
consuming it from npm once published.

## Making Changes

Start by creating a new branch for your changes:

```
git checkout main
git fetch upstream
git rebase upstream/main
git checkout -b new-feature
```

Make your changes, then ensure that `yarn lint` and `yarn test` still pass. If you're satisfied with your changes, push them to your fork.

```
git push origin new-feature
```

Then use the GitHub UI to open a pull request.

Your changes are much more likely to be approved if you:

- add tests for new functionality
- write a [good commit message][commit-message]
- maintain backward compatibility

## Creating Changesets

We use [changesets](https://github.com/changesets/changesets) in order to prepare releases. To make the process of generating releases easy, please include changesets with your pull request. This will result in every package affected by a change getting a proper version number and an entry in its `CHANGELOG.md`.

### When to use a changeset?

Any time a patch, minor, or major change aligning to [Semantic Versioning](https://semver.org) is made to any published package in `plugins/`, a changeset should be used.
In general, changesets are not needed for documentation, build utilities or similar.

### How to create a changeset

1. Run `yarn changeset`
2. Select which packages you want to include a changeset for
3. Select the impact of the change you're introducing (`major` for breaking changes, `minor` for new backward-compatible functionality, `patch` otherwise)
4. Explain your changes in the generated changeset. See [examples of well written changesets](https://backstage.io/docs/getting-started/contributors#writing-changesets)
5. Add the generated changeset to git
6. Push the commit with your changeset to the branch associated with your PR

Merging to `main` opens/updates a "Version Packages" PR (via the `Release` workflow). Merging that PR publishes the updated packages to npm under the `@raccoon-core` scope.

## Graduating a plugin to backstage-community

Once a plugin here is stable and org-agnostic, open a PR against
[backstage/community-plugins](https://github.com/backstage/community-plugins)
following their [contribution guide](https://github.com/backstage/community-plugins/blob/main/CONTRIBUTING.md).
Deprecate the `@raccoon-core` package in its final changeset, pointing consumers
at the new `@backstage-community` package.

[fork]: https://github.com/raccoon-core/backstage-plugins/fork
[commit-message]: http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html
