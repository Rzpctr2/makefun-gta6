// Radio + procedural SFX. 3 stations, one look-ahead scheduler, one shared
// noise buffer. AudioContext is created only from a user gesture.
export const STATIONS = [
  { name: 'CORAL FM', freq: '96.4', genre: 'synthwave', bpm: 112, root: 110, scale: [0, 3, 5, 7, 10], wave: 'sawtooth', color: '#ff5a8a' },
  { name: 'SOL', freq: '101.9', genre: 'latin', bpm: 96, root: 130.81, scale: [0, 2, 4, 7, 9], wave: 'triangle', color: '#f2c94c' },
  { name: 'TALK', freq: '88.1', genre: 'night talk', bpm: 80, root: 98, scale: [0, 5, 7, 12], wave: 'sine', color: '#4fc3f7' },
];
const CHORDS = [0, -4, -2, -7];
export class Radio {
  constructor() {
    this.ctx = null; this.station = 0; this.step = 0; this.nextTime = 0;
    this.muted = false; this.musicOn = true; this.engineOsc = null; this.engineGain = null;
  }
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.45; this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.5; this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.9; this.sfxGain.connect(this.master);
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -12; comp.ratio.value = 12; comp.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      let s = 99; for (let i = 0; i < len; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = s / 2147483648 - 1; }
      this.nextTime = this.ctx.currentTime + 0.1;
      setInterval(() => this.schedule(), 90);
    } catch { this.ctx = null; }
  }
  get stationInfo() { return STATIONS[this.station]; }
  nextStation() {
    this.station = (this.station + 1) % STATIONS.length; this.step = 0;
    if (this.ctx) this.nextTime = this.ctx.currentTime + 0.05;
    this.sfx('static'); return this.stationInfo;
  }
  toggleMute() { this.muted = !this.muted; if (this.master) this.master.gain.value = this.muted ? 0 : 0.45; return this.muted; }
  tone(freq, dur, type, vol, when = 0, slide = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t + dur + 0.02);
  }
  noise(dur, vol, freq = 1200, when = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when, src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf; src.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxGain); src.start(t); src.stop(t + dur + 0.02);
  }
  sfx(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'click': this.tone(880, 0.05, 'square', 0.12); break;
      case 'blip': this.tone(660, 0.07, 'sine', 0.2, 0, 330); break;
      case 'static': this.noise(0.3, 0.25, 3000); break;
      case 'sting': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.22, i * 0.09)); break;
      case 'wanted': this.tone(220, 0.25, 'square', 0.18); this.tone(174, 0.35, 'square', 0.18, 0.22); break;
      case 'busted': [392, 311, 233].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.15, i * 0.18)); break;
      case 'shot': this.noise(0.09, 0.5, 2500); this.tone(160, 0.08, 'square', 0.25, 0, -80); break;
      case 'thud': this.tone(70, 0.16, 'sine', 0.4, 0, -30); this.noise(0.1, 0.2, 400); break;
      case 'siren': this.tone(700, 0.8, 'sine', 0.12, 0, 300); break;
      case 'unlock': [440, 554, 659].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.2, i * 0.07)); break;
      default: this.tone(440, 0.06, 'sine', 0.15);
    }
  }
  schedule() {
    if (!this.ctx || this.muted || !this.musicOn) return;
    const st = STATIONS[this.station], stepDur = 60 / st.bpm / 2;
    while (this.nextTime < this.ctx.currentTime + 0.25) {
      const s = this.step, t = this.nextTime - this.ctx.currentTime;
      const chord = CHORDS[Math.floor(s / 8) % 4];
      const semi = st.scale[s % st.scale.length] + chord + (s % 16 === 0 ? 12 : 0);
      const freq = st.root * Math.pow(2, semi / 12);
      if (st.genre !== 'night talk' || s % 4 === 0) {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = st.wave; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, this.nextTime);
        g.gain.linearRampToValueAtTime(st.genre === 'night talk' ? 0.05 : 0.11, this.nextTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, this.nextTime + stepDur * 0.95);
        o.connect(g); g.connect(this.musicGain); o.start(this.nextTime); o.stop(this.nextTime + stepDur);
      }
      if (s % 4 === 0) {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.value = st.root / 2 * Math.pow(2, chord / 12);
        g.gain.setValueAtTime(0.12, this.nextTime); g.gain.exponentialRampToValueAtTime(0.001, this.nextTime + stepDur * 3.5);
        o.connect(g); g.connect(this.musicGain); o.start(this.nextTime); o.stop(this.nextTime + stepDur * 4);
      }
      this.step++; this.nextTime += stepDur;
    }
  }
  setEngine(on, speed01) {
    if (!this.ctx) return;
    if (on && !this.engineOsc) {
      this.engineOsc = this.ctx.createOscillator(); this.engineOsc.type = 'sawtooth';
      this.engineGain = this.ctx.createGain(); this.engineGain.gain.value = 0.03;
      const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
      this.engineOsc.connect(f); f.connect(this.engineGain); this.engineGain.connect(this.sfxGain);
      this.engineOsc.start();
    }
    if (this.engineOsc) {
      this.engineOsc.frequency.value = 55 + speed01 * 160;
      this.engineGain.gain.value = on ? 0.02 + speed01 * 0.05 : 0;
    }
  }
  duck(on) { if (this.musicGain) this.musicGain.gain.value = on ? 0.15 : 0.5; }
  update(dt, driving, speed01) { this.setEngine(driving, speed01 || 0); }
  trackName() {
    const st = STATIONS[this.station];
    return `${st.name} ${st.freq} — ${st.genre} · ${['Golden Hour Drive', 'Palma Nights', 'Coastline Cruise', 'Neon Tide'][(this.step >> 4) % 4]}`;
  }
}
