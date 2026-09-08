import { test } from "vite-plus/test";
import assert from "node:assert/strict";
import { simplifyArc } from "../scripts/simplify-map.mjs";

test("removes redundant points while preserving arc junctions and significant bends", () => {
  const points = [
    [0, 0],
    [1, 0.01],
    [2, 0],
    [3, 2],
    [4, 0],
  ];
  assert.deepEqual(simplifyArc(points, 0.2), [
    [0, 0],
    [2, 0],
    [3, 2],
    [4, 0],
  ]);
  assert.deepEqual(
    simplifyArc([...points].reverse(), 0.2),
    [...simplifyArc(points, 0.2)].reverse(),
  );
});

test("does not erase tiny islands or mutate the source geometry", () => {
  const island = [
    [0, 0],
    [0.01, 0],
    [0.01, 0.01],
    [0, 0],
  ];
  const original = structuredClone(island);
  assert.deepEqual(simplifyArc(island, 0.2), original);
  assert.deepEqual(island, original);
});

test("every removed point stays within the tolerance of its replacement segment", () => {
  const points = Array.from({ length: 1000 }, (_, x) => [x / 10, Math.sin(x / 10)]);
  const simplified = simplifyArc(points, 0.2);
  assert.ok(simplified.length < points.length / 10);
  for (let i = 1; i < simplified.length; i++) {
    const a = simplified[i - 1];
    const b = simplified[i];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    for (const [x, y] of points.slice(points.indexOf(a), points.indexOf(b) + 1)) {
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
      assert.ok(Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy) <= 0.2 + 1e-10);
    }
  }
});
