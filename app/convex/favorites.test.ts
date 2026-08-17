/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const userOne = "f47ac10b-58cc-11cf-a447-001122334455";
const userTwo = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const googleOne = {
  issuer: "https://accounts.google.com",
  subject: "google-user-one",
  tokenIdentifier: "https://accounts.google.com|google-user-one",
};
const googleTwo = {
  issuer: "https://accounts.google.com",
  subject: "google-user-two",
  tokenIdentifier: "https://accounts.google.com|google-user-two",
};

describe("favorites API", () => {
  test("requires Google authentication and registers a UUIDv1 user idempotently", async () => {
    const t = convexTest(schema, modules);
    const authenticated = t.withIdentity(googleOne);

    await expect(
      t.mutation(api.users.ensure, { proposedUserId: userOne }),
    ).rejects.toThrow(/sign in/i);
    await expect(
      authenticated.mutation(api.users.ensure, {
        proposedUserId: "f47ac10b-58cc-41cf-a447-001122334455",
      }),
    ).rejects.toThrow();

    const firstId = await authenticated.mutation(api.users.ensure, {
      proposedUserId: userOne,
    });
    const repeatedId = await authenticated.mutation(api.users.ensure, {
      proposedUserId: userTwo,
    });

    expect(firstId).toBe(userOne);
    expect(repeatedId).toBe(userOne);
  });

  test("claims an existing browser user after authenticated sign-in", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", { userId: userOne });
      await ctx.db.insert("trackedItems", {
        userId: userOne,
        uniqueId: "https://example.com/legacy",
        status: "todo",
        dateStarted: "2026-08-11T12:00:00.000Z",
        dateUpdated: "2026-08-11T12:00:00.000Z",
      });
    });
    const authenticated = t.withIdentity(googleOne);

    expect(
      await authenticated.mutation(api.users.ensure, {
        proposedUserId: userOne,
      }),
    ).toBe(userOne);
    expect(await authenticated.query(api.trackedItems.list, {})).toHaveLength(1);
    await expect(
      t.withIdentity(googleTwo).mutation(api.users.ensure, {
        proposedUserId: userOne,
      }),
    ).rejects.toThrow(/already linked/i);
  });

  test("keeps the exact submitted URL unique per authenticated user", async () => {
    const t = convexTest(schema, modules);
    const firstUser = t.withIdentity(googleOne);
    const secondUser = t.withIdentity(googleTwo);
    const submittedUrl = "https://Example.com/article/?ref=Favorites";

    await firstUser.mutation(api.users.ensure, { proposedUserId: userOne });
    await secondUser.mutation(api.users.ensure, { proposedUserId: userTwo });

    const first = await firstUser.mutation(api.trackedItems.add, {
      url: submittedUrl,
    });
    await expect(
      firstUser.mutation(api.trackedItems.add, { url: submittedUrl }),
    ).rejects.toThrow(/already/i);
    const otherUsersCopy = await secondUser.mutation(api.trackedItems.add, {
      url: submittedUrl,
    });

    expect(otherUsersCopy._id).not.toBe(first._id);
    expect(first).toMatchObject({
      userId: userOne,
      uniqueId: submittedUrl,
      status: "todo",
    });
    expect(first.dateStarted).toBe(first.dateUpdated);
    expect(new Date(first.dateStarted).toISOString()).toBe(first.dateStarted);
  });

  test.each([
    ["https://example.com/article/", "https://example.com/article"],
    ["https://example.com/article/?ref=one", "https://example.com/article?ref=one"],
  ])(
    "treats %s and %s as trailing-slash duplicates",
    async (submittedUrl, duplicateUrl) => {
      const t = convexTest(schema, modules).withIdentity(googleOne);
      await t.mutation(api.users.ensure, { proposedUserId: userOne });
      const first = await t.mutation(api.trackedItems.add, { url: submittedUrl });

      await expect(
        t.mutation(api.trackedItems.add, { url: duplicateUrl }),
      ).rejects.toThrow(/already/i);
      expect(first.uniqueId).toBe(submittedUrl);
    },
  );

  test.each(["todo", "in progress", "completed", "cancelled"] as const)(
    "creates an item with selected initial status %s",
    async (status) => {
      const t = convexTest(schema, modules).withIdentity(googleOne);
      await t.mutation(api.users.ensure, { proposedUserId: userOne });
      const item = await t.mutation(api.trackedItems.add, {
        url: `https://example.com/initial-${encodeURIComponent(status)}`,
        status,
      });

      expect(item.status).toBe(status);
      expect(new Date(item.dateUpdated).toISOString()).toBe(item.dateUpdated);
      if (status === "completed") {
        expect(item.dateCompleted).toBe(item.dateUpdated);
      }
      if (status === "cancelled") {
        expect(item.dateCancelled).toBe(item.dateUpdated);
      }
    },
  );

  test.each(["todo", "in progress", "completed", "cancelled"] as const)(
    "allows a direct transition to %s",
    async (status) => {
      const t = convexTest(schema, modules).withIdentity(googleOne);
      await t.mutation(api.users.ensure, { proposedUserId: userOne });
      const item = await t.mutation(api.trackedItems.add, {
        url: `https://example.com/transition-${encodeURIComponent(status)}`,
        status: status === "todo" ? "in progress" : "todo",
      });
      const updated = await t.mutation(api.trackedItems.updateStatus, {
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

  test("treats a change to the current status as a no-op", async () => {
    const t = convexTest(schema, modules).withIdentity(googleOne);
    await t.mutation(api.users.ensure, { proposedUserId: userOne });
    const item = await t.mutation(api.trackedItems.add, {
      url: "https://example.com/no-op",
    });

    const unchanged = await t.mutation(api.trackedItems.updateStatus, {
      itemId: item._id,
      status: item.status,
    });

    expect(unchanged).toEqual(item);
  });

  test("scopes reads and writes to the authenticated owner", async () => {
    const t = convexTest(schema, modules);
    const firstUser = t.withIdentity(googleOne);
    const secondUser = t.withIdentity(googleTwo);
    await firstUser.mutation(api.users.ensure, { proposedUserId: userOne });
    await secondUser.mutation(api.users.ensure, { proposedUserId: userTwo });
    const item = await firstUser.mutation(api.trackedItems.add, {
      url: "https://example.com/private",
    });

    expect(await firstUser.query(api.trackedItems.list, {})).toHaveLength(1);
    expect(await secondUser.query(api.trackedItems.list, {})).toHaveLength(0);
    await expect(
      secondUser.mutation(api.trackedItems.updateStatus, {
        itemId: item._id,
        status: "completed",
      }),
    ).rejects.toThrow();
    await expect(t.query(api.trackedItems.list, {})).rejects.toThrow(/sign in/i);
  });

  test("rejects statuses outside the kernel union", async () => {
    const t = convexTest(schema, modules).withIdentity(googleOne);
    await t.mutation(api.users.ensure, { proposedUserId: userOne });
    const item = await t.mutation(api.trackedItems.add, {
      url: "https://example.com/status",
    });

    await expect(
      t.mutation(api.trackedItems.updateStatus, {
        itemId: item._id,
        status: "archived" as never,
      }),
    ).rejects.toThrow();
  });
});
