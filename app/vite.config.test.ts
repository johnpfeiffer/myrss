// @vitest-environment node

import { describe, expect, test } from "vitest";

import config from "./vite.config";

describe("Vite base path", () => {
  test("leaves the app at root for monorepo middleware routing", () => {
    expect(config).toMatchObject({ base: "/" });
  });
});
