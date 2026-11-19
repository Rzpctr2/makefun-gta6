// Dialog: DOM overlay + faceted portrait chip, typewriter 40 chars/s.
// Missions pause while a dialog is open. Enter/click advances.
export const CAST = {
  Nadia: { color: '#2e86c1', init: 'NS', desc: 'fixer, denim jacket, black shades' },
  Leo: { color: '#d23c2e', init: 'LM', desc: 'newcomer' },
  Kiko: { color: '#f2c94c', init: 'KG', desc: 'mechanic, golden hands' },
  Ilsa: { color: '#8e44ad', init: 'IM', desc: 'hacker' },
};
export class Dialog {
  constructor(root) {
    this.root = root;
    this.nameEl = root.querySelector('#dialog-name');
    this.textEl = root.querySelector('#dialog-text');
    this.faceEl = root.querySelector('#dialog-face');
    this.lines = []; this.idx = 0; this.shown = 0; this.active = false; this.onDone = null; this.acc = 0;
    root.addEventListener('click', () => this.advance());
  }
  show(lines, onDone) {
    if (!lines || !lines.length) { if (onDone) onDone(); return; }
    this.lines = lines; this.idx = 0; this.active = true; this.onDone = onDone || null;
    this.root.classList.remove('hidden'); this.startLine();
  }
  startLine() {
    const line = this.lines[this.idx], who = CAST[line.who] || CAST.Leo;
    this.nameEl.textContent = line.who;
    this.nameEl.style.color = who.color;
    this.faceEl.textContent = who.init;
    this.faceEl.style.background = `linear-gradient(135deg, ${who.color}, #20262e 130%)`;
    this.textEl.textContent = ''; this.shown = 0; this.acc = 0;
  }
  update(dt) {
    if (!this.active) return;
    const line = this.lines[this.idx];
    if (this.shown < line.text.length) {
      this.acc += dt * 40; const n = Math.min(line.text.length, Math.floor(this.acc));
      if (n !== this.shown) { this.shown = n; this.textEl.textContent = line.text.slice(0, n); }
    }
  }
  advance() {
    if (!this.active) return;
    const line = this.lines[this.idx];
    if (this.shown < line.text.length) { this.shown = line.text.length; this.textEl.textContent = line.text; return; }
    this.idx++;
    if (this.idx >= this.lines.length) {
      this.active = false; this.root.classList.add('hidden');
      const cb = this.onDone; this.onDone = null; if (cb) cb();
    } else this.startLine();
  }
  dur(text) { return Math.min(6.5, 1.8 + text.length * 0.045); }
}
