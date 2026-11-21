// Keyboard + mouse look, kept as one tiny module so the game loop never
// touches DOM events directly. Keys are read by code ("KeyW"), edges are
// consumed once ("KeyE" fires a single enter-car action, not one per frame).

const CODE = {
  forward: 'KeyW',
  back: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  run: 'ShiftLeft',
  runAlt: 'ShiftRight',
  action: 'KeyE',
  shoot: 'KeyF',
  reload: 'KeyR',
  radio: 'KeyQ',
  mute: 'KeyM',
  pause: 'Escape',
  confirm: 'Enter',
  weapon1: 'Digit1',
  weapon2: 'Digit2',
  weapon3: 'Digit3',
};

export function createInput(canvas) {
  const held = new Set();
  const edges = new Set();
  let lookDx = 0;
  let lookDy = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let pointerDown = false;

  function onKeyDown(event) {
    if (event.repeat) return;
    held.add(event.code);
    edges.add(event.code);
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
  }
  function onKeyUp(event) {
    held.delete(event.code);
  }
  function onPointerDown(event) {
    dragging = true;
    pointerDown = true;
    lastX = event.clientX;
    lastY = event.clientY;
  }
  function onPointerMove(event) {
    if (!dragging) return;
    lookDx += event.clientX - lastX;
    lookDy += event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
  }
  function onPointerUp() {
    dragging = false;
    pointerDown = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  return {
    // Held-state axis in [-1, 1] for driving and walking.
    axis() {
      const x = (held.has(CODE.right) ? 1 : 0) - (held.has(CODE.left) ? 1 : 0);
      const y = (held.has(CODE.forward) ? 1 : 0) - (held.has(CODE.back) ? 1 : 0);
      return { x, y };
    },
    held(code) {
      return held.has(CODE[code] ?? code);
    },
    // True once per physical press; callers must consume it the same frame.
    pressed(code) {
      return edges.has(CODE[code] ?? code);
    },
    // Mouse-look delta since the last call, in pixels; resets to zero.
    look() {
      const out = { dx: lookDx, dy: lookDy };
      lookDx = 0;
      lookDy = 0;
      return out;
    },
    // A click (down + up without dragging far) means "shoot" when armed.
    clicked() {
      const was = pointerDown;
      pointerDown = false;
      return was;
    },
    // Called at the end of every frame so edges do not leak into the next.
    endFrame() {
      edges.clear();
    },
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    },
  };
}
