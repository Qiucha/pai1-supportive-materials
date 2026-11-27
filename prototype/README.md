# PROTOTYPE: one-screen lab layouts (throwaway)

This branch is never merged. It answers the wayfinder ticket "What does a lab panel look like when it fits on one 1366×768 screen?" (issue #11, map #10).

## How to open it

Open `prototype/week3-one-screen.html` or `prototype/week4-one-screen.html` in a browser by double-clicking it. No server is needed.

- Switch layouts with `?variant=A|B|C`, the ← → keys, or the black bar at the bottom.
- `?strip=0` hides the guide-area placeholder strip.
- The bar shows the lab's size live. Resize the window to about 1366×650 to see the target.
- The pages use the real `lessons/week3.js` and `lessons/week4.js` unchanged. Only the markup and CSS of the one lab differ.

## The variants

The same key means the same pattern on both weeks.

- **A · Stage + side rail.** The view takes the left 2/3. A right rail holds the map (W3) or boat picker (W4) plus every control in order of use. Readouts sit under the view.
- **B · Toolbar + twin views.** A single control bar runs across the top, in order of use. Below it, the view is on the left and the map and readouts are on the right.
- **C · Controls on the views.** Controls float on the view they drive: tower toggles and climb controls on the 3D stage (W3), and sliders docked at the plot's left edge (W4). The right column holds the map or picker, then the readouts.

## What every variant shares

- The lab box is `clamp(560px, 100svh − 12px, 720px)` tall. Nothing inside it scrolls.
- The heading takes one compact line.
- Text that used to sit inside the panel moved to a short "Before you open the lab" note in the reading above. That text is the tower coordinates, the height rescale note, the ring and legend explanation, and the run limits.
- W4's 12-boat table moved below the lab. W4's picker cards show the silhouette and name only. Each boat's label and ratings appear in the selected-boat card.

## Measurements

Chromium, 1366×650 viewport, with the ~64px guide strip on. Raw output is in `measurements.txt`.

| | W3 3D view | W3 map | W3 control→output gaps (towers / start / climb→3D / climb→readout) | W4 plot | W4 sliders→plot / boats→card |
|---|---|---|---|---|---|
| Today | (2204px lab) | | up to ~1360px | | ~600px |
| A | 526×369 | 179² | 13 / 149 / 13 / 13 | 330² | 182 / 227 |
| B | 590×414 | 213² | 9 / 9 / 98 / 280 | 400² | 9 / 9 |
| C | 664×466 (full 2/3) | 266² | 0 / 9 / 0 / 220 | 461² | 8 / 9 |

All six layouts fit in a 638px lab with no clipping and no inner scroll.

Dropping the guide strip gains about 17px of view height in A and B. It gains nothing for C's 3D view, which is limited by width, but C's map grows.
