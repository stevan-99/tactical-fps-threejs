// Collision and ray queries over the map's axis-aligned boxes. Everything here is allocation free
// in the hot path: results are written into caller-provided objects.
import { MAP } from './map.js';

export const solids = MAP.boxes
  .filter((b) => b.solid)
  .map((b) => ({
    minX: b.x - b.w / 2,
    maxX: b.x + b.w / 2,
    minY: b.y - b.h / 2,
    maxY: b.y + b.h / 2,
    minZ: b.z - b.d / 2,
    maxZ: b.z + b.d / 2,
    top: b.y + b.h / 2,
  }));

const STEP_UP = 0.45;

// Ground height under a point, so decks and crates can be walked on.
export function groundAt(x, z, feetY) {
  let best = 0;
  for (let i = 0; i < solids.length; i++) {
    const s = solids[i];
    if (x < s.minX - 0.02 || x > s.maxX + 0.02 || z < s.minZ - 0.02 || z > s.maxZ + 0.02) continue;
    if (s.top <= feetY + STEP_UP && s.top > best) best = s.top;
  }
  return best;
}

// Push a vertical cylinder out of any solid it overlaps, one axis at a time. Returns true when a
// wall blocked the move on that axis, which is what stops a player walking through a crate.
export function resolveCylinder(pos, radius, height) {
  let blockedX = false;
  let blockedZ = false;
  for (let i = 0; i < solids.length; i++) {
    const s = solids[i];
    if (pos.y >= s.top - 0.02) continue;
    if (pos.y + height <= s.minY) continue;
    const cx = Math.max(s.minX, Math.min(pos.x, s.maxX));
    const cz = Math.max(s.minZ, Math.min(pos.z, s.maxZ));
    let dx = pos.x - cx;
    let dz = pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= radius * radius) continue;
    if (d2 > 1e-6) {
      const d = Math.sqrt(d2);
      const push = radius - d;
      pos.x += (dx / d) * push;
      pos.z += (dz / d) * push;
    } else {
      // Centre inside the box: shove out along the shallowest side.
      const left = pos.x - s.minX;
      const right = s.maxX - pos.x;
      const back = pos.z - s.minZ;
      const front = s.maxZ - pos.z;
      const m = Math.min(left, right, back, front);
      if (m === left) pos.x = s.minX - radius;
      else if (m === right) pos.x = s.maxX + radius;
      else if (m === back) pos.z = s.minZ - radius;
      else pos.z = s.maxZ + radius;
    }
    blockedX = true;
    blockedZ = true;
  }
  return { blockedX, blockedZ };
}

// Slab test against the solid boxes. out = {t, nx, ny, nz}; returns out.t or Infinity.
export function raycastBoxes(ox, oy, oz, dx, dy, dz, maxDist, out) {
  let best = maxDist;
  let hit = false;
  for (let i = 0; i < solids.length; i++) {
    const s = solids[i];
    let tmin = 0;
    let tmax = best;
    let axis = -1;
    let sign = 1;
    // X
    if (Math.abs(dx) < 1e-8) {
      if (ox < s.minX || ox > s.maxX) continue;
    } else {
      const inv = 1 / dx;
      let t1 = (s.minX - ox) * inv;
      let t2 = (s.maxX - ox) * inv;
      let sg = -1;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; sg = 1; }
      if (t1 > tmin) { tmin = t1; axis = 0; sign = sg; }
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) continue;
    }
    // Y
    if (Math.abs(dy) < 1e-8) {
      if (oy < s.minY || oy > s.maxY) continue;
    } else {
      const inv = 1 / dy;
      let t1 = (s.minY - oy) * inv;
      let t2 = (s.maxY - oy) * inv;
      let sg = -1;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; sg = 1; }
      if (t1 > tmin) { tmin = t1; axis = 1; sign = sg; }
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) continue;
    }
    // Z
    if (Math.abs(dz) < 1e-8) {
      if (oz < s.minZ || oz > s.maxZ) continue;
    } else {
      const inv = 1 / dz;
      let t1 = (s.minZ - oz) * inv;
      let t2 = (s.maxZ - oz) * inv;
      let sg = -1;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; sg = 1; }
      if (t1 > tmin) { tmin = t1; axis = 2; sign = sg; }
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) continue;
    }
    if (tmin < best && tmin >= 0) {
      best = tmin;
      hit = true;
      out.nx = axis === 0 ? sign : 0;
      out.ny = axis === 1 ? sign : 0;
      out.nz = axis === 2 ? sign : 0;
    }
  }
  out.t = hit ? best : Infinity;
  return out.t;
}

// Ray against a vertical capsule-ish box body: head, chest, legs. Returns {t, zone, index}.
export function raycastBodies(ox, oy, oz, dx, dy, dz, maxDist, bodies, out) {
  let best = maxDist;
  out.index = -1;
  out.zone = null;
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (!b.alive) continue;
    const h = b.height;
    const r = b.radius;
    const headY = b.y + h - 0.18;
    // Head sphere
    let t = raySphere(ox, oy, oz, dx, dy, dz, b.x, headY, b.z, 0.24, best);
    if (t < best) { best = t; out.index = i; out.zone = 'head'; }
    // Body cylinder approximated as a box from feet to shoulders
    t = rayBox(ox, oy, oz, dx, dy, dz, b.x - r, b.y + h * 0.5, b.z - r, b.x + r, b.y + h - 0.3, b.z + r, best);
    if (t < best) { best = t; out.index = i; out.zone = 'chest'; }
    t = rayBox(ox, oy, oz, dx, dy, dz, b.x - r * 0.9, b.y + 0.05, b.z - r * 0.9, b.x + r * 0.9, b.y + h * 0.5, b.z + r * 0.9, best);
    if (t < best) { best = t; out.index = i; out.zone = 'legs'; }
  }
  out.t = out.index >= 0 ? best : Infinity;
  return out.t;
}

export function raySphere(ox, oy, oz, dx, dy, dz, cx, cy, cz, radius, maxDist) {
  const lx = ox - cx;
  const ly = oy - cy;
  const lz = oz - cz;
  const b = lx * dx + ly * dy + lz * dz;
  const c = lx * lx + ly * ly + lz * lz - radius * radius;
  const disc = b * b - c;
  if (disc < 0) return Infinity;
  const t = -b - Math.sqrt(disc);
  return t >= 0 && t < maxDist ? t : Infinity;
}

export function rayBox(ox, oy, oz, dx, dy, dz, minX, minY, minZ, maxX, maxY, maxZ, maxDist) {
  let tmin = 0;
  let tmax = maxDist;
  const axes = [[ox, dx, minX, maxX], [oy, dy, minY, maxY], [oz, dz, minZ, maxZ]];
  for (let i = 0; i < 3; i++) {
    const [o, d, lo, hi] = axes[i];
    if (Math.abs(d) < 1e-8) {
      if (o < lo || o > hi) return Infinity;
      continue;
    }
    const inv = 1 / d;
    let t1 = (lo - o) * inv;
    let t2 = (hi - o) * inv;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    if (t1 > tmin) tmin = t1;
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return Infinity;
  }
  return tmin >= 0 ? tmin : Infinity;
}

// Line of sight between two points, used by the bots' eyes and ears.
const tmpHit = { t: 0, nx: 0, ny: 0, nz: 0 };
export function visible(ax, ay, az, bx, by, bz) {
  const dx = bx - ax;
  const dy = by - ay;
  const dz = bz - az;
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-4) return true;
  const t = raycastBoxes(ax, ay, az, dx / len, dy / len, dz / len, len, tmpHit);
  return t >= len - 0.05;
}
