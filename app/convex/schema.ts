import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(),
  }).index("by_user_id", ["userId"]),

  trackedItems: defineTable({
    userId: v.string(),
    uniqueId: v.string(),
    status: v.union(
      v.literal("todo"),
      v.literal("in progress"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    dateStarted: v.string(),
    dateUpdated: v.string(),
    dateCompleted: v.optional(v.string()),
    dateCancelled: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_and_unique_id", ["userId", "uniqueId"]),
});
