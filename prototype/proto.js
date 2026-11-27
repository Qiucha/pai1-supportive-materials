/* PROTOTYPE, throwaway (wayfinder ticket #11). Variant switcher for one-screen lab layouts. */
(function () {
  const VARIANTS = { A: 'Stage + side rail', B: 'Toolbar + twin views', C: 'Controls on the views' };
  const keys = Object.keys(VARIANTS);
  const qs = new URLSearchParams(location.search);
  let v = keys.includes(qs.get('variant')) ? qs.get('variant') : 'A';
  const strip = qs.get('strip') !== '0';
  const TEXT = { reading: 'Text: reading above', tips: 'Text: tooltips in lab', guide: 'Text: in guide steps' };
  const text = TEXT[qs.get('text')] ? qs.get('text') : 'reading';
  document.documentElement.dataset.text = text;
  document.documentElement.dataset.variant = v;
  document.documentElement.dataset.strip = strip ? '1' : '0';

  function go(next) {
    qs.set('variant', next);
    location.search = qs.toString();
  }
  function cycle(d) { go(keys[(keys.indexOf(v) + d + keys.length) % keys.length]); }

  addEventListener('DOMContentLoaded', () => {
    const bar = document.createElement('div');
    bar.className = 'proto-bar';
    const other = location.pathname.includes('week3') ? ['week4-one-screen.html', 'Week 4'] : ['week3-one-screen.html', 'Week 3'];
    bar.innerHTML =
      '<button type="button" data-d="-1" aria-label="Previous variant">←</button>' +
      '<span><b>' + v + '</b> · ' + VARIANTS[v] + '</span>' +
      '<button type="button" data-d="1" aria-label="Next variant">→</button>' +
      '<button type="button" data-text>' + TEXT[text] + ' ▸</button>' +
      '<button type="button" data-strip>' + (strip ? 'Hide' : 'Show') + ' guide strip</button>' +
      '<a href="' + other[0] + '?' + qs.toString() + '">' + other[1] + '</a>' +
      '<span class="proto-size"></span>';
    document.body.append(bar);
    bar.querySelectorAll('[data-d]').forEach(b => b.onclick = () => cycle(Number(b.dataset.d)));
    bar.querySelector('[data-text]').onclick = () => { const k = Object.keys(TEXT); qs.set('text', k[(k.indexOf(text) + 1) % k.length]); location.search = qs.toString(); };
    bar.querySelector('[data-strip]').onclick = () => { qs.set('strip', strip ? '0' : '1'); location.search = qs.toString(); };
    addEventListener('keydown', e => {
      if (e.target.closest('input, textarea, select, [contenteditable]')) return;
      if (e.key === 'h') bar.hidden = !bar.hidden;
      if (e.key === 'ArrowLeft') cycle(-1);
      if (e.key === 'ArrowRight') cycle(1);
    });
    const lab = document.querySelector('.lab');
    const size = bar.querySelector('.proto-size');
    const show = () => {
      const r = lab.getBoundingClientRect();
      size.textContent = 'lab ' + Math.round(r.width) + '×' + Math.round(r.height) + ' · viewport ' + innerWidth + '×' + innerHeight;
    };
    show();
    addEventListener('resize', show);
    // Bring the lab to the top of the screen, as a guide start would.
    setTimeout(() => { lab.scrollIntoView({ block: 'start' }); show(); }, 150);
  });
})();
