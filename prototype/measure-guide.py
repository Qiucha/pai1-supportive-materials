# PROTOTYPE, throwaway (ticket #4). Usage: uv run --with playwright python prototype/measure-guide.py file://$PWD prototype/shots
import sys, json
from playwright.sync_api import sync_playwright
base, shots = sys.argv[1], sys.argv[2]
JS = """() => {
  const R = s => { const e = document.querySelector(s); return e && !e.hidden && e.offsetParent !== null ? e.getBoundingClientRect() : null; };
  const ov = (a, b) => a && b ? Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) : 0;
  const gap = (a, b) => a && b ? Math.round(Math.hypot(Math.max(0, b.left - a.right, a.left - b.right), Math.max(0, b.top - a.bottom, a.top - b.bottom))) : null;
  const lab = R('#phone'), card = R('#pg-card'), slot = R('.guide-slot'), st = R('#phone-3d'), mp = R('#phone-map'), rates = R('#rates');
  const ui = document.documentElement.dataset.guide === 'pop' ? card : slot;
  const pct = (a, b) => b ? Math.round(100 * ov(a, b) / (b.width * b.height)) : 0;
  const spots = [...document.querySelectorAll('#phone .spot')].map(e => e.getBoundingClientRect());
  const act = document.querySelector('#phone .spot');
  const labEl = document.querySelector('#phone');
  const inner = [...labEl.querySelectorAll('.cell, .controls')].filter(e => e.scrollHeight > e.clientHeight + 2).length;
  const clipped = [...labEl.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.height && r.bottom > lab.bottom + 1; }).length;
  return { lab: Math.round(lab.height), guideUI: ui ? [Math.round(ui.width), Math.round(ui.height)] : null,
    view3d: st ? [Math.round(st.width), Math.round(st.height)] : null, map: mp ? Math.round(mp.width) : null,
    cover3d: pct(ui, st), coverMap: pct(ui, mp), coverRates: pct(ui, rates),
    coversSpot: spots.some(s => ov(ui, s) > 0), textToSpot: Math.min(...spots.map(s => gap(card, s))),
    innerScroll: inner, clipped };
}"""
with sync_playwright() as p:
  b = p.chromium.launch()
  pg = b.new_page(viewport={'width': 1366, 'height': 650})
  for mode in ['strip', 'pop', 'hybrid']:
    pg.goto(f'{base}/prototype/week3-one-screen.html?variant=C&text=tips&guide={mode}')
    pg.wait_for_timeout(700); pg.keyboard.press('h')
    # Step 1: act on the map near Tower A (tower A is drawn at map left-bottom).
    print(mode, 's1', json.dumps(pg.evaluate(JS)))
    pg.screenshot(path=f'{shots}/guide-{mode}-step1.png')
    m = pg.locator('#phone-map').bounding_box()
    pg.mouse.click(m['x'] + m['width'] * 0.22, m['y'] + m['height'] * 0.72)
    pg.wait_for_timeout(200)
    pg.screenshot(path=f'{shots}/guide-{mode}-step1-done.png')
    pg.click('#pg-card [data-a=next]'); pg.wait_for_timeout(200)
    print(mode, 's2', json.dumps(pg.evaluate(JS)))
    pg.screenshot(path=f'{shots}/guide-{mode}-step2.png')
    pg.click('#tower-b'); pg.click('#pg-card [data-a=next]'); pg.wait_for_timeout(200)
    print(mode, 's3', json.dumps(pg.evaluate(JS)))
    pg.screenshot(path=f'{shots}/guide-{mode}-step3.png')
    if mode == 'pop':  # the collision the owner raised: an ⓘ tip open next to the guide pop-up
      pg.click('[popovertarget="tip-climb"]'); pg.wait_for_timeout(150)
      still = pg.evaluate("!document.querySelector('#pg-card').hidden")
      print(mode, 'tip+guide both visible:', still)
      pg.screenshot(path=f'{shots}/guide-pop-with-tip.png'); pg.keyboard.press('Escape')  # Escape also exits guide in proto
      pg.evaluate('__pg.show(2)')
    pg.click('#tower-c'); pg.click('#run'); pg.wait_for_timeout(2500); pg.click('#reveal-phone'); pg.wait_for_timeout(2600)
    print(mode, 'free', json.dumps(pg.evaluate(JS)))
    pg.screenshot(path=f'{shots}/guide-{mode}-free.png')
  b.close()
