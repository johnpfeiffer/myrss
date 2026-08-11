# Favorites Architecture

This document describes the implementation derived from `/KERNEL/`. The kernel remains authoritative.

## System design

The app follows a small domain-driven MVC split. Framework-independent rules live in `models/`; Convex queries and mutations act as controllers around durable storage; React and Material UI provide the presentation.

The presentation is a single, spacious page organized into three levels: a strong page header with the Feneky call-to-action, a compact outlined add form, and a divider-based saved-links section. Link URLs receive the strongest visual emphasis; status controls and locally formatted update dates stay on the quieter second line. Material UI supplies the palette, typography, inputs, dialogs, and responsive behavior, with CSS limited to layout and spacing.

```mermaid
flowchart LR
    Browser["Browser-local UUIDv1"] --> View["React + MUI view"]
    View --> Controller["Client query/mutation controller"]
    Controller --> API["Convex public functions"]
    API --> Domain["Tracked-item domain rules"]
    API --> DB[("Convex database")]
    Schema["Convex schema + validators"] --> DB
    Domain --> API
    DB --> API --> Controller --> View
```

## Data model

`users` stores a unique indexed `userId` UUIDv1 string. `trackedItems` stores `userId`, the immutable exact submitted URL as `uniqueId`, one of the four valid statuses, required started and updated ISO date strings, and optional completed and cancelled ISO date strings.

Convex supplies `_id` and `_creationTime` system fields. They support storage mechanics but do not replace the kernel-required user ID, URL identity, or explicit ISO date fields.

The submitted URL is stored unchanged. The `by_user_and_unique_id` index finds exact duplicates efficiently; a user-scoped transactional comparison also removes one trailing path slash solely for duplicate detection. Duplicate insertion is rejected as an expected application error. The `by_user_id` index scopes reactive list queries to one user. The view orders its reactive result by modified date or URL ID without modifying persisted records.

## User journey

```mermaid
sequenceDiagram
    actor User
    participant UI as Favorites UI
    participant Identity as Browser identity
    participant API as Convex functions
    participant DB as Convex database

    User->>UI: Open the app
    UI->>Identity: Read or create UUIDv1
    UI->>API: Ensure user exists
    API->>DB: Find or insert user
    UI->>API: Subscribe to user's items
    API-->>UI: Loading, then current list
    User->>UI: Submit link and initial status
    UI->>API: Add exact URL string
    alt URL is new for this user
        API->>DB: Insert item and status dates
        DB-->>UI: Reactive list update
    else URL is already tracked
        API-->>UI: Helpful duplicate error
    end
    User->>UI: Sort or collapse the listing
    UI-->>UI: Reorder or hide rows locally
    User->>UI: Choose a new status inline
    alt Status is unchanged
        UI-->>UI: No operation
    else Status is cancelled
        UI-->>User: Request confirmation
        User->>UI: Confirm cancellation
        UI->>API: Update to cancelled
        API->>DB: Set status, updated date, and cancelled date
        DB-->>UI: Reactive list-row update
    else Any other valid status
        UI->>API: Update status
        API->>DB: Set status, updated date, and relevant terminal date
        DB-->>UI: Reactive list-row update
    end
```

## Validation strategy

- Convex API tests prove UUIDv1 validation, idempotent users, exact and trailing-slash duplicate rejection, selectable initial status, same-status no-ops, ownership-scoped reads, ISO timestamps, and unrestricted status transitions.
- Presentation tests prove the Feneky header link, loading and empty feedback, exact URL and initial-status submission, duplicate feedback, Date/ID sorting, listing collapse, inline status changes, cancellation confirmation, and absence of a detail panel.
- TypeScript production builds verify the generated Convex data model and UI integration.
- ESLint and npm audit cover static quality and known dependency advisories.

## Current boundary

The UUIDv1 is device-local identity, not authentication. Adding sign-in would require a new kernel requirement and an ownership model tied to authenticated principals; it is deliberately not inferred for this MVP.
