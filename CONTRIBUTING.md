# Contributing

Intrepid Ibex uses Changesets to track release intent and update the app version.

## Versioning

The current app is version `1.0.0`.

Use semantic versioning:

- `patch`: bug fixes, small visual fixes, copy changes, and internal maintenance.
- `minor`: new user-facing features that preserve existing behavior.
- `major`: breaking route, data, storage, or workflow changes.

This is a private static app, not an npm package. Changesets is still used to keep `package.json` and the changelog honest.

## Adding a Changeset

When a pull request changes user-visible behavior, data behavior, routes, build output, or public docs, add a changeset:

```sh
pnpm changeset
```

Pick `intrepid-ibex`, choose the bump type, and write a short summary in user-facing terms.

Do not add a changeset for:

- test-only changes
- local tooling tweaks with no user-facing effect
- refactors that do not change behavior

When in doubt, add a patch changeset. It is cheaper to have a clear changelog entry than
to lose release context.

## Cutting a Version

To prepare a release:

```sh
pnpm version
```

That runs `changeset version`, consumes pending files in `.changeset/`, updates
`package.json`, and updates the changelog.

Then run the normal checks:

```sh
pnpm check
pnpm test:unit
pnpm build
```

Commit the version changes with the source changes they describe. Do not publish to npm.

## Display Versions

The app may display a build label like:

```text
v1.0.0.dev-47+gc125759
```

The base `1.0.0` comes from `package.json`. The `dev` count and git hash should be generated at build time from git metadata.
