// The HUD: DOM overlay for cash, clock, wanted stars, speed, objective and
// messages. Pure DOM updates — no canvas work here, so it stays cheap.
import { NAMES } from './config.js';

export class HUD {
  constructor(root) {
    this.el = {};
    for (const id of ['cash', 'clock', 'stars', 'speed', 'objective', 'toast', 'hint', 'wanted-label']) {
      this.el[id] = root.querySelector(`#${id}`);
    }
    this.lastCash = -1;
    this.lastStars = -1;
    this.lastSpeed = -1;
    this.toastTimer = 0;
  }

  setCash(cash) {
    if (cash === this.lastCash) return;
    this.lastCash = cash;
    this.el.cash.textContent = `${NAMES.currency}${cash.toLocaleString('en-US')}`;
  }

  setClock(seconds) {
    const h = Math.floor(seconds / 3600) % 24;
    const m = Math.floor(seconds / 60) % 60;
    this.el.clock.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // wanted: 0..5. Stars fill left to right; the label appears at 1+.
  setWanted(wanted) {
    if (wanted === this.lastStars) return;
    this.lastStars = wanted;
    let stars = '';
    for (let i = 0; i < 5; i++) stars += i < wanted ? '★' : '☆';
    this.el.stars.textContent = stars;
    this.el.stars.classList.toggle('hot', wanted >= 3);
    this.el['wanted-label'].textContent = wanted > 0 ? 'WANTED' : '';
  }

  setSpeed(kmh) {
    const v = Math.round(kmh);
    if (v === this.lastSpeed) return;
    this.lastSpeed = v;
    this.el.speed.textContent = `${v} km/h`;
  }

  // The speed readout only makes sense in a car; hide it on foot.
  showSpeed(on) {
    this.el.speed.style.display = on ? '' : 'none';
  }

  setObjective(text) {
    this.el.objective.textContent = text;
  }

  showToast(text, seconds = 3) {
    this.el.toast.textContent = text;
    this.el.toast.classList.add('show');
    this.toastTimer = seconds;
  }

  update(dt) {
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.el.toast.classList.remove('show');
    }
  }

  setHint(text) {
    this.el.hint.textContent = text;
  }
}
