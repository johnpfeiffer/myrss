import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const distDirectory = resolve(process.cwd(), "dist");
const assetsDirectory = resolve(distDirectory, "assets");
const indexHtml = readFileSync(resolve(distDirectory, "index.html"), "utf8");
const rootAssetReferences = [
  ...indexHtml.matchAll(/(?:src|href)="(\/assets\/[^"?]+)["?]/g),
].map((match) => match[1]);
const javascriptFiles = readdirSync(assetsDirectory).filter((file) =>
  file.endsWith(".js"),
);

if (rootAssetReferences.length === 0) {
  throw new Error(
    "Expected root-relative assets for monorepo middleware rewriting.",
  );
}

if (javascriptFiles.length !== 1) {
  throw new Error(
    `The HTML-only monorepo middleware cannot prefix lazy JavaScript chunks; found ${javascriptFiles.join(", ")}.`,
  );
}

console.log("Verified middleware-compatible production assets.");
