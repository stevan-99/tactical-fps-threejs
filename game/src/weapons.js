// Gunplay: spread, recoil, hitscan damage and grenades. One entry point per shot, shared by the
// player and the bots, so both obey the same rules.
import { WEAPONS, GRENADE, PLAYER } from './config.js';
import { state } from './state.js';
import { raycastBoxes, raycastBodies } from './physics.js';

const hit = { t: 0, nx: 0, ny: 0, nz: 0 };
const bodyHit = { t: 0, index: -1, zone: null };

// Spread grows with movement, shrinks when crouched and standing still, and blooms per shot.
export function spreadFor(w, shooter) {
  const speed = shooter.speedNow || 0;
  const moving = Math.min(1, speed / 5.4);
  let s = w.spreadBase + w.spreadMove * moving;
  if (!shooter.onGround) s += w.spreadAir;
  if (shooter.crouch) s *= 0.62;
  s += (shooter.bloom || 0);
  return s;
}

export function muzzleOf(e) {
  const eye = e.y + e.height - (e.crouch ? 0.06 : 0.12);
  const cos = Math.cos(e.yaw);
  const sin = Math.sin(e.yaw);
  return {
    x: e.x - sin * 0.28 + cos * 0.14,
    y: eye - 0.1,
    z: e.z - cos * 0.28 - sin * 0.14,
  };
}

export function directionOf(yaw, pitch) {
  const cp = Math.cos(pitch);
  return {
    x: -Math.sin(yaw) * cp,
    y: Math.sin(pitch),
    z: -Math.cos(yaw) * cp,
  };
}

export function bodiesFor(shooter) {
  const list = state.bodies;
  list.length = 0;
  const p = state.player;
  if (p.alive && shooter.team !== p.team) list.push(p);
  for (let i = 0; i < state.bots.length; i++) {
    const b = state.bots[i];
    if (b.alive && b.team !== shooter.team) list.push(b);
  }
  return list;
}

export function fireShot(shooter, weaponKey, rng, aimYaw, aimPitch) {
  const w = WEAPONS[weaponKey];
  if (!w) return false;
  const dir = directionOf(aimYaw, aimPitch);
  const muzzle = muzzleOf(shooter);
  const spread = spreadFor(w, shooter);
  let anyHit = false;

  for (let pellet = 0; pellet < w.pellets; pellet++) {
    // A random cone around the aim direction, applied in view space.
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * spread;
    const cosY = Math.cos(aimYaw);
    const sinY = Math.sin(aimYaw);
    const rightX = cosY;
    const rightZ = -sinY;
    const upX = -Math.sin(aimYaw) * Math.sin(aimPitch);
    const upZ = -Math.cos(aimYaw) * Math.sin(aimPitch);
    const upY = Math.cos(aimPitch);
    const dx = dir.x + rightX * Math.cos(a) * r + upX * Math.sin(a) * r;
    const dy = dir.y + upY * Math.sin(a) * r;
    const dz = dir.z + rightZ * Math.cos(a) * r + upZ * Math.sin(a) * r;
    const len = Math.hypot(dx, dy, dz) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const nz = dz / len;

    const wallT = raycastBoxes(muzzle.x, muzzle.y, muzzle.z, nx, ny, nz, w.range, hit);
    const bodies = bodiesFor(shooter);
    const bodyT = raycastBodies(muzzle.x, muzzle.y, muzzle.z, nx, ny, nz, Math.min(w.range, wallT), bodies, bodyHit);

    let endX = muzzle.x + nx * Math.min(w.range, wallT);
    let endY = muzzle.y + ny * Math.min(w.range, wallT);
    let endZ = muzzle.z + nz * Math.min(w.range, wallT);

    if (bodyT < wallT && bodyHit.index >= 0) {
      const target = bodies[bodyHit.index];
      const mult = bodyHit.zone === 'head' ? w.headMultiplier : bodyHit.zone === 'legs' ? w.legMultiplier : 1;
      const falloff = Math.max(0.55, 1 - bodyT / (w.range * 1.6));
      const dmg = w.damage * mult * falloff;
      endX = muzzle.x + nx * bodyT;
      endY = muzzle.y + ny * bodyT;
      endZ = muzzle.z + nz * bodyT;
      applyDamage(target, dmg, bodyHit.zone, shooter, weaponKey);
      anyHit = true;
      state.effects.push({ type: 'blood', x: endX, y: endY, z: endZ, ttl: 0.45, life: 0.45 });
    } else if (wallT < Infinity) {
      state.effects.push({
        type: 'impact',
        x: endX,
        y: endY,
        z: endZ,
        nx: hit.nx,
        ny: hit.ny,
        nz: hit.nz,
        ttl: 0.5,
        life: 0.5,
      });
    }

    state.effects.push({
      type: 'tracer',
      x1: muzzle.x,
      y1: muzzle.y,
      z1: muzzle.z,
      x2: endX,
      y2: endY,
      z2: endZ,
      ttl: 0.06,
      life: 0.06,
    });
  }

  state.effects.push({ type: 'muzzle', x: muzzle.x, y: muzzle.y, z: muzzle.z, ttl: 0.05, life: 0.05 });
  if (shooter === state.player) state.stats.shots += 1;
  if (anyHit && shooter === state.player) state.stats.hits += 1;
  return true;
}

export function applyDamage(target, amount, zone, attacker, weaponKey) {
  if (!target.alive) return;
  let dmg = amount;
  if (target.armor > 0) {
    const absorbed = dmg * PLAYER.armorAbsorb;
    target.armor = Math.max(0, target.armor - absorbed * 0.7);
    dmg -= absorbed;
  }
  target.health -= dmg;
  target.hitFlash = 0.25;
  if (target === state.player) {
    state.player.lastDamageTime = state.clock;
    state.effects.push({ type: 'hurt', ttl: 0.35, life: 0.35 });
  }
  if (target.health <= 0) {
    killEntity(target, attacker, zone, weaponKey);
  }
}

