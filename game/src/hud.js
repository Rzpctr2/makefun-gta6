// The HUD: DOM overlay for cash, clock, wanted stars, speed, objective and
// messages. Every write is cached by its last string, so the DOM is only
// touched when something actually changes — the game loop runs at 60 fps,
// the HUD writes at most a few times a second.

const $ = (id) => document.getElementById(id);

export function createHud() {
  const els = {
    cash: $('cash'), clock: $('clock'), rep: $('rep'),
    stars: $('stars'), wantedLabel: $('wanted-label'),
    objective: $('objective'), speed: $('speed'), hint: $('hint'),
    missionPanel: $('mission-panel'), mission: $('mission'),
    weapon: $('weapon'), dispatchPanel: $('dispatch-panel'), dispatch: $('dispatch'),
    crosshair: $('crosshair'), radio: $('radio'), toast: $('toast'),
  };
  const last = new Map();
  let toastTimer = 0;

  function set(el, key, value) {
    if (last.get(key) === value) return;
    last.set(key, value);
    if (el) el.textContent = value;
  }
  function show(el, key, visible) {
    if (last.get(key) === visible) return;
    last.set(key, visible);
    if (el) el.style.display = visible ? '' : 'none';
  }

  return {
    setCash(cash) {
      set(els.cash, 'cash', `$${cash.toLocaleString('en-US')}`);
    },
    setClock(day, minutes) {
      const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
      const mm = String(minutes % 60).padStart(2, '0');
      set(els.clock, 'clock', `DAY ${day} · ${hh}:${mm}`);
    },
    setRep(rep) {
      set(els.rep, 'rep', `REP ${rep}`);
    },
    setWanted(stars) {
      const filled = '★'.repeat(stars);
      const empty = '☆'.repeat(5 - stars);
      set(els.stars, 'stars', filled + empty);
      if (els.stars) els.stars.classList.toggle('hot', stars >= 3);
      set(els.wantedLabel, 'wanted', stars > 0 ? 'WANTED' : '');
      show(els.wantedLabel, 'wanted-show', stars > 0);
    },
    setObjective(text) {
      set(els.objective, 'objective', text);
    },
    setSpeed(kmh) {
      set(els.speed, 'speed', `${Math.round(kmh)} km/h`);
    },
    setHint(text) {
      set(els.hint, 'hint', text);
    },
    setMission(info) {
      if (!info) {
        show(els.missionPanel, 'mission-show', false);
        return;
      }
      show(els.missionPanel, 'mission-show', true);
      set(els.mission, 'mission', `${info.title} — ${info.stage}${info.dist != null ? ` · ${info.dist}m` : ''}`);
    },
    setMissionNext(next) {
      // The NEXT line rides inside the mission panel text; kept as a no-op
      // hook so the layout stays one panel.
      void next;
    },
    setWeapon(label) {
      set(els.weapon, 'weapon', label);
    },
    setDispatch(text) {
      const visible = text.length > 0;
      show(els.dispatchPanel, 'dispatch-show', visible);
      set(els.dispatch, 'dispatch', text);
    },
    setRadio(text) {
      set(els.radio, 'radio', text);
    },
    setCrosshairLock(locked) {
      if (els.crosshair) els.crosshair.classList.toggle('lock', locked);
    },
    toast(message, ms = 3200) {
      if (!els.toast) return;
      els.toast.textContent = message;
      els.toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => els.toast.classList.remove('show'), ms);
    },
    // Pause dashboard: mission grid, live stats, race line, district line.
    setPause({ complete, missions, stats, race, district }) {
      set($('pause-complete'), 'pause-complete', `${complete}% COMPLETE`);
      set($('pause-missions'), 'pause-missions', missions);
      set($('pause-stats'), 'pause-stats', stats);
      set($('pause-race'), 'pause-race', race);
      set($('pause-district'), 'pause-district', district);
    },
  };
}
