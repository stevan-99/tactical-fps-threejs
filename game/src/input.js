// Keyboard, mouse and pointer lock. Raw input only: the simulation reads this, never the DOM.
export const input = {
  keys: Object.create(null),
  dx: 0,
  dy: 0,
  wheel: 0,
  fire: false,
  altFire: false,
  locked: false,
  pressed: Object.create(null),
};

const BINDINGS = {
  KeyW: 'forward',
  KeyS: 'back',
  KeyA: 'left',
  KeyD: 'right',
  Space: 'jump',
  ShiftLeft: 'walk',
  ControlLeft: 'crouch',
  KeyC: 'crouch',
  KeyR: 'reload',
  KeyE: 'use',
  KeyB: 'buy',
  KeyQ: 'grenade',
  Digit1: 'slot1',
  Digit2: 'slot2',
  Digit3: 'slot3',
  Tab: 'scores',
};

export function bindInput(canvas, handlers = {}) {
  window.addEventListener('keydown', (e) => {
    const action = BINDINGS[e.code];
    if (!action) return;
    if (e.code === 'Tab' || e.code === 'Space') e.preventDefault();
    if (!input.keys[action]) input.pressed[action] = true;
    input.keys[action] = true;
    if (action === 'buy' && handlers.onBuy) handlers.onBuy();
    if (action === 'reload' && handlers.onReload) handlers.onReload();
  });
  window.addEventListener('keyup', (e) => {
    const action = BINDINGS[e.code];
    if (!action) return;
    input.keys[action] = false;
  });
  window.addEventListener('blur', () => {
    input.keys = Object.create(null);
    input.fire = false;
  });

  canvas.addEventListener('mousedown', (e) => {
    if (!input.locked) {
      canvas.requestPointerLock();
      return;
    }
    if (e.button === 0) input.fire = true;
    if (e.button === 2) input.altFire = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) input.fire = false;
    if (e.button === 2) input.altFire = false;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('pointerlockchange', () => {
    input.locked = document.pointerLockElement === canvas;
    if (handlers.onLockChange) handlers.onLockChange(input.locked);
  });
  document.addEventListener('mousemove', (e) => {
    if (!input.locked) return;
    input.dx += e.movementX;
    input.dy += e.movementY;
  });
  window.addEventListener('wheel', (e) => {
    input.wheel += Math.sign(e.deltaY);
  }, { passive: true });
}

export function consumeMouse() {
  const d = { dx: input.dx, dy: input.dy };
  input.dx = 0;
  input.dy = 0;
  return d;
}

export function consumePressed(action) {
  if (input.pressed[action]) {
    input.pressed[action] = false;
    return true;
  }
  return false;
}

export function clearPressed() {
  input.pressed = Object.create(null);
}
