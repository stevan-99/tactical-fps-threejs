// Tunables for the whole game: one place for numbers, so balance lives apart from logic.
export const TICK = 1 / 60;
export const ROUND_SECONDS = 95;
export const BUY_SECONDS = 14;
export const FREEZE_SECONDS = 3;
export const BOMB_SECONDS = 40;
export const DEFUSE_SECONDS = 6;
export const PLANT_SECONDS = 3.2;

export const ECONOMY = {
  start: 800,
  win: 3250,
  loss: 1900,
  lossStreakBonus: 500,
  plant: 300,
  defuse: 300,
  kill: 300,
  killAssist: 100,
  cap: 9000,
};

export const PLAYER = {
  radius: 0.42,
  height: 1.75,
  crouchHeight: 1.15,
  walkSpeed: 5.4,
  crouchSpeed: 2.5,
  accel: 34,
  friction: 11,
  airControl: 0.35,
  jumpSpeed: 4.6,
  gravity: 15.5,
  eyeOffset: 0.12,
  maxHealth: 100,
  armorValue: 100,
  armorAbsorb: 0.5,
};

// Weapons are data: the fire code reads these and nothing else.
export const WEAPONS = {
  pistol: {
    name: 'Kestrel P9',
    slot: 'secondary',
    price: 0,
    damage: 26,
    headMultiplier: 3.2,
    legMultiplier: 0.75,
    rpm: 340,
    mag: 13,
    reserve: 52,
    reload: 1.9,
    spreadBase: 0.006,
    spreadMove: 0.05,
    spreadAir: 0.13,
    recoil: 0.9,
    range: 70,
    auto: false,
    pellets: 1,
    sound: 'pistol',
  },
  rifle: {
    name: 'Ranger AR',
    slot: 'primary',
    price: 2700,
    damage: 34,
    headMultiplier: 3.6,
    legMultiplier: 0.72,
    rpm: 610,
    mag: 30,
    reserve: 90,
    reload: 2.4,
    spreadBase: 0.0035,
    spreadMove: 0.075,
    spreadAir: 0.2,
    recoil: 1.5,
    range: 110,
    auto: true,
    pellets: 1,
    sound: 'rifle',
  },
  smg: {
    name: 'Hornet SMG',
    slot: 'primary',
    price: 1500,
    damage: 22,
    headMultiplier: 2.6,
    legMultiplier: 0.8,
    rpm: 860,
    mag: 32,
    reserve: 96,
    reload: 2.1,
    spreadBase: 0.009,
    spreadMove: 0.045,
    spreadAir: 0.17,
    recoil: 0.85,
    range: 60,
    auto: true,
    pellets: 1,
    sound: 'smg',
  },
  shotgun: {
    name: 'Breaker 12',
    slot: 'primary',
    price: 1900,
    damage: 15,
    headMultiplier: 2.0,
    legMultiplier: 0.85,
    rpm: 90,
    mag: 6,
    reserve: 24,
    reload: 2.9,
    spreadBase: 0.05,
    spreadMove: 0.03,
    spreadAir: 0.06,
    recoil: 3.2,
    range: 32,
    auto: false,
    pellets: 8,
    sound: 'shotgun',
  },
};

export const GRENADE = {
  price: 300,
  fuse: 2.4,
  radius: 6.5,
  maxDamage: 78,
  throwSpeed: 15,
};

export const BOT = {
  radius: 0.42,
  height: 1.72,
  walkSpeed: 3.6,
  runSpeed: 4.9,
  reactionTime: 0.28,
  aimSpeed: 2.4,
  burstLength: 5,
  spread: 0.03,
  viewDistance: 48,
  fov: 1.55,
  health: 100,
};
