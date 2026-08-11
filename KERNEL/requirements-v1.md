Users of a "Favorites" app would like to track which favorite links (articles, blogs, podcasts, videos, papers, etc.) they have completed.

This is integrated with the convex.dev platform <https://docs.convex.dev/ai/overview>

so the language will be **Typescript**

# MVP Goal

Schema for
- storing a unique UserID (UUID) 
- storing which items a User has started (by unique ID: the URL)

Tracked Item:
- UserID
- uniqueID is the URL
- status
- date started (created)
- date updated (modified)
- date completed
- date cancelled

Tracked Item Statuses: "todo", "in progress", "completed", "cancelled" 

All dates are: an ISO 8601 date string (e.g. "2024-06-28" or "2024-06-28T15:04:05Z")


