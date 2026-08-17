# Favorites MVP Specification

This document is derived from `/KERNEL/` and records the implementation interpretation used by the MVP. The kernel remains authoritative.

## Domain

### User

- `userId`: a unique UUIDv1 string bound to one verified Google token identifier.
- `tokenIdentifier`: the stable issuer-plus-subject identity derived by Convex from a verified Google ID-token JWT.
- Convex's internal document ID is storage infrastructure and does not replace `userId`.
- Public favorites functions derive the owner from the authenticated identity and never trust a caller-supplied `userId`.
- An existing unclaimed browser-local UUIDv1 may be linked once during the migration to authenticated identity.

### Tracked item

- `userId`: owner UUIDv1.
- `uniqueId`: the exact URL string submitted by the user. It is stored without normalization.
- Duplicate comparison ignores one trailing path slash immediately before a query, fragment, or the end of the URL. All other URL differences remain significant.
- A user may have only one item per duplicate comparison key. Different users may track the same URL.
- `status`: one of `todo`, `in progress`, `completed`, or `cancelled`.
- `dateStarted`: ISO 8601 string set when the item is created.
- `dateUpdated`: ISO 8601 string set when the item is created and whenever its status changes.
- `dateCompleted`: optional ISO 8601 string set when the item enters `completed`.
- `dateCancelled`: optional ISO 8601 string set when the item enters `cancelled`.

Status transitions are unrestricted. Entering a terminal status records its corresponding timestamp without preventing later transitions.
Changing an item to its current status is a no-op and does not change any dates.
An item's `uniqueId` cannot be changed after creation.

## MVP behavior

1. On first use, the user signs in through Google Identity Services and the browser passes Google's ID-token JWT to Convex.
2. Convex verifies the JWT issuer, audience, signature, and expiry. The app then idempotently resolves or creates the Google identity's UUIDv1 user, claiming a matching unclaimed browser-local user when present.
3. The user can add a valid HTTP or HTTPS URL. The exact submitted string is stored, and the initial status defaults to `todo` but may be chosen from any valid status.
4. Re-adding the same URL, including a variant differing only by one trailing path slash, is rejected with a helpful error and does not create a duplicate.
5. The user can view their items and change any item directly to any valid status. Changing to `cancelled` requires UI confirmation.
6. The tracked-link listing starts expanded and can be collapsed or expanded as a whole.
7. Rows show the URL followed by status and locally formatted modified date.
8. Items default to modified-date descending order and can be sorted ascending or descending by modified date or URL ID.
9. The interface shows loading, empty, success, and error states.
10. The interface uses a responsive single-list layout with inline status controls built with Material UI defaults.
11. The header links to `https://feneky.com/links` with the text “Find your next great thing!”
12. The signed-in view identifies the Google account and supports sign-out. The ID token is retained only for the browser tab session and is discarded shortly before expiry; the user signs in again rather than using an application-owned refresh session.

## Architecture mapping

- `app/models/`: framework-independent domain types and rules.
- `app/convex/`: persistence schema and controllers (queries and mutations).
- `app/src/`: React/Material UI presentation and client orchestration.
