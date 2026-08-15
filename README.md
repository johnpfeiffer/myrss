# Favorites

A small Convex and React app for tracking progress through saved links. Each browser gets a UUIDv1 user identity, while favorites and their status history are stored durably in Convex.

## Features

- Save an HTTP or HTTPS link using the exact submitted string.
- Choose an initial status, defaulting to `todo`.
- Track `todo`, `in progress`, `completed`, and `cancelled` statuses.
- Move directly between any statuses.
- Record ISO 8601 started, updated, completed, and cancelled dates.
- Reject duplicate URLs per user—including variants differing only by a trailing slash—with helpful feedback.
- Sort by modified date or URL ID in either direction and collapse the saved-links listing.
- Confirm before changing an existing favorite to `cancelled`.
- Change status directly in a responsive Material UI list without a separate details panel.

## Local development

Requirements: a current Node.js release supported by Vite and a Convex account.

```sh
cd app
npm install
npx convex dev
```

The first `convex dev` run connects or creates a Convex project, deploys the schema and functions, generates the typed client API, and writes `VITE_CONVEX_URL` to `.env.local`. Keep that command running and start the UI in another terminal:

```sh
cd app
npm run dev
```

Open the local address printed by Vite.

## Validation

```sh
cd app
npm test
npm run typecheck:convex
npm run lint
npm run build
npm audit
```

`npm test` exercises the public Convex functions with `convex-test` and verifies the main user-visible UI states with Testing Library.

## Monorepo deployment

The runnable project lives in `app/`. From the repository root, copy its deployment-safe files into the sibling `codespaces-react` monorepo:

```sh
./cloud-deploy.sh
```

This targets `../codespaces-react/apps/track-favorites/` and excludes dependencies, build output, local environment files, and tests. The monorepo build environment must provide `VITE_CONVEX_URL` for the intended Convex deployment.

Set `DEST` to override the copy destination for validation or another checkout.

## Identity note

The MVP stores a generated UUIDv1 in browser local storage and uses it as the user identity. Favorites themselves live in Convex; local storage is not the source of truth for tracked items. This device-local identity is intentionally simple and is not authentication.

See [architecture.md](architecture.md) for the system design and user journey. The governing requirements remain in `KERNEL/`; derived interpretations and checks are in `SPEC/` and `VALIDATION/`.
