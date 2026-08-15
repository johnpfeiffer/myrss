/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const userOne = "f47ac10b-58cc-11cf-a447-001122334455";
const userTwo = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

describe("favorites API", () => {
  test("registers UUIDv1 users idempotently and rejects other identifiers", async () => {
    const t = convexTest(schema, modules);

    const firstId = await t.mutation(api.users.ensure, { userId: userOne });
    const repeatedId = await t.mutation(api.users.ensure, { userId: userOne });

    expect(repeatedId).toBe(firstId);
    await expect(
      t.mutation(api.users.ensure, {
        userId: "f47ac10b-58cc-41cf-a447-001122334455",
      }),
    ).rejects.toThrow();
  });

  test("keeps the exact submitted URL unique per user", async () => {
    const t = convexTest(schema, modules);
    const submittedUrl = "https://Example.com/article/?ref=Favorites";

    await t.mutation(api.users.ensure, { userId: userOne });
    await t.mutation(api.users.ensure, { userId: userTwo });

    const first = await t.mutation(api.trackedItems.add, {
      userId: userOne,
      url: submittedUrl,
    });
    await expect(
      t.mutation(api.trackedItems.add, {
        userId: userOne,
        url: submittedUrl,
      }),
    ).rejects.toThrow(/already/i);
    const otherUsersCopy = await t.mutation(api.trackedItems.add, {
      userId: userTwo,
      url: submittedUrl,
    });

    expect(otherUsersCopy._id).not.toBe(first._id);
    expect(first).toMatchObject({
      userId: userOne,
      uniqueId: submittedUrl,
      status: "todo",
    });
    expect(first.dateStarted).toBe(first.dateUpdated);
    expect(first.dateCompleted).toBeUndefined();
    expect(first.dateCancelled).toBeUndefined();
    expect(new Date(first.dateStarted).toISOString()).toBe(first.dateStarted);
  });

  test.each([
    ["https://example.com/article/", "https://example.com/article"],
    ["https://example.com/article/?ref=one", "https://example.com/article?ref=one"],
  ])(
    "treats %s and %s as trailing-slash duplicates",
    async (submittedUrl, duplicateUrl) => {
      const t = convexTest(schema, modules);
      await t.mutation(api.users.ensure, { userId: userOne });

      const first = await t.mutation(api.trackedItems.add, {
        userId: userOne,
        url: submittedUrl,
      });

      await expect(
        t.mutation(api.trackedItems.add, {
          userId: userOne,
          url: duplicateUrl,
        }),
      ).rejects.toThrow(/already/i);
      expect(first.uniqueId).toBe(submittedUrl);
    },
  );

  test.each(["todo", "in progress", "completed", "cancelled"] as const)(
    "allows a direct transition to %s",
    async (status) => {
      const t = convexTest(schema, modules);
      await t.mutation(api.users.ensure, { userId: userOne });
      const item = await t.mutation(api.trackedItems.add, {
        userId: userOne,
        url: `https://example.com/${encodeURIComponent(status)}`,
      });

      const updated = await t.mutation(api.trackedItems.updateStatus, {
        userId: userOne,
        itemId: item._id,
        status,
      });

      expect(updated.status).toBe(status);
      expect(new Date(updated.dateUpdated).toISOString()).toBe(
        updated.dateUpdated,
      );
      if (status === "completed") {
        expect(updated.dateCompleted).toBe(updated.dateUpdated);
      }
      if (status === "cancelled") {
        expect(updated.dateCancelled).toBe(updated.dateUpdated);
      }
    },
  );

  test.each(["todo", "in progress", "completed", "cancelled"] as const)(
    "creates an item with selected initial status %s",
    async (status) => {
      const t = convexTest(schema, modules);
      await t.mutation(api.users.ensure, { userId: userOne });

      const item = await t.mutation(api.trackedItems.add, {
        userId: userOne,
        url: `https://example.com/initial-${encodeURIComponent(status)}`,
        status,
      });

      expect(item.status).toBe(status);
      if (status === "completed") {
        expect(item.dateCompleted).toBe(item.dateUpdated);
      }
      if (status === "cancelled") {
        expect(item.dateCancelled).toBe(item.dateUpdated);
      }
    },
  );

  test("treats a change to the current status as a no-op", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.users.ensure, { userId: userOne });
    const item = await t.mutation(api.trackedItems.add, {
      userId: userOne,
      url: "https://example.com/no-op",
    });

    const unchanged = await t.mutation(api.trackedItems.updateStatus, {
      userId: userOne,
      itemId: item._id,
      status: item.status,
    });

    expect(unchanged).toEqual(item);
  });

  test("only lists items owned by the requested user", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.users.ensure, { userId: userOne });
    await t.mutation(api.users.ensure, { userId: userTwo });
    await t.mutation(api.trackedItems.add, {
      userId: userOne,
      url: "https://example.com/one",
    });
    await t.mutation(api.trackedItems.add, {
      userId: userTwo,
      url: "https://example.com/two",
    });

    const items = await t.query(api.trackedItems.list, { userId: userOne });

    expect(items).toHaveLength(1);
    expect(items[0].uniqueId).toBe("https://example.com/one");
  });

  test("does not let one user update another user's item", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.users.ensure, { userId: userOne });
    await t.mutation(api.users.ensure, { userId: userTwo });
    const item = await t.mutation(api.trackedItems.add, {
      userId: userOne,
      url: "https://example.com/private",
    });

    await expect(
      t.mutation(api.trackedItems.updateStatus, {
        userId: userTwo,
        itemId: item._id,
        status: "completed",
      }),
    ).rejects.toThrow();
  });

  test("rejects statuses outside the kernel union", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.users.ensure, { userId: userOne });
    const item = await t.mutation(api.trackedItems.add, {
      userId: userOne,
      url: "https://example.com/status",
    });

    await expect(
      t.mutation(api.trackedItems.updateStatus, {
        userId: userOne,
        itemId: item._id,
        status: "archived" as never,
      }),
    ).rejects.toThrow();
  });
});
