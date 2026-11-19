// Keyboard + mouse input. Held keys are read every frame; one-shot presses
// (enter car, pause, confirm) are queued as flags and taken once by the loop,
// so a press between two frames is never lost or counted twice.
export const ACTION_ENTER = 1; // E: enter / exit a car
export const ACTION_PAUSE = 2; // Esc / P: pause
export const ACTION_CONFIRM = 4; // Enter / Space: start, resume
export const ACTION_RADIO = 8; // Q: next radio station
export const ACTION_MUTE = 16; // M: mute audio

const FORWARD = new Set(['KeyW', 'ArrowUp']);
const BACK = new Set(['KeyS', 'ArrowDown']);
const LEFT = new Set(['KeyA', 'ArrowLeft']);
const RIGHT = new Set(['KeyD', 'ArrowRight']);
const RUN = new Set(['ShiftLeft', 'ShiftRight']);

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  // Mouse drag orbits the camera.
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let dragDX = 0;
  let dragDY = 0;

  window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyE' && !event.repeat) actions |= ACTION_ENTER;
    else if ((event.code === 'Escape' || event.code === 'KeyP') && !event.repeat) actions |= ACTION_PAUSE;
    else if ((event.code === 'Enter' || event.code === 'Space') && !event.repeat) actions |= ACTION_CONFIRM;
    else if (event.code === 'KeyQ' && !event.repeat) actions |= ACTION_RADIO;
    else if (event.code === 'KeyM' && !event.repeat) actions |= ACTION_MUTE;
    keys.add(event.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    dragDX += event.clientX - lastX;
    dragDY += event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
  });
  const endDrag = () => { dragging = false; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  return {
    // Camera-relative move vector for on-foot play: x = strafe, z = forward.
    moveVector() {
      let x = 0;
      let z = 0;
      if ([...FORWARD].some((k) => keys.has(k))) z += 1;
      if ([...BACK].some((k) => keys.has(k))) z -= 1;
      if ([...LEFT].some((k) => keys.has(k))) x -= 1;
      if ([...RIGHT].some((k) => keys.has(k))) x += 1;
      return { x, z, run: [...RUN].some((k) => keys.has(k)) };
    },
    // Driving: throttle -1..1, steer -1..1.
    driveVector() {
      let throttle = 0;
      if ([...FORWARD].some((k) => keys.has(k))) throttle += 1;
      if ([...BACK].some((k) => keys.has(k))) throttle -= 1;
      let steer = 0;
      if ([...LEFT].some((k) => keys.has(k))) steer -= 1;
      if ([...RIGHT].some((k) => keys.has(k))) steer += 1;
      return { throttle, steer };
    },
    // Mouse drag since the last call, in pixels.
    takeDrag() {
      const d = { dx: dragDX, dy: dragDY };
      dragDX = 0;
      dragDY = 0;
      return d;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    get anyKey() {
      return keys.size > 0;
    },
  };
}
