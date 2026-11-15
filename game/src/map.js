// The map: an original industrial yard called "Foundry". Geometry is axis-aligned boxes, which
// keeps collision cheap and exact; the same boxes build the mesh and the collider list.
// Two bomb sites, three lanes, and a waypoint graph the bots path along.

export const MAP = {
  name: 'Foundry',
  half: 23,
  boxes: [],
  sites: [
    { id: 'A', name: 'Loading Dock', x: 15, z: 2, radius: 4.2 },
    { id: 'B', name: 'Pipe Hall', x: -15, z: 2, radius: 4.2 },
  ],
  spawns: {
    ct: [
      { x: -3, z: -19, yaw: 0 },
      { x: 0, z: -19, yaw: 0 },
      { x: 3, z: -19, yaw: 0 },
      { x: -6, z: -18, yaw: 0 },
    ],
    t: [
      { x: -3, z: 19, yaw: Math.PI },
      { x: 0, z: 19, yaw: Math.PI },
      { x: 3, z: 19, yaw: Math.PI },
      { x: 6, z: 19, yaw: Math.PI },
      { x: -6, z: 19, yaw: Math.PI },
    ],
  },
  nodes: [],
  edges: [],
};

function box(x, y, z, w, h, d, mat = 'wall', solid = true) {
  MAP.boxes.push({ x, y, z, w, h, d, mat, solid });
}

// --- perimeter -------------------------------------------------------------------------------
box(0, 2, -23, 48, 4, 1, 'wall');
box(0, 2, 23, 48, 4, 1, 'wall');
box(-23, 2, 0, 1, 4, 46, 'wall');
box(23, 2, 0, 1, 4, 46, 'wall');

// --- spawn rooms -----------------------------------------------------------------------------
// CT spawn (south): a walled pocket with one mouth into the map.
box(-8, 1.6, -16, 1, 3.2, 12, 'wall');
box(8, 1.6, -16, 1, 3.2, 12, 'wall');
box(-4.5, 1.6, -12, 8, 3.2, 1, 'wall');
box(4.5, 1.6, -12, 8, 3.2, 1, 'wall');

// T spawn (north): open plaza with cover crates.
box(-7, 1.6, 16, 1, 3.2, 12, 'wall');
box(7, 1.6, 16, 1, 3.2, 12, 'wall');
box(-4, 1.6, 12, 6, 3.2, 1, 'wall');
box(4, 1.6, 12, 6, 3.2, 1, 'wall');
box(-5.5, 0.7, 17.5, 2, 1.4, 2, 'crate');
box(5.5, 0.7, 17.5, 2, 1.4, 2, 'crate');

// --- mid: a sunken yard with a machine block that splits the sightline -------------------------
box(0, 1.5, 0, 7, 3, 7, 'metal');
box(0, 3.4, 0, 4.4, 0.8, 4.4, 'accent');
box(-6.5, 0.6, 4.5, 2.4, 1.2, 2.4, 'crate');
box(6.5, 0.6, 4.5, 2.4, 1.2, 2.4, 'crate');
box(-6.5, 0.6, -4.5, 2.4, 1.2, 2.4, 'crate');
box(6.5, 0.6, -4.5, 2.4, 1.2, 2.4, 'crate');

// --- lane dividers: the walls that make east, west and mid read as three routes ----------------
box(11, 1.7, 12, 1, 3.4, 10, 'wall');
box(-11, 1.7, 12, 1, 3.4, 10, 'wall');
box(11, 1.7, -12, 1, 3.4, 10, 'wall');
box(-11, 1.7, -12, 1, 3.4, 10, 'wall');

// --- site A: loading dock (east) --------------------------------------------------------------
box(19.5, 1.6, 8, 1, 3.2, 6, 'wall');
box(15, 0.35, 8, 8, 0.7, 5, 'deck');          // raised dock floor
box(19, 1.1, 4.5, 1.6, 2.2, 1.6, 'crate');
box(17.2, 0.6, 0.5, 1.8, 1.2, 1.8, 'crate');
box(13.5, 0.6, 5.2, 1.8, 1.2, 1.8, 'crate');
box(15.5, 1.0, -3.5, 2.6, 2, 1.2, 'metal');
box(12.2, 1.5, 9.5, 1, 3, 1, 'pillar');

// --- site B: pipe hall (west) -----------------------------------------------------------------
box(-19.5, 1.6, 8, 1, 3.2, 6, 'wall');
box(-15, 0.35, 8, 8, 0.7, 5, 'deck');
box(-19, 1.1, 4.5, 1.6, 2.2, 1.6, 'crate');
box(-17.2, 0.6, 0.5, 1.8, 1.2, 1.8, 'crate');
box(-13.5, 0.6, 5.2, 1.8, 1.2, 1.8, 'crate');
box(-15.5, 1.0, -3.5, 2.6, 2, 1.2, 'metal');
box(-12.2, 1.5, 9.5, 1, 3, 1, 'pillar');

