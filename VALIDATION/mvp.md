# Favorites MVP Validation

These checks are derived proof obligations. They do not supersede `/KERNEL/`.

| Kernel property | Proof obligation |
| --- | --- |
| INV-001 | Reject non-UUIDv1 user IDs; registering the same UUIDv1 is idempotent. |
| INV-002 | A created item contains the owner, exact submitted URL, status, started date, updated date, and optional terminal dates. |
| INV-002 | The same submitted URL is unique per user but may be stored by different users. |
| INV-002 | All application-created dates are valid ISO 8601 strings. |
| INV-003 | Reject statuses outside the four-value union. |
| Unrestricted transitions | Every valid status can change directly to every other valid status. |
| Convex integration | Schema, query, and mutation code type-checks against generated Convex types. |
| Presentation | The production bundle builds, ESLint passes, and UI tests cover loading, empty, add, selection, and status-change paths. |

## Commands

```sh
npm test
npm run lint
npm run build
```

