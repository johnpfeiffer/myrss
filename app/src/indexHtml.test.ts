/// <reference types="node" />

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

describe("index.html", () => {
  test("sends the referrer policy required by Google Sign-In on HTTP localhost", () => {
    const html = readFileSync(
      resolve(process.cwd(), "index.html"),
      "utf8",
    );

    expect(html).toContain(
      '<meta name="referrer" content="no-referrer-when-downgrade" />',
    );
  });
});
