Users of a "Favorites" app would like to track which favorite links (articles, blogs, podcasts, videos, papers, etc.) they have completed.

This is integrated with the convex.dev platform <https://docs.convex.dev/ai/overview>

so the language will be **Typescript**

# MVP Goal

Schema for
- storing a unique UserID (UUIDv1) 
- storing which items a User has started (by unique ID: the URL)

Tracked Item:
- UserID
- uniqueID is the URL
- status
- date started (created)
- date updated (modified)
- date completed (optional)
- date cancelled (optional)

Tracked Item Statuses: "todo", "in progress", "completed", "cancelled" 

All dates are: an ISO 8601 date string (e.g. "2024-06-28" or "2024-06-28T15:04:05Z")

# MVP UI

We should have a UI that allows a User to enter a new Link.
- there is a dropdown for the User to choose the status
- initial status is "todo"

The link should be a valid HTTP or HTTPS link.

A user should not be able to modify the URL after the item is created

They should have a listing of tracked links. (the section starts expanded, can collapse)

- Listings should show URL on the first line
- Second line should have the Status, and Modified Date (displayed in their local timezone)
- Items should by default be ordered by Modified Date (most recent at the top)

A user can sort the list (either descending or ascending) of tracked items by Date or ID



## Edge cases

- A user changing a status to the same thing is a no op
- If a User tries to add a duplicate Item, do not allow it, and provide a helpful error message

URLs differing only by one trailing slash count as duplicates

- If a User wants to change the status to Cancelled, in the UI, provide an extra confirmation UI


## MVP 1.1 UI

have a link to https://feneky.com/links with the phrase "Find your next great thing!"

