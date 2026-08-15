import { ConvexError, v } from "convex/values";

import {
  assertLinkUrl,
  assertUuidV1,
  statusDatePatch,
  trailingSlashDuplicateKey,
} from "../models/trackedItem";
import { mutation, query } from "./_generated/server";
import { statusValidator, trackedItemValidator } from "./validators";

export const list = query({
  args: { userId: v.string() },
  returns: v.array(trackedItemValidator),
  handler: async (ctx, { userId }) => {
    assertUuidV1(userId);

    return await ctx.db
      .query("trackedItems")
      .withIndex("by_user_id", (index) => index.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    userId: v.string(),
    url: v.string(),
    status: v.optional(statusValidator),
  },
  returns: trackedItemValidator,
  handler: async (ctx, { userId, url, status }) => {
    assertUuidV1(userId);
    assertLinkUrl(url);

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (index) => index.eq("userId", userId))
      .unique();
    if (!user) {
      throw new Error("User must be registered before adding favorites");
    }

    const exactExisting = await ctx.db
      .query("trackedItems")
      .withIndex("by_user_and_unique_id", (index) =>
        index.eq("userId", userId).eq("uniqueId", url),
      )
      .unique();
    const duplicateKey = trailingSlashDuplicateKey(url);
    const existing =
      exactExisting ??
      (
        await ctx.db
          .query("trackedItems")
          .withIndex("by_user_id", (index) => index.eq("userId", userId))
          .collect()
      ).find(
        (item) => trailingSlashDuplicateKey(item.uniqueId) === duplicateKey,
      );
    if (existing) {
      throw new ConvexError("This link is already being tracked.");
    }

    const timestamp = new Date().toISOString();
    const initialStatus = status ?? "todo";
    const itemId = await ctx.db.insert("trackedItems", {
      userId,
      uniqueId: url,
      status: initialStatus,
      dateStarted: timestamp,
      dateUpdated: timestamp,
      ...statusDatePatch(initialStatus, timestamp),
    });

    const item = await ctx.db.get(itemId);
    if (!item) {
      throw new Error("New favorite could not be read");
    }
    return item;
  },
});

export const updateStatus = mutation({
  args: {
    userId: v.string(),
    itemId: v.id("trackedItems"),
    status: statusValidator,
  },
  returns: trackedItemValidator,
  handler: async (ctx, { userId, itemId, status }) => {
    assertUuidV1(userId);

    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) {
      throw new Error("Favorite was not found for this user");
    }
    if (item.status === status) {
      return item;
    }

    const timestamp = new Date().toISOString();
    await ctx.db.patch(itemId, {
      status,
      dateUpdated: timestamp,
      ...statusDatePatch(status, timestamp),
    });

    const updated = await ctx.db.get(itemId);
    if (!updated) {
      throw new Error("Updated favorite could not be read");
    }
    return updated;
  },
});
