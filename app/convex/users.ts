import { v } from "convex/values";

import { assertUuidV1 } from "../models/trackedItem";
import { mutation } from "./_generated/server";

export const ensure = mutation({
  args: { userId: v.string() },
  returns: v.id("users"),
  handler: async (ctx, { userId }) => {
    assertUuidV1(userId);

    const existing = await ctx.db
      .query("users")
      .withIndex("by_user_id", (query) => query.eq("userId", userId))
      .unique();

    return existing?._id ?? (await ctx.db.insert("users", { userId }));
  },
});

