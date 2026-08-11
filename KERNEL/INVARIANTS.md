# Invariants

Invariants are properties that must remain true across all derived artifacts and implementation work.

## INV-001: Each User has a unique ID (UUIDv1)

## INV-002: Each Tracked Item for a User has the following attributes:

- UserID
- uniqueID is the Link URL (therefore cannot be modified after creation)
- status
- date started (created)
- date updated (modified)
- date completed (optional)
- date cancelled (optional)

All dates are: an ISO 8601 date string (e.g. "2024-06-28" or "2024-06-28T15:04:05Z")

## INV-003: Tracked Item Statuses: "todo", "in progress", "completed", "cancelled"


