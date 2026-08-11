# Favorites

A small Convex and React app for tracking progress through saved links. Each browser gets a UUIDv1 user identity, while favorites and their status history are stored durably in Convex.

## Features

- Save an HTTP or HTTPS link using the exact submitted string.
- Track `todo`, `in progress`, `completed`, and `cancelled` statuses.
- Move directly between any statuses.
- Record ISO 8601 started, updated, completed, and cancelled dates.
- Keep each URL unique per user while allowing different users to save the same URL.
- Use a responsive Material UI source-list and detail layout.

## Local development

Requirements: a current Node.js release supported by Vite and a Convex account.

```sh
npm install
npx convex dev
```

The first `convex dev` run connects or creates a Convex project, deploys the schema and functions, generates the typed client API, and writes `VITE_CONVEX_URL` to `.env.local`. Keep that command running and start the UI in another terminal:

```sh
npm run dev
```

Open the local address printed by Vite.

## Validation

```sh
npm test
npm run typecheck:convex
npm run lint
npm run build
npm audit
```

`npm test` exercises the public Convex functions with `convex-test` and verifies the main user-visible UI states with Testing Library.

## Identity note

The MVP stores a generated UUIDv1 in browser local storage and uses it as the user identity. Favorites themselves live in Convex; local storage is not the source of truth for tracked items. This device-local identity is intentionally simple and is not authentication.

See [architecture.md](architecture.md) for the system design and user journey. The governing requirements remain in `KERNEL/`; derived interpretations and checks are in `SPEC/` and `VALIDATION/`.
