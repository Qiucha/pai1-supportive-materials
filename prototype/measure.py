import sys, json
from playwright.sync_api import sync_playwright
base, page_name, shots = sys.argv[1], sys.argv[2], sys.argv[3]
pairs = {  # control -> output it drives, same idea as the map's inventory distances
  'week3': [('#tower-controls', '.stage'), ('#candidate-controls', '.mapfig'), ('#ascent-controls', '.stage'), ('#ascent-controls', '#phone-results')],
  'week4': [('.lab .sliders', '.plot-cell svg'), ('#boat-options', '.selected-card'), ('.lab .sliders', '.selected-card')],
}[page_name]
JS = """(pairs) => {
  const lab = document.querySelector('.lab'); const L = lab.getBoundingClientRect();
  const over = [...lab.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.height && (r.bottom > L.bottom + 1 || r.right > L.right + 1); }).map(e => e.id || e.className || e.tagName).slice(0, 6);
  const inner = [...lab.querySelectorAll('.cell, .controls')].filter(e => e.scrollHeight > e.clientHeight + 2).map(e => e.id || e.className).slice(0, 6);
  const gap = (a, b) => { const r1 = document.querySelector(a).getBoundingClientRect(), r2 = document.querySelector(b).getBoundingClientRect();
    const dx = Math.max(0, r2.left - r1.right, r1.left - r2.right), dy = Math.max(0, r2.top - r1.bottom, r1.top - r2.bottom); return Math.round(Math.hypot(dx, dy)); };
  const stage = document.querySelector('.stage canvas, .plot-cell svg').getBoundingClientRect(); const mp = document.querySelector('.mapfig canvas, .lab .boat-grid'); const M = mp ? mp.getBoundingClientRect() : {width:0,height:0};
  return { lab: [Math.round(L.width), Math.round(L.height)], natural: lab.scrollHeight, clipped: over, innerScroll: inner,
           view: [Math.round(stage.width), Math.round(stage.height)], map: [Math.round(M.width), Math.round(M.height)], gaps: pairs.map(([a, b]) => a + '→' + b + ' ' + gap(a, b)) };
}"""
with sync_playwright() as p:
  b = p.chromium.launch()
  for vw, vh in [(1366, 650), (1440, 900)]:
    pg = b.new_page(viewport={'width': vw, 'height': vh})
    for v in 'ABC':
      for strip in '10':
        pg.goto(f'{base}/prototype/{page_name}-one-screen.html?variant={v}&strip={strip}')
        pg.wait_for_timeout(500)
        r = pg.evaluate(JS, pairs)
        print(vw, vh, v, 'strip' if strip == '1' else 'nostrip', json.dumps(r))
        if strip == '1':
          pg.screenshot(path=f'{shots}/{page_name}-{v}-{vw}x{vh}.png')
  b.close()
