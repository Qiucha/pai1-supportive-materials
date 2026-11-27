import sys
from playwright.sync_api import sync_playwright
base, out = sys.argv[1], sys.argv[2]
with sync_playwright() as p:
  b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1366, 'height': 650})
  for t in ['reading', 'tips', 'guide']:
    pg.goto(f'{base}/prototype/week3-one-screen.html?variant=C&text={t}'); pg.wait_for_timeout(500); pg.keyboard.press('h')
    if t == 'reading':
      pg.evaluate("document.querySelector('.lab-notes').scrollIntoView({block:'start'})")
    if t == 'tips':
      pg.click('[popovertarget="tip-map"]')
    pg.screenshot(path=f'{out}/week3-C-text-{t}.png')
    print(t, pg.evaluate("Math.round(document.querySelector('.lab').getBoundingClientRect().height)"))
  b.close()
