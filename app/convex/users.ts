import { v } from "convex/values";

import { assertUuidV1 } from "../models/trackedItem";
import { requireTokenIdentifier } from "./auth";
import { mutation } from "./_generated/server";

export const ensure = mutation({
  args: { proposedUserId: v.string() },
  returns: v.string(),
  handler: async (ctx, { proposedUserId }) => {
    assertUuidV1(proposedUserId);
    const tokenIdentifier = await requireTokenIdentifier(ctx);

    const authenticatedUser = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (query) =>
        query.eq("tokenIdentifier", tokenIdentifier),
      )
      .unique();
    if (authenticatedUser) {
      return authenticatedUser.userId;
    }

    const browserUser = await ctx.db
      .query("users")
      .withIndex("by_user_id", (query) =>
        query.eq("userId", proposedUserId),
      )
      .unique();
    if (browserUser) {
      if (browserUser.tokenIdentifier) {
        throw new Error("This browser user is already linked to another account.");
      }
      await ctx.db.patch(browserUser._id, { tokenIdentifier });
      return browserUser.userId;
    }

    await ctx.db.insert("users", {
      userId: proposedUserId,
      tokenIdentifier,
    });
    return proposedUserId;
  },
});
