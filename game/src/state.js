// One place for the game's state. The simulation owns it; the renderer only reads it.
import { MAP } from './map.js';
import { PLAYER, WEAPONS, ECONOMY } from './config.js';

export const state = {
  phase: 'buy', // buy | live | roundEnd | matchEnd
  phaseTime: 0,
  clock: 0,
  tick: 0,
  round: 1,
  scoreCT: 0,
  scoreT: 0,
  lossStreakCT: 0,
  lossStreakT: 0,
  player: null,
  bots: [],
  bodies: [],
  bomb: { state: 'carried', x: 0, y: 0, z: 0, timer: 0, planter: null, site: null, beep: 0 },
  effects: [],
  killfeed: [],
  events: [],
  message: '',
  messageTime: 0,
  targetSite: 'A',
  matchOver: false,
  stats: { shots: 0, hits: 0, kills: 0, deaths: 0, headshots: 0 },
};

export function makePlayer() {
  return {
    team: 'CT',
    x: 0,
    y: 0,
    z: -19,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: 0,
    pitch: 0,
    health: PLAYER.maxHealth,
    armor: PLAYER.armorValue,
    alive: true,
    crouch: false,
    height: PLAYER.height,
    radius: PLAYER.radius,
    onGround: true,
    money: ECONOMY.start,
    weapon: 'pistol',
    ammo: WEAPONS.pistol.mag,
    reserve: WEAPONS.pistol.reserve,
    reloading: 0,
    nextShot: 0,
    recoil: 0,
    recoilYaw: 0,
    bloom: 0,
    grenades: 0,
    hasPrimary: false,
    kills: 0,
    deaths: 0,
    defusing: 0,
    planting: 0,
    spreadNow: 0,
    lastDamageTime: -10,
  };
}

export function makeBot(team, index, x, z, yaw) {
  return {
    id: 'bot' + index,
    team,
    x,
    y: 0,
    z,
    yaw,
    pitch: 0,
    health: 100,
    armor: 50,
    alive: true,
    height: 1.72,
    radius: 0.42,
    speed: 0,
    vx: 0,
    vz: 0,
    weapon: 'rifle',
    ammo: 30,
    reserve: 90,
    reloading: 0,
    nextShot: 0,
    target: null,
    targetSeen: 0,
    lastSeenX: 0,
    lastSeenZ: 0,
    alertness: 0,
    state: 'advance',
    path: [],
    pathIndex: 0,
    goalNode: null,
    holdNode: null,
    holdUntil: 0,
    repathAt: 0,
    reactionUntil: 0,
    strafeDir: 1,
    strafeUntil: 0,
    crouch: false,
    kills: 0,
    hasBomb: false,
    planting: 0,
    defusing: 0,
    name: '',
    muzzle: 0,
    hitFlash: 0,
    deadTime: 0,
  };
}

export function resetRoundState() {
  state.effects.length = 0;
  state.bomb.state = 'carried';
  state.bomb.timer = 0;
  state.bomb.planter = null;
  state.bomb.site = null;
  state.player.defusing = 0;
  state.player.planting = 0;
}

export function ctSpawn(index) {
  const s = MAP.spawns.ct[index % MAP.spawns.ct.length];
  return s;
}

export function tSpawn(index) {
  const s = MAP.spawns.t[index % MAP.spawns.t.length];
  return s;
}

export function pushEvent(type, data) {
  state.events.push({ type, ...data });
}
