// Player movement: accelerated ground movement, crouch, jump, and collision against the map.
// Called once per fixed step with the input snapshot, so the renderer stays free of game rules.
import { PLAYER } from './config.js';
import { groundAt, resolveCylinder } from './physics.js';

const pos = { x: 0, y: 0, z: 0 };

export function stepPlayer(p, cmd, dt) {
  if (!p.alive) return;

  p.height = p.crouch ? PLAYER.crouchHeight : PLAYER.height;

  // Desired horizontal velocity in world space from the view yaw.
  const sin = Math.sin(p.yaw);
  const cos = Math.cos(p.yaw);
  let wishX = 0;
  let wishZ = 0;
  if (cmd.forward) { wishX -= sin; wishZ -= cos; }
  if (cmd.back) { wishX += sin; wishZ += cos; }
  if (cmd.left) { wishX -= cos; wishZ += sin; }
  if (cmd.right) { wishX += cos; wishZ -= sin; }
  const wishLen = Math.hypot(wishX, wishZ);
  if (wishLen > 1e-4) {
    wishX /= wishLen;
    wishZ /= wishLen;
  }

  const maxSpeed = p.crouch ? PLAYER.crouchSpeed : cmd.walk ? PLAYER.walkSpeed * 0.52 : PLAYER.walkSpeed;

  if (p.onGround) {
    // Friction first, then acceleration toward the wish direction: this is what gives the
    // counter-strafe feel, where stopping to aim settles the crosshair quickly.
    const speed = Math.hypot(p.vx, p.vz);
    if (speed > 0) {
      const drop = Math.max(speed, 2.5) * PLAYER.friction * dt;
      const scale = Math.max(0, speed - drop) / speed;
      p.vx *= scale;
      p.vz *= scale;
    }
    const accel = PLAYER.accel * dt;
    p.vx += wishX * accel * maxSpeed * 0.35;
    p.vz += wishZ * accel * maxSpeed * 0.35;
    const newSpeed = Math.hypot(p.vx, p.vz);
    if (newSpeed > maxSpeed) {
      p.vx = (p.vx / newSpeed) * maxSpeed;
      p.vz = (p.vz / newSpeed) * maxSpeed;
    }
    if (cmd.jump) {
      p.vy = PLAYER.jumpSpeed;
      p.onGround = false;
    }
  } else {
    const accel = PLAYER.accel * PLAYER.airControl * dt;
    p.vx += wishX * accel;
    p.vz += wishZ * accel;
    const newSpeed = Math.hypot(p.vx, p.vz);
    const airMax = Math.max(maxSpeed, 6.2);
    if (newSpeed > airMax) {
      p.vx = (p.vx / newSpeed) * airMax;
      p.vz = (p.vz / newSpeed) * airMax;
    }
  }

  p.vy -= PLAYER.gravity * dt;

  pos.x = p.x + p.vx * dt;
  pos.y = p.y;
  pos.z = p.z + p.vz * dt;

  const res = resolveCylinder(pos, p.radius, p.height);
  if (res.blockedX) p.vx *= 0.2;
  if (res.blockedZ) p.vz *= 0.2;

  pos.y += p.vy * dt;
  const ground = groundAt(pos.x, pos.z, p.y);
  if (pos.y <= ground + 0.001) {
    pos.y = ground;
    p.vy = 0;
    p.onGround = true;
  } else {
    p.onGround = false;
  }

  // Ceiling: the player cannot pass the top of a box they are under.
  if (pos.y < -4) pos.y = 0;

  p.x = pos.x;
  p.y = pos.y;
  p.z = pos.z;

  // Head bob feeds the view model, not the aim.
  p.bobPhase = (p.bobPhase || 0) + Math.hypot(p.vx, p.vz) * dt * 1.9;
  p.speedNow = Math.hypot(p.vx, p.vz);
}

export function applyLook(p, dx, dy, sensitivity = 0.0022) {
  p.yaw -= dx * sensitivity;
  p.pitch -= dy * sensitivity;
  const limit = Math.PI / 2 - 0.02;
  if (p.pitch > limit) p.pitch = limit;
  if (p.pitch < -limit) p.pitch = -limit;
}

export function eyeHeight(p) {
  return p.y + (p.crouch ? PLAYER.crouchHeight : PLAYER.height) - PLAYER.eyeOffset;
}
