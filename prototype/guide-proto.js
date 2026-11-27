/* PROTOTYPE, throwaway (wayfinder ticket #4, map #10).
   Where does guide text sit? ?guide=strip | pop | hybrid, on layout C with ⓘ tips.
   Step text is SAMPLE text; the real script is drafted and approved in a later ticket.
   No persistence: completion is "remembered" only until reload (the real build uses the browser). */
(function () {
  const MODES = { strip: 'Guide: strip in lab', pop: 'Guide: pop-ups by controls', hybrid: 'Guide: strip + pointer' };
  const qs = new URLSearchParams(location.search);
  const mode = MODES[qs.get('guide')] ? qs.get('guide') : 'strip';
  const root = document.documentElement;
  root.dataset.guide = mode;
  if (mode === 'pop') root.dataset.strip = '0'; // no strip: the map gets the height back
  const $ = id => document.getElementById(id);

  // act = the piece the learner uses (pop-up anchors here); look = where the change shows.
  const STEPS = [
    { text: 'Tower A heard 16 of its 50 packets. Predict: right next to A, is the expected rate above or below 16/50? Click the map near A.',
      act: '.mapfig', look: ['#rates'], done: e => e.target.closest('#phone-map, #phone-form'),
      feedback: 'Far above: so close, A should hear almost every packet. The dashed ring marks where 16/50 fits.' },
    { text: 'Add Tower B. Predict: where will the best spots be now? Look where the two rings cross on the map and the height view.',
      act: '#tower-controls', look: ['.stage', '.mapfig'], done: e => e.target.closest('#tower-b'),
      feedback: 'The high ground sits near where the rings cross: both towers agree there.' },
    { text: 'Add Tower C, then press Run. Predict: will the climb end exactly on the phone? Reveal it to check.',
      act: '#ascent-controls', look: ['.stage', '#phone-results'], done: e => e.target.closest('#reveal-phone'),
      feedback: 'Close, but not exact: the fit finds the best score for these counts, not the phone itself.' },
  ];
  // Hybrid points at the control to use; step 3 needs Tower C first, so point at the towers until it is on.
  const pointAt = i => (i === 2 && $('tower-c').getAttribute('aria-pressed') !== 'true') ? '#tower-controls' : STEPS[i].act;

  let i = -1, done = false, finished = false;
  const lab = () => $('phone');

  function ui() {
    lab().querySelectorAll('.stage, .mapfig').forEach(e => e.classList.add('guide-piece'));
    // Hide the old guide UI but keep its elements: week3.js binds to them at load.
    $('guide-open').hidden = true;
    document.querySelector('.guide-slot .slot-label').hidden = true;
    document.querySelector('.guide-slot .mock-step').hidden = true;

    const card = document.createElement('div');
    card.id = 'pg-card';
    card.className = 'pg-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'Lab guide');
    card.innerHTML =
      '<span class="pg-count"></span><p class="pg-text" aria-live="polite"></p>' +
      '<div class="pg-btns"><button type="button" data-a="back">Back</button>' +
      '<button type="button" data-a="next">Next</button>' +
      '<button type="button" data-a="skip">Skip guide</button></div>';
    const free = document.createElement('div');
    free.id = 'pg-free';
    free.className = 'pg-free';
    free.innerHTML = '<span>Explore freely: every control is yours.</span> <button type="button" data-a="replay">Replay guide</button>';
    if (mode === 'pop') {
      lab().append(card);
      document.querySelector('#phone .lab-head').append(free); // Replay's home when there is no strip
    } else {
      document.querySelector('.guide-slot').append(card, free);
    }
    const ptr = document.createElement('div');
    ptr.id = 'pg-ptr';
    ptr.className = 'pg-ptr';
    ptr.textContent = '▼ here';
    lab().append(ptr);

    lab().addEventListener('click', e => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'back' && i > 0) show(i - 1);
      else if (a === 'next') { if (i === STEPS.length - 1) finish(); else show(i + 1); }
      else if (a === 'skip') finish();
      else if (a === 'replay') show(0);
    });
    // Completion by using the real controls.
    document.addEventListener('click', e => { if (i >= 0 && !done && STEPS[i].done(e)) complete(); setTimeout(place, 0); });
    $('phone-form').addEventListener('submit', e => { if (i === 0 && !done) complete(); });
    addEventListener('resize', place);
    addEventListener('keydown', e => { if (e.key === 'Escape' && i >= 0) finish(); });
  }

  function spot(sel) { return [...lab().querySelectorAll(sel)]; }

  function show(n) {
    i = n; done = false; finished = false;
    const s = STEPS[i];
    lab().classList.add('guided');
    lab().querySelectorAll('.spot').forEach(e => e.classList.remove('spot'));
    [s.act, ...s.look].forEach(sel => spot(sel).forEach(e => e.classList.add('spot')));
    if (i === 2) spot('#tower-controls').forEach(e => e.classList.add('spot'));
    $('pg-card').hidden = false;
    $('pg-free').hidden = true;
    $('pg-card').querySelector('.pg-count').textContent = 'Step ' + (i + 1) + ' of ' + STEPS.length + ' · sample text';
    $('pg-card').querySelector('.pg-text').textContent = s.text;
    $('pg-card').querySelector('[data-a=back]').disabled = i === 0;
    nextLabel();
    place();
  }

  function nextLabel() {
    const b = $('pg-card').querySelector('[data-a=next]');
    b.textContent = done ? (i === STEPS.length - 1 ? 'Explore freely' : 'Next') : 'Skip step';
    b.classList.toggle('pg-primary', done);
  }

  function complete() {
    done = true;
    $('pg-card').querySelector('.pg-text').innerHTML = '<b>' + STEPS[i].feedback + '</b>';
    nextLabel();
    place();
    // Research: hand over right after the last guided action.
    if (i === STEPS.length - 1) setTimeout(finish, 2200);
  }

  function finish() {
    i = -1; finished = true;
    lab().classList.remove('guided');
    lab().querySelectorAll('.spot').forEach(e => e.classList.remove('spot'));
    $('pg-card').hidden = true;
    $('pg-free').hidden = false;
    $('pg-ptr').hidden = true;
  }

  // Pop-up placement: try right/left/below/above the act piece, keep inside the lab,
  // pick the spot that covers the least of the graphs and the highlighted pieces.
  function rectOf(el) { return el.getBoundingClientRect(); }
  function overlap(a, b) {
    return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
           Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  }
  function place() {
    const ptr = $('pg-ptr');
    ptr.hidden = !(mode === 'hybrid' && i >= 0 && !done);
    if (!ptr.hidden) {
      const L = rectOf(lab()), A = rectOf(spot(pointAt(i))[0]);
      ptr.style.left = (A.left - L.left + 12) + 'px';
      ptr.style.top = (A.top - L.top - 22) + 'px';
      if (A.top - L.top < 26) { ptr.textContent = '▲ here'; ptr.style.top = (A.bottom - L.top + 2) + 'px'; } else ptr.textContent = '▼ here';
    }
    if (mode !== 'pop' || i < 0) return;
    const card = $('pg-card'), L = rectOf(lab()), A = rectOf(spot(STEPS[i].act)[0]);
    const w = card.offsetWidth, h = card.offsetHeight, g = 10;
    // Highlighted pieces cost 10× a dimmed graph: covering what the step asks you to watch is worst.
    const hot = [...lab().querySelectorAll('.spot')].map(rectOf);
    const cold = [...lab().querySelectorAll('#phone-3d, #phone-map, #rates, #phone-results')].filter(e => !e.closest('.spot')).map(rectOf);
    const cands = [
      [A.right + g, A.top], [A.left - w - g, A.top], [A.left, A.bottom + g], [A.left, A.top - h - g],
      [A.right + g, A.bottom - h], [A.left - w - g, A.bottom - h],
    ].map(([x, y]) => {
      x = Math.min(Math.max(x, L.left + 6), L.right - w - 6);
      y = Math.min(Math.max(y, L.top + 6), L.bottom - h - 6);
      const r = { left: x, top: y, right: x + w, bottom: y + h };
      return { x, y, cost: hot.reduce((s, a) => s + 10 * overlap(r, a), 0) + cold.reduce((s, a) => s + overlap(r, a), 0) };
    });
    const best = cands.reduce((a, b) => (b.cost < a.cost ? b : a));
    card.style.left = (best.x - L.left) + 'px';
    card.style.top = (best.y - L.top) + 'px';
  }

  addEventListener('load', () => {
    ui();
    // Prototype bar: add a guide-mode toggle.
    const bar = document.querySelector('.proto-bar');
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = MODES[mode] + ' ▸';
    b.onclick = () => { const k = Object.keys(MODES); qs.set('guide', k[(k.indexOf(mode) + 1) % k.length]); location.search = qs.toString(); };
    bar.insertBefore(b, bar.querySelector('[data-strip]'));
    bar.querySelector('[data-strip]').hidden = true;
    // Opens automatically the first time the lab is on screen (proto.js scrolls it there).
    setTimeout(() => show(0), 300);
    window.__pg = { show, finish, step: () => i, mode };
  });
})();
