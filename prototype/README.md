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

---

# PROTOTYPE: where guide text sits (ticket #4)

Question: does a guide's text sit in a **strip** inside the lab, or in **pop-ups** next to the highlighted controls? Built on the chosen layout (C, ⓘ tips).

## How to open it

`prototype/week3-one-screen.html?variant=C&text=tips&guide=strip|pop|hybrid`. The black bar's "Guide:" button cycles the modes. Press `h` to hide the bar.

- **strip:** one row along the bottom of the lab holds the step text plus Back, Skip step / Next, and Skip guide.
- **pop:** no strip, so the map gets the height back. A card sits beside the control the step uses. The placement code tries six spots and picks the one that covers the least of the highlighted pieces. Replay lives in the lab heading.
- **hybrid** (cheap extra): the strip, plus a small bobbing "▼ here" tag on the control to use. The tag doesn't move when the learner has reduced motion on.

What all three share:
- 3 sample steps of predict-then-act. The text is a placeholder; the real script comes later.
- The guide opens automatically. Each step completes when the learner uses the real control. Nothing is locked: "Skip step" becomes "Next" once the step is done.
- The guide hands over about 2s after the last action (Reveal), then shows "Explore freely" with "Replay guide". Esc exits.
- The old W3 guide UI is hidden. Completion isn't saved (a prototype rule).

## Measurements (Chromium 1366×650; raw output in `measurements-guide.txt`, screenshots `shots/guide-*`)

| | Guide UI size | Covers 3D / map / rates | Covers a highlighted piece? | Text → highlighted piece | Map size (step 1) |
|---|---|---|---|---|---|
| strip | 1009×57, one line at 30 words | 0 / 0 / 0 | never | 175px (step 1, map at top right), 17px (steps 2–3) | 266² |
| pop | 304×147–165 | step 1: 11% of 3D · step 2: 29% of map · step 3: 4% of 3D | **steps 2 and 3**: covers the map top in step 2 and the **Reveal button** that step 3 asks for | 0–9px | 326² |
| hybrid | same as strip, plus a 1-line tag | 0 / 0 / 0 | never (the tag sits above the control) | same as strip; the tag is at the control | 266² |

The lab is 638px in every mode, with no inner scroll and nothing clipped.

**Findings**
- **Pop-ups have no free spot in this layout.** The 3D takes 2/3 of the width and the side column is packed, so steps that highlight two areas (control plus output) leave nowhere to put a 300px card. It lands on something the step wants watched.
- **ⓘ and guide collide** (`shots/guide-pop-with-tip.png`). Opening the climb ⓘ while the step-3 pop-up is open shows two cards near the same controls. The ⓘ card lands over the 3D view.
- **The strip costs nothing that matters.** It is 57px, and the 3D stays 664×466. Its weakness is distance: in step 1 the text is 175px from the map it refers to. The hybrid tag closes that gap without covering anything.
- **Side finding for the W3 spec (not about the guide):** after Run and Reveal, the side column's readout text grows and squeezes the map from 266 to 123px (strip) or 161px (no strip). The readout needs a fixed height or a shorter text.
