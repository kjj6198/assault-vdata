/** Douglas-Peucker on a shared topology arc, in display coordinates. */
export function simplifyArc(points, tolerance) {
  if (points.length <= 2) return points;
  const keep = new Set([0, points.length - 1]);
  const pending = [[0, points.length - 1]];
  while (pending.length) {
    const [first, last] = pending.pop();
    const [ax, ay] = points[first];
    const [bx, by] = points[last];
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    let maximum = tolerance * tolerance;
    let furthest = -1;
    for (let i = first + 1; i < last; i++) {
      const [x, y] = points[i];
      const t = lengthSquared
        ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / lengthSquared))
        : 0;
      const distance = (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2;
      if (distance > maximum) {
        maximum = distance;
        furthest = i;
      }
    }
    if (furthest !== -1) {
      keep.add(furthest);
      pending.push([first, furthest], [furthest, last]);
    }
  }
  const simplified = [...keep].sort((a, b) => a - b).map((i) => points[i]);
  // Preserve tiny closed island rings even when they fit inside the tolerance.
  const [first, last] = [points[0], points.at(-1)];
  return first[0] === last[0] && first[1] === last[1] && simplified.length < 4
    ? points
    : simplified;
}
