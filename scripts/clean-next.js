#!/usr/bin/env node
/**
 * Borra artefactos de build local que en Windows suelen quedar inconsistentes
 * (ENOENT en build-manifest.json, chunks 5611.js, etc.).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dirs = [".next", "node_modules/.cache", ".turbo"];

for (const rel of dirs) {
  const p = path.join(root, rel);
  try {
    fs.rmSync(p, { recursive: true, force: true });
    console.log("[clean-next] removed", rel);
  } catch (e) {
    console.warn("[clean-next]", rel, e.message);
  }
}