export function killEntity(target, attacker, zone, weaponKey) {
  target.alive = false;
  target.health = 0;
  target.deadTime = state.clock;
  if (target === state.player) {
    state.player.deaths += 1;
    state.stats.deaths += 1;
  }
  if (attacker) {
    attacker.kills = (attacker.kills || 0) + 1;
    if (attacker === state.player) {
      state.stats.kills += 1;
      if (zone === 'head') state.stats.headshots += 1;
      state.player.money = Math.min(9000, state.player.money + 300);
    }
  }
  const nameOf = (e) => (e === state.player ? 'YOU' : e.name || e.id);
  state.killfeed.unshift({
    killer: attacker ? nameOf(attacker) : 'WORLD',
    victim: nameOf(target),
    weapon: weaponKey || 'bomb',
    headshot: zone === 'head',
    ttl: 6,
  });
  if (state.killfeed.length > 6) state.killfeed.length = 6;
  state.events.push({ type: 'death', victim: target.id || 'player' });
}

// Ammunition and timing. Returns true when a shot left the barrel this step.
export function tryFire(e, weaponKey, now, rng, yaw, pitch) {
  const w = WEAPONS[weaponKey];
  if (!w || e.reloading > 0 || now < e.nextShot) return false;
  if (e.ammo <= 0) {
    if (e.reserve > 0) startReload(e, weaponKey);
    return false;
  }
  e.ammo -= 1;
  e.nextShot = now + 60 / w.rpm;
  e.bloom = Math.min(0.09, (e.bloom || 0) + w.recoil * 0.0035);
  e.recoil = Math.min(0.35, (e.recoil || 0) + w.recoil * 0.006);
  fireShot(e, weaponKey, rng, yaw, pitch);
  if (e.ammo === 0 && e.reserve > 0) startReload(e, weaponKey);
  return true;
}

export function startReload(e, weaponKey) {
  const w = WEAPONS[weaponKey];
  if (!w || e.reloading > 0) return;
  if (e.ammo >= w.mag || e.reserve <= 0) return;
  e.reloading = w.reload;
  e.reloadTotal = w.reload;
  if (e === state.player) state.events.push({ type: 'reload' });
}

export function stepReload(e, weaponKey, dt) {
  if (e.reloading <= 0) return;
  e.reloading -= dt;
  if (e.reloading <= 0) {
    const w = WEAPONS[weaponKey];
    const need = w.mag - e.ammo;
    const take = Math.min(need, e.reserve);
    e.ammo += take;
    e.reserve -= take;
  }
}

// Recoil and bloom settle back every step: recoil is applied to the aim, bloom to the spread.
export function settleAim(e, dt) {
  const back = Math.min(e.recoil || 0, dt * 2.6);
  e.recoil = Math.max(0, (e.recoil || 0) - back);
  e.bloom = Math.max(0, (e.bloom || 0) - dt * 0.09);
}

// A grenade is a short-lived projectile with a fuse; it hurts anyone inside its radius.
export function throwGrenade(owner, yaw, pitch) {
  const dir = directionOf(yaw, pitch);
  state.effects.push({
    type: 'grenade',
    x: owner.x,
    y: owner.y + 1.5,
    z: owner.z,
    vx: dir.x * GRENADE.throwSpeed,
    vy: dir.y * GRENADE.throwSpeed + 2.4,
    vz: dir.z * GRENADE.throwSpeed,
    fuse: GRENADE.fuse,
    owner,
    ttl: GRENADE.fuse,
    life: GRENADE.fuse,
  });
}

export function stepGrenades(dt) {
  for (let i = state.effects.length - 1; i >= 0; i--) {
    const g = state.effects[i];
    if (g.type !== 'grenade') continue;
    g.fuse -= dt;
    g.vy -= 18 * dt;
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    g.z += g.vz * dt;
    const t = raycastBoxes(g.x, g.y, g.z, g.vx * dt, g.vy * dt, g.vz * dt, 1, hit);
    if (t < 1) {
      g.vx *= -0.35;
      g.vz *= -0.35;
      g.vy *= 0.4;
    }
    if (g.y < 0.2) {
      g.y = 0.2;
      g.vy = 0;
      g.vx *= 0.7;
      g.vz *= 0.7;
    }
    if (g.fuse <= 0) {
      explode(g.x, g.y, g.z, g.owner);
      state.effects.splice(i, 1);
    }
  }
}

export function explode(x, y, z, owner) {
  state.effects.push({ type: 'blast', x, y, z, ttl: 0.4, life: 0.4 });
  const targets = [state.player, ...state.bots];
  for (const t of targets) {
    if (!t.alive) continue;
    const d = Math.hypot(t.x - x, t.z - z, (t.y + 0.9) - y);
    if (d > GRENADE.radius) continue;
    if (!lineOfSight(x, y, z, t.x, t.y + 1, t.z)) continue;
    const falloff = 1 - d / GRENADE.radius;
    applyDamage(t, GRENADE.maxDamage * falloff * falloff, 'chest', owner, 'he');
  }
}

function lineOfSight(ax, ay, az, bx, by, bz) {
  const dx = bx - ax;
  const dy = by - ay;
  const dz = bz - az;
  const len = Math.hypot(dx, dy, dz) || 1;
  const t = raycastBoxes(ax, ay, az, dx / len, dy / len, dz / len, len, hit);
  return t >= len - 0.1;
}