// --- long pipes overhead: cover that reads as a ceiling without blocking movement --------------
box(15, 3.1, 2, 12, 0.4, 0.4, 'accent', false);
box(-15, 3.1, 2, 12, 0.4, 0.4, 'accent', false);
box(0, 3.6, 9, 14, 0.35, 0.35, 'accent', false);

// --- CT-side connectors into both sites --------------------------------------------------------
box(9, 1.6, -8, 6, 3.2, 1, 'wall');
box(-9, 1.6, -8, 6, 3.2, 1, 'wall');
box(6, 0.55, -6, 1.6, 1.1, 1.6, 'crate');
box(-6, 0.55, -6, 1.6, 1.1, 1.6, 'crate');

// --- waypoints: the routes the bots walk, hand-placed along the lanes -------------------------
const node = (id, x, z) => MAP.nodes.push({ id, x, z });
node('t_spawn', 0, 19);
node('t_east', 6.5, 15);
node('t_west', -6.5, 15);
node('t_mid', 0, 14);
node('mid_n', 0, 8);
node('mid_ne', 5, 5.5);
node('mid_nw', -5, 5.5);
node('mid_e', 7.5, 0);
node('mid_w', -7.5, 0);
node('mid_se', 5, -5.5);
node('mid_sw', -5, -5.5);
node('mid_s', 0, -8);
node('a_approach', 9.5, 6);
node('a_lane', 12, 4);
node('a_site', 15, 1.5);
node('a_deep', 18.5, 6);
node('a_ct', 12, -7);
node('b_approach', -9.5, 6);
node('b_lane', -12, 4);
node('b_site', -15, 1.5);
node('b_deep', -18.5, 6);
node('b_ct', -12, -7);
node('ct_spawn', 0, -18);
node('ct_east', 6, -13);
node('ct_west', -6, -13);
node('ct_mid', 0, -12);

const link = (a, b) => {
  MAP.edges.push([a, b]);
  MAP.edges.push([b, a]);
};
link('t_spawn', 't_east');
link('t_spawn', 't_west');
link('t_spawn', 't_mid');
link('t_mid', 'mid_n');
link('mid_n', 'mid_ne');
link('mid_n', 'mid_nw');
link('mid_ne', 'mid_e');
link('mid_nw', 'mid_w');
link('mid_e', 'mid_se');
link('mid_w', 'mid_sw');
link('mid_se', 'mid_s');
link('mid_sw', 'mid_s');
link('t_east', 'a_approach');
link('a_approach', 'a_lane');
link('a_lane', 'a_site');
link('a_site', 'a_deep');
link('a_site', 'mid_e');
link('t_west', 'b_approach');
link('b_approach', 'b_lane');
link('b_lane', 'b_site');
link('b_site', 'b_deep');
link('b_site', 'mid_w');
link('ct_spawn', 'ct_east');
link('ct_spawn', 'ct_west');
link('ct_spawn', 'ct_mid');
link('ct_east', 'a_ct');
link('ct_west', 'b_ct');
link('a_ct', 'a_site');
link('b_ct', 'b_site');
link('ct_mid', 'mid_s');
link('ct_east', 'mid_se');
link('ct_west', 'mid_sw');

export function nodeById(id) {
  return MAP.nodes.find((n) => n.id === id) || null;
}

// Route the attackers take to each site, and where defenders hold.
export const ROUTES = {
  A: [
    ['t_spawn', 't_east', 'a_approach', 'a_lane', 'a_site'],
    ['t_spawn', 't_mid', 'mid_n', 'mid_ne', 'mid_e', 'a_site'],
    ['t_spawn', 't_mid', 'mid_n', 'mid_ne', 'a_approach', 'a_site'],
  ],
  B: [
    ['t_spawn', 't_west', 'b_approach', 'b_lane', 'b_site'],
    ['t_spawn', 't_mid', 'mid_n', 'mid_nw', 'mid_w', 'b_site'],
    ['t_spawn', 't_mid', 'mid_n', 'mid_nw', 'b_approach', 'b_site'],
  ],
};

export const HOLDS = {
  A: ['a_deep', 'a_ct', 'a_lane', 'mid_e'],
  B: ['b_deep', 'b_ct', 'b_lane', 'mid_w'],
};

export function siteById(id) {
  return MAP.sites.find((s) => s.id === id) || null;
}
