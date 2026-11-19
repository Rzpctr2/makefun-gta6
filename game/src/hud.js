// The HUD: DOM overlay for cash, clock, wanted stars, speed, objective and
// messages. Pure DOM updates — no canvas work here, so it stays cheap.
import { NAMES } from './config.js';
import { MISSIONS, RACE } from './missions.js';

export class HUD {
  constructor(root) {
    this.el = {};
    for (const id of ['cash', 'clock', 'rep', 'stars', 'speed', 'objective', 'toast', 'hint', 'wanted-label', 'mission', 'radio', 'weapon', 'dispatch', 'crosshair']) {
      this.el[id] = root.querySelector(`#${id}`);
    }
    this.lastCash = -1;
    this.lastRep = -1;
    this.lastStars = -1;
    this.lastSpeed = -1;
    this.lastMission = '';
    this.lastRadio = '';
    this.lastObjective = '';
    this.lastWeapon = '';
    this.lastDispatch = '';
    this.lastCross = false;
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
    const day = Math.floor(seconds / 86400) + 1;
    this.el.clock.textContent = `DAY ${day} · ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  setRep(rep) {
    if (rep === this.lastRep) return;
    this.lastRep = rep;
    this.el.rep.textContent = `REP ${rep}`;
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
    if (text === this.lastObjective) return;
    this.lastObjective = text;
    this.el.objective.textContent = text;
  }

  setMission(text) {
    if (!this.el.mission || text === this.lastMission) return;
    this.lastMission = text;
    this.el.mission.textContent = text;
    this.el.mission.parentElement.style.display = text ? '' : 'none';
  }

  setRadio(text) {
    if (!this.el.radio || text === this.lastRadio) return;
    this.lastRadio = text;
    this.el.radio.textContent = text;
  }

  setWeapon(text) {
    if (!this.el.weapon || text === this.lastWeapon) return;
    this.lastWeapon = text;
    this.el.weapon.textContent = text;
  }

  setDispatch(list) {
    if (!this.el.dispatch) return;
    const text = (list || []).map((u) => `${u.name} · ${u.d}m · ${u.status}`).join('\n');
    if (text === this.lastDispatch) return;
    this.lastDispatch = text;
    this.el.dispatch.textContent = text;
    this.el.dispatch.parentElement.style.display = text ? '' : 'none';
  }

  setCrosshair(on) {
    if (!this.el.crosshair || on === this.lastCross) return;
    this.lastCross = on;
    this.el.crosshair.classList.toggle('lock', on);
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

  // Pause dashboard (1 tab): % COMPLETE + mission grid + live stats.
  // % COMPLETE = 10% per story mission (80%) + race win 10% + 5 escapes 10%.
  setPause(d) {
    const g = (id) => document.getElementById(id);
    if (!g('pause-complete')) return;
    g('pause-complete').textContent = `${d.pct}% COMPLETE`;
    g('pause-missions').innerHTML = MISSIONS.map((m, i) =>
      `${i < d.completed ? '✓' : '○'} ${i + 1}. ${m.name} — $${m.reward.toLocaleString('en-US')}`).join('<br>');
    g('pause-stats').textContent =
      `$${d.cash.toLocaleString('en-US')} · REP ${d.rep} · ${d.kills} takedowns · ${Math.min(d.escapes, 5)}/5 escapes · ${d.time} played`;
    g('pause-race').textContent = d.raceWon
      ? `🏁 ${RACE.name} — won ${d.raceWins}x · best ${d.raceBest}s · $${RACE.reward.toLocaleString('en-US')}`
      : `🏁 ${RACE.name} — not won yet · $${RACE.reward.toLocaleString('en-US')} · par ${RACE.par}s`;
    g('pause-district').textContent = `${d.district} · ${d.clock} · ${d.weapon}`;
  }
}
