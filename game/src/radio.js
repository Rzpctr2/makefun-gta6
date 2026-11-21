// Radio + procedural SFX. Three stations from one look-ahead scheduler and
// one shared noise buffer; every sound is synthesized, no audio files. The
// AudioContext is created only from a user gesture, and every play call is
// a no-op until it exists — headless `?shot=` runs must never error.

import * as THREE from 'three';

export const STATIONS = [
  { name: 'CORAL FM 96.4', genre: 'synthwave', bpm: 112, wave: 'sawtooth', root: 55, scale: [0, 3, 5, 7, 10], color: '#ff5a8a' },
  { name: 'SOL 101.9', genre: 'latin', bpm: 96, wave: 'triangle', root: 65.41, scale: [0, 2, 4, 7, 9], color: '#f2c94c' },
  { name: 'TALK 88.1', genre: 'night talk', bpm: 80, wave: 'sine', root: 49, scale: [0, 5, 7], color: '#5e8a7b' },
];

const SONG_TITLES = [
  ['Neon Coastline', 'Palm Static', 'Golden Hour Drive', 'Midnight Toll'],
  ['Calle Sol', 'Marisol Nights', 'Bajo el Faro', 'Ritmo del Puerto'],
  ['The Night Desk', 'Voices After Dark', 'Static & Signal', 'The Long Shift'],
];

export function createRadio() {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let sfxGain = null;
  let noiseBuf = null;
  let station = 0;
  let muted = false;
  let bar = 0;
  let nextNoteTime = 0;
  let step = 0;
  let engineOsc = null;
  let engineGain = null;
  let sirenOsc = null;
  let sirenGain = null;
  let sirenLfo = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createDynamicsCompressor();
      master.threshold.value = -12;
      master.ratio.value = 12;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.45;
      musicGain.connect(master);
      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.9;
      sfxGain.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      let seed = 99;
      for (let i = 0; i < data.length; i++) {
        seed = (seed * 16807) % 2147483647;
        data[i] = seed / 1073741824 - 1;
      }
      nextNoteTime = ctx.currentTime + 0.1;
    } catch {
      ctx = null;
      return false;
    }
    return true;
  }

  function tone(freq, dur, type = 'sine', gain = 0.2, when = 0, slideTo = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(dur, gain = 0.2, filterFreq = 1200, when = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(sfxGain);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  function scheduleBar() {
    if (!ctx) return;
    const st = STATIONS[station];
    const beat = 60 / st.bpm;
    const chordRoots = [1, 0.891, 1.122, 0.75];
    const root = st.root * chordRoots[bar % 4];
    // Bass on the beat, arp dancing above it — one scheduler, three moods.
    for (let b = 0; b < 4; b++) {
      const t = nextNoteTime + b * beat;
      const delay = t - ctx.currentTime;
      if (delay < 0) continue;
      tone(root, beat * 0.9, st.wave, 0.16, delay);
      const arpNotes = [0, 2, 1, 3];
      const degree = st.scale[arpNotes[(step + b) % 4] % st.scale.length];
      tone(root * 2 * Math.pow(2, degree / 12), beat * 0.4, st.wave, 0.07, delay + beat / 2);
    }
    nextNoteTime += beat * 4;
    step += 4;
    bar++;
  }

  const SFX = {
    click: () => tone(880, 0.05, 'square', 0.08),
    static: () => noise(0.3, 0.25, 3000),
    mission: () => { tone(523, 0.16, 'triangle', 0.2); tone(659, 0.16, 'triangle', 0.2, 0.12); tone(784, 0.3, 'triangle', 0.22, 0.24); },
    wantedUp: () => { tone(220, 0.2, 'sawtooth', 0.2); tone(174, 0.3, 'sawtooth', 0.22, 0.15); },
    wantedDown: () => { tone(330, 0.15, 'sine', 0.15); tone(440, 0.25, 'sine', 0.15, 0.12); },
    busted: () => { tone(196, 0.4, 'sawtooth', 0.22); tone(147, 0.6, 'sawtooth', 0.22, 0.3); },
    unlock: () => { tone(660, 0.1, 'triangle', 0.18); tone(990, 0.2, 'triangle', 0.18, 0.09); },
    pistol: () => { noise(0.09, 0.5, 2500); tone(180, 0.07, 'square', 0.25, 0, 60); },
    smg: () => { noise(0.06, 0.4, 3200); tone(220, 0.05, 'square', 0.2, 0, 70); },
    thud: () => { noise(0.18, 0.4, 300); tone(70, 0.15, 'sine', 0.3, 0, 40); },
    horn: () => tone(370, 0.25, 'square', 0.12),
    door: () => { noise(0.08, 0.2, 800); tone(140, 0.1, 'sine', 0.15, 0.02, 90); },
    step: () => noise(0.05, 0.07, 500),
    wave: () => noise(1.2, 0.06, 400),
    explosion: () => { noise(0.7, 0.7, 500); tone(60, 0.5, 'sine', 0.4, 0, 30); },
  };

  return {
    ensure,
    next() {
      station = (station + 1) % STATIONS.length;
      bar = 0;
      step = 0;
      this.sfx('static');
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 1;
      return muted;
    },
    get muted() {
      return muted;
    },
    station() {
      return STATIONS[station];
    },
    nowPlaying() {
      const st = STATIONS[station];
      const title = SONG_TITLES[station][bar % SONG_TITLES[station].length];
      return `${st.name} — ${st.genre} · “${title}”`;
    },
    duck(level) {
      if (musicGain) musicGain.gain.value = 0.45 * level;
    },
    setSpeed(v) {
      if (!ctx || !engineOsc) return;
      engineOsc.frequency.value = 50 + Math.abs(v) * 4;
      engineGain.gain.value = Math.min(0.14, 0.03 + Math.abs(v) * 0.003);
    },
    startEngine() {
      if (!ctx || engineOsc) return;
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 50;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0.03;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      engineOsc.connect(filter);
      filter.connect(engineGain);
      engineGain.connect(master);
      engineOsc.start();
    },
    startSiren() {
      if (!ctx || sirenOsc) return;
      sirenOsc = ctx.createOscillator();
      sirenOsc.type = 'sine';
      sirenOsc.frequency.value = 700;
      sirenLfo = ctx.createOscillator();
      sirenLfo.frequency.value = 0.6;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 250;
      sirenLfo.connect(lfoGain);
      lfoGain.connect(sirenOsc.frequency);
      sirenGain = ctx.createGain();
      sirenGain.gain.value = 0.05;
      sirenOsc.connect(sirenGain);
      sirenGain.connect(master);
      sirenOsc.start();
      sirenLfo.start();
    },
    setSiren(distance) {
      if (!sirenGain) return;
      sirenGain.gain.value = THREE.MathUtils.clamp(0.12 - distance * 0.001, 0, 0.12);
    },
    stopSiren() {
      if (!sirenOsc) return;
      try { sirenOsc.stop(); sirenLfo.stop(); } catch { /* already stopped */ }
      sirenOsc = null;
      sirenLfo = null;
      sirenGain = null;
    },
    sfx(name) {
      if (!ctx || muted) return;
      const fn = SFX[name];
      if (fn) fn();
    },
    update() {
      if (!ctx || muted) return;
      while (nextNoteTime < ctx.currentTime + 0.15) scheduleBar();
    },
  };
}
