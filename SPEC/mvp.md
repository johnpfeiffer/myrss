# Favorites MVP Specification

This document is derived from `/KERNEL/` and records the implementation interpretation used by the MVP. The kernel remains authoritative.

## Domain

### User

- `userId`: a unique UUIDv1 string generated for a browser-local user.
- Convex's internal document ID is storage infrastructure and does not replace `userId`.

### Tracked item

- `userId`: owner UUIDv1.
- `uniqueId`: the exact URL string submitted by the user. URLs are not normalized.
- The pair `(userId, uniqueId)` is unique. Different users may track the same submitted URL.
- `status`: one of `todo`, `in progress`, `completed`, or `cancelled`.
- `dateStarted`: ISO 8601 string set when the item is created.
- `dateUpdated`: ISO 8601 string set when the item is created and whenever its status changes.
- `dateCompleted`: optional ISO 8601 string set when the item enters `completed`.
- `dateCancelled`: optional ISO 8601 string set when the item enters `cancelled`.

Status transitions are unrestricted. Entering a terminal status records its corresponding timestamp without preventing later transitions.

## MVP behavior

1. On first use, the browser creates and retains a UUIDv1 user ID.
2. The app registers that user in Convex idempotently.
3. The user can add a valid URL. The exact submitted string is stored with `todo` status.
4. Re-adding the same exact URL for the same user selects the existing item rather than creating a duplicate.
5. The user can view their items and change any item directly to any valid status.
6. The interface shows loading, empty, success, and error states.
7. The interface uses a responsive source-list/detail layout built with Material UI defaults.

## Architecture mapping

- `src/models/`: framework-independent domain types and rules.
- `convex/`: persistence schema and controllers (queries and mutations).
- `src/`: React/Material UI presentation and client orchestration.

