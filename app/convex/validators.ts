import { v } from "convex/values";

export const statusValidator = v.union(
  v.literal("todo"),
  v.literal("in progress"),
  v.literal("completed"),
  v.literal("cancelled"),
);

export const trackedItemValidator = v.object({
  _id: v.id("trackedItems"),
  _creationTime: v.number(),
  userId: v.string(),
  uniqueId: v.string(),
  status: statusValidator,
  dateStarted: v.string(),
  dateUpdated: v.string(),
  dateCompleted: v.optional(v.string()),
  dateCancelled: v.optional(v.string()),
});

