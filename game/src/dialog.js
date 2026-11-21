// Story dialog: a DOM overlay with a faceted portrait chip and a
// typewriter. Missions pause while a dialog is open. Enter or a click
// finishes the line being typed, then advances; the last line closes the
// box and calls back.

export const CAST = {
  leo: { name: 'Leo Marin', initials: 'LM', color: '#2e7fa8', role: 'newcomer' },
  nadia: { name: 'Nadia Sol', initials: 'NS', color: '#c96f4a', role: 'fixer' },
  kiko: { name: 'Kiko', initials: 'KI', color: '#f2c94c', role: 'mechanic' },
  ilsa: { name: 'Ilsa Maren', initials: 'IM', color: '#5e8a7b', role: 'hacker' },
};

const TYPE_CHARS_PER_SECOND = 40;

export function createDialog() {
  const box = document.getElementById('dialog');
  const face = document.getElementById('dialog-face');
  const nameEl = document.getElementById('dialog-name');
  const textEl = document.getElementById('dialog-text');
  let queue = [];
  let current = null;
  let shown = 0;
  let onDone = null;

  function renderLine() {
    if (!current) return;
    const who = CAST[current.who] ?? CAST.leo;
    face.textContent = who.initials;
    face.style.background = who.color;
    nameEl.textContent = who.name;
    textEl.textContent = current.text.slice(0, Math.floor(shown));
  }

  function nextLine() {
    current = queue.shift() ?? null;
    shown = 0;
    if (!current) {
      box.classList.add('hidden');
      const done = onDone;
      onDone = null;
      if (done) done();
      return;
    }
    renderLine();
  }

  return {
    // lines: [{ who: 'nadia', text: '...' }, ...]. done runs when the last
    // line is dismissed. A new dialog replaces one still open.
    show(lines, done) {
      queue = [...lines];
      onDone = done ?? null;
      box.classList.remove('hidden');
      nextLine();
    },
    // Advance: finish typing, otherwise move to the next line.
    advance() {
      if (!current) return;
      if (shown < current.text.length) {
        shown = current.text.length;
        renderLine();
        return;
      }
      nextLine();
    },
    // Typewriter tick; called every frame while open.
    update(dt) {
      if (!current) return;
      if (shown < current.text.length) {
        shown = Math.min(current.text.length, shown + dt * TYPE_CHARS_PER_SECOND);
        renderLine();
      }
    },
    get open() {
      return current !== null;
    },
    close() {
      queue = [];
      current = null;
      onDone = null;
      box.classList.add('hidden');
    },
  };
}
