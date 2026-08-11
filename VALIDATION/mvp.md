# Favorites MVP Validation

These checks are derived proof obligations. They do not supersede `/KERNEL/`.

| Kernel property | Proof obligation |
| --- | --- |
| INV-001 | Reject non-UUIDv1 user IDs; registering the same UUIDv1 is idempotent. |
| INV-002 | A created item contains the owner, exact submitted URL, status, started date, updated date, and optional terminal dates. |
| INV-002 | The same submitted URL, or one differing only by one trailing path slash, is rejected for the same user but may be stored by different users. |
| INV-002 | No API operation can modify an item's URL after creation. |
| INV-002 | All application-created dates are valid ISO 8601 strings. |
| INV-003 | Reject statuses outside the four-value union. |
| Unrestricted transitions | Every valid status can change directly to every other valid status. |
| Same-status no-op | Updating to the current status returns the unchanged item and dates. |
| Convex integration | Schema, query, and mutation code type-checks against generated Convex types. |
| Presentation | UI tests cover the Feneky header link, loading, empty, initial status, duplicate feedback, collapse, Date/ID sorting, inline status handling, and cancellation confirmation without a detail panel. |

## Commands

```sh
npm test
npm run typecheck:convex
npm run lint
npm run build
```
