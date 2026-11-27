'use strict';
const Attack = (() => {
  const sig = z => 1 / (1 + Math.exp(-z));
  function forward(net, x) {
    const h = net.W1.map((w, k) => {
      let z = net.b1[k];
      for (let j = 0; j < 784; j++) if (x[j]) z += w[j] * x[j];
      return sig(z);
    });
    let z = net.b2;
    for (let k = 0; k < 4; k++) z += net.w2[k] * h[k];
    return { h, p: sig(z) };
  }
  const blackPixels = x => {
    const out = [];
    for (let j = 0; j < 784; j++) if (!x[j]) out.push(j);
    return out;
  };
  // Strategy 1: try every black pixel alone, rank by resulting probability (lowest first).
  function tryEvery(net, x) {
    const y = x.slice();
    const scored = [];
    for (const j of blackPixels(x)) {
      y[j] = 1;
      scored.push([j, forward(net, y).p]);
      y[j] = 0;
    }
    scored.sort((a, b) => a[1] - b[1]);
    return { order: scored.map(s => s[0]), passes: scored.length };
  }
  // Strategy 2: find the hidden neuron with the most negative vote, rank pixels by its weight. No passes.
  function loudestDisagreer(net) {
    let k = 0;
    for (let i = 1; i < 4; i++) if (net.w2[i] < net.w2[k]) k = i;
    return k;
  }
  function chaseNeuron(net, x) {
    const k = loudestDisagreer(net);
    const w = net.W1[k];
    return { order: blackPixels(x).sort((a, b) => w[b] - w[a]), passes: 0, neuron: k };
  }
  // Strategy 3: gradient of log P wrt every pixel (1 forward + 1 backward), rank most negative first.
  function gradient(net, x) {
    const { h, p } = forward(net, x);
    const g = new Float64Array(784);
    for (let k = 0; k < 4; k++) {
      const c = (1 - p) * net.w2[k] * h[k] * (1 - h[k]);
      const w = net.W1[k];
      for (let j = 0; j < 784; j++) g[j] += c * w[j];
    }
    return { order: blackPixels(x).sort((a, b) => g[a] - g[b]), passes: 2, grad: g };
  }
  // Add pixels in ranked order until P < 0.5. Returns how many were needed.
  function pixelsToFool(net, x, order) {
    const y = x.slice();
    for (let n = 0; n < order.length; n++) {
      y[order[n]] = 1;
      if (forward(net, y).p < 0.5) return n + 1;
    }
    return Infinity;
  }
  const fooled = p => p < 0.5;
  return { fooled, forward, tryEvery, chaseNeuron, gradient, pixelsToFool, loudestDisagreer };
})();

(function () {
  const net = window.CENTERPIECE;
  const $ = id => document.getElementById(id);
  const samples = net.samples.map(s => Uint8Array.from(s, Number));
  const strategies = [
    ['every', 'Try every pixel', Attack.tryEvery, 'Test each dark pixel alone and rank by the lowest resulting probability.'],
    ['neuron', 'Chase the loudest disagreeing neuron', Attack.chaseNeuron, 'Use the neuron with the most negative output weight. Rank by its largest input weights. This ignores the other hidden neurons.'],
    ['grad', 'Follow the gradient', Attack.gradient, 'Rank by the most negative log-probability derivative at the starting image. This uses one forward pass and one backward pass.']
  ];

  let base;
  let baseResult;
  let x;
  let currentResult;
  let plans = {};
  let ready = false;
  let active = null;
  let selectedPixel = null;
  let previous = null;

  const signed = n => (n >= 0 ? '+' : '') + n.toFixed(4);
  const loud = Attack.loudestDisagreer(net);

  function parseCssColor(hex) {
    const clean = (hex || '#ffffff').replace('#', '').trim();
    const full = clean.length === 3
      ? clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2]
      : clean;
    const n = parseInt(full, 16);
    if (isNaN(n)) return [255, 255, 255];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // Describe signed weight concentration across a 3x3 spatial grid so positive and negative regions stay distinct.
  function describeWeights(w) {
    const rows = ['upper', 'middle', 'lower'];
    const cols = ['left', 'center', 'right'];
    const pos = Array(9).fill(0);
    const neg = Array(9).fill(0);
    w.forEach((v, j) => {
      const r = Math.floor(j / 28);
      const c = j % 28;
      const ri = r < 9 ? 0 : r < 19 ? 1 : 2;
      const ci = c < 9 ? 0 : c < 19 ? 1 : 2;
      const idx = ri * 3 + ci;
      if (v > 0) pos[idx] += v;
      else if (v < 0) neg[idx] += -v;
    });
    const order = arr => arr.map((val, idx) => [val, idx]).sort((a, b) => b[0] - a[0]);
    const topPos = order(pos);
    const topNeg = order(neg);
    const name = idx => rows[Math.floor(idx / 3)] + ' ' + cols[idx % 3];
    const p1 = topPos[0][1];
    let n1 = topNeg[0][1];
    if (n1 === p1 && topNeg[1][0] > topNeg[0][0] * 0.75) {
      n1 = topNeg[1][1];
    }
    if (p1 === n1) {
      return 'Positive and negative weights mix heavily in the ' + name(p1) + ' region, with secondary positive weights in the ' + name(topPos[1][1]) + '.';
    }
    return 'Strongest positive weights concentrate in the ' + name(p1) + '. Strongest negative weights concentrate in the ' + name(n1) + '.';
  }

  const maps = net.W1.map((w, k) => {
    const figure = document.createElement('figure');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 28;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Hidden neuron ' + (k + 1) + ' input weights');
    const caption = document.createElement('figcaption');
    caption.id = 'heat-desc-' + k;
    canvas.setAttribute('aria-describedby', caption.id);
    canvas.addEventListener('pointermove', e => {
      const rect = canvas.getBoundingClientRect();
      const col = Math.floor(((e.clientX - rect.left) / rect.width) * 28);
      const row = Math.floor(((e.clientY - rect.top) / rect.height) * 28);
      if (col >= 0 && col < 28 && row >= 0 && row < 28) {
        const val = w[row * 28 + col];
        $('heatmap-probe').textContent = 'h' + (k + 1) + ' at row ' + (row + 1) + ', column ' + (col + 1) + ': input weight ' + signed(val) + '.';
      }
    });
    figure.append(canvas, caption);
    $('heatmaps').append(figure);
    return { figure, canvas, caption, pattern: describeWeights(w) };
  });

  samples.forEach((s, i) => $('sample').add(new Option('Sample ' + (i + 1), i)));

  strategies.forEach(([id, label, , explanation]) => {
    const row = document.createElement('div');
    row.className = 'strategy';
    row.innerHTML =
      '<div><h4>' + label + '</h4><p>' + explanation + '</p></div>' +
      '<div class="controls">' +
      '<button type="button" data-strategy="' + id + '" data-action="step" disabled aria-label="Step: ' + label + '">Step</button>' +
      '<button type="button" data-strategy="' + id + '" data-action="run" disabled aria-label="Run: ' + label + '">Run</button>' +
      '</div>';
    $('strategies').append(row);

    const tr = document.createElement('tr');
    tr.id = 'result-' + id;
    tr.innerHTML = '<th scope="row">' + label + '</th><td>Awaiting prediction</td><td>0</td><td>Not started</td>';
    $('results').append(tr);
  });

  function drawDigit(canvas, image, original) {
    const ctx = canvas.getContext('2d');
    const cell = canvas.width / 28;
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const tokens = PAI.getTokens();
    image.forEach((v, j) => {
      if (!v) return;
      const left = (j % 28) * cell;
      const top = Math.floor(j / 28) * cell;
      const added = original && !original[j];
      ctx.fillStyle = added ? (tokens.isDark ? '#ffb07c' : '#f6bb76') : '#ffffff';
      ctx.fillRect(left, top, cell, cell);
      if (added) {
        ctx.fillStyle = '#141414';
        ctx.fillRect(left + cell * 0.375, top + cell * 0.375, cell * 0.25, cell * 0.25);
      }
    });
  }

  // Diverging ramp from card surface (zero) to positive/negative so both luminance and hue encode |w|.
  function drawHeatmaps() {
    const t = PAI.getTokens();
    const zeroRgb = parseCssColor(t.card);
    maps.forEach(({ canvas }, k) => {
      const ctx = canvas.getContext('2d');
      const data = ctx.createImageData(28, 28);
      const weights = net.W1[k];
      const max = Math.max(...weights.map(Math.abs));
      weights.forEach((v, j) => {
        const to = v > 0 ? t.positiveRgb : t.negativeRgb;
        const mag = Math.pow(Math.min(1, Math.abs(v) / max), 0.72);
        const rgb = zeroRgb.map((c, i) => Math.round(c + (to[i] - c) * mag));
        data.data.set([rgb[0], rgb[1], rgb[2], 255], j * 4);
      });
      ctx.putImageData(data, 0, 0);
    });
  }

  function describeAdded() {
    const groups = [0, 0, 0, 0];
    x.forEach((v, j) => {
      if (v && !base[j]) groups[(j >= 392 ? 2 : 0) + (j % 28 >= 14 ? 1 : 0)]++;
    });
    return ['top left', 'top right', 'bottom left', 'bottom right']
      .map((name, i) => groups[i] + ' in the ' + name)
      .join(', ');
  }

  function render() {
    const result = currentResult;
    const added = x.reduce((n, v, j) => n + (v && !base[j] ? 1 : 0), 0);
    drawDigit($('starting'), base);
    drawDigit($('edited'), x, base);

    $('edited').classList.toggle('locked', ready);
    $('return-manual').hidden = !ready;

    $('starting-desc').textContent =
      'Starting sample ' + (+$('sample').value + 1) + '. A handwritten 3 with ' +
      base.reduce((a, b) => a + b, 0) + ' ink pixels. No additions.';
    $('edited-desc').textContent =
      'Edited sample ' + (+$('sample').value + 1) + '. ' + added + ' pixels added: ' +
      describeAdded() + '. Dark centers mark additions.';

    $('probability').textContent = result.p.toFixed(6);
    $('status').textContent =
      added + ' pixels added. ' +
      (Attack.fooled(result.p) ? 'Fooled. The model says "not a 3".' : 'Not fooled. The model says "yes".');
    $('view-label').textContent = active
      ? 'Viewing ' + strategies.find(s => s[0] === active)[1] + '.'
      : ready
        ? 'Stage 2 is active. Run a strategy below, or press Return to manual editing.'
        : 'Viewing manual edits.';

    maps.forEach(({ figure, caption, pattern }, k) => {
      figure.classList.toggle('chasing', active === 'neuron' && k === loud);
      caption.textContent =
        'h' + (k + 1) + '. Activation ' + result.h[k].toFixed(4) +
        '. Output weight ' + signed(net.w2[k]) + '. ' + pattern;
      if (k === loud) {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = 'Loudest disagreeing neuron';
        caption.append(badge);
      }
    });

    if (selectedPixel !== null && previous) {
      const j = selectedPixel;
      $('trace').textContent =
        'Last addition: row ' + (Math.floor(j / 28) + 1) + ', column ' + ((j % 28) + 1) + '. ' +
        result.h.map((a, k) =>
          'h' + (k + 1) + ': input weight ' + signed(net.W1[k][j]) +
          ', activation change ' + signed(a - previous.h[k]) +
          ', output contribution ' + signed(net.w2[k] * a) +
          ' with change ' + signed(net.w2[k] * (a - previous.h[k])) + '.'
        ).join(' ');
    } else {
      $('trace').textContent = 'Add a pixel to trace its signed connections and activation changes.';
    }

    strategies.forEach(([id]) => {
      const plan = plans[id];
      const cells = $('result-' + id).children;
      cells[1].textContent = plan ? (id === 'grad' ? '1 forward + 1 backward' : plan.passes + ' forward') : 'Not ranked';
      cells[2].textContent = plan ? plan.verifyPasses : 0;
      cells[3].textContent = !plan
        ? 'Not started'
        : plan.done
          ? (Attack.fooled(plan.result.p) ? String(plan.next) : 'Did not fool the model.')
          : plan.next + ' so far';
      document.querySelectorAll('[data-strategy="' + id + '"]').forEach(b => {
        b.disabled = !ready || !!(plan && plan.done);
      });
    });

    const finished = Object.values(plans).filter(p => p.done && Attack.fooled(p.result.p));
    $('tradeoff').textContent = finished.length === 3
      ? 'On this 3, trying every pixel used ' + plans.every.next + ' pixels, neuron chase used ' + plans.neuron.next +
        ', and the gradient used ' + plans.grad.next + '. Compare those pixel counts with the ranking costs above. Fewest ranking passes need not mean fewest added pixels. Results can change with the starting image.'
      : 'Run each strategy to reveal its pixel count. A low ranking cost does not guarantee fewer added pixels.';
  }

  function combination(n, k) {
    let out = 1n;
    for (let i = 1; i <= k; i++) out = (out * BigInt(n - k + i)) / BigInt(i);
    return out;
  }

  // Resets Centerpiece state without erasing the learner's Check 1 or Check 2 answers.
  function resetCenterpiece() {
    base = samples[+$('sample').value];
    baseResult = Attack.forward(net, base);
    x = base.slice();
    currentResult = baseResult;
    plans = {};
    ready = false;
    active = null;
    selectedPixel = null;
    previous = null;

    document.querySelectorAll('input[name="prediction"]').forEach(e => { e.checked = false; });
    $('compare').disabled = true;
    $('prediction-status').textContent = '';

    const dark = base.filter(v => !v).length;
    $('combination').textContent = 'C(' + dark + ', 20) = ' + combination(dark, 20).toString();
    $('answer2').textContent =
      'Neuron chase needs zero model passes to rank pixels. The gradient needs one forward pass and one backward pass. Trying every pixel needs ' +
      dark + ' forward passes for this sample\'s ' + dark + ' dark pixels. Ranking cost and pixels needed measure different things.';
    render();
  }

  function addPixel(j) {
    if (ready) {
      $('view-label').textContent = 'Stage 2 is active. Press Return to manual editing if you want to paint pixels by hand.';
      return;
    }
    if (x[j]) return;
    previous = currentResult;
    selectedPixel = j;
    x[j] = 1;
    currentResult = Attack.forward(net, x);
    render();
  }

  function advance(id, run) {
    if (!ready) return;
    const strategy = strategies.find(s => s[0] === id);
    if (!plans[id]) {
      const start = performance.now();
      const ranking = strategy[2](net, base);
      plans[id] = {
        ...ranking,
        ms: performance.now() - start,
        x: base.slice(),
        next: 0,
        verifyPasses: 0,
        result: baseResult,
        done: false
      };
    }
    const plan = plans[id];
    active = id;
    x = plan.x;

    do {
      if (plan.done) break;
      if (Attack.fooled(plan.result.p) || plan.next === plan.order.length) {
        plan.done = true;
        break;
      }
      previous = plan.result;
      selectedPixel = plan.order[plan.next++];
      x[selectedPixel] = 1;
      plan.result = Attack.forward(net, x);
      plan.verifyPasses++;
      plan.done = Attack.fooled(plan.result.p) || plan.next === plan.order.length;
    } while (run && !plan.done);

    currentResult = plan.result;
    render();
  }

  $('sample').addEventListener('change', resetCenterpiece);
  $('reset').addEventListener('click', resetCenterpiece);
  $('return-manual').addEventListener('click', resetCenterpiece);

  $('add-pixel').addEventListener('click', () => {
    if (!$('pixel-row').reportValidity() || !$('pixel-col').reportValidity()) return;
    addPixel((+$('pixel-row').value - 1) * 28 + +$('pixel-col').value - 1);
  });

  let painting = false;
  function paint(e) {
    const rect = $('edited').getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * 28);
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * 28);
    if (col >= 0 && col < 28 && row >= 0 && row < 28) addPixel(row * 28 + col);
  }
  $('edited').addEventListener('pointerdown', e => {
    painting = true;
    $('edited').setPointerCapture(e.pointerId);
    paint(e);
  });
  $('edited').addEventListener('pointermove', e => {
    if (painting) paint(e);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => {
    $('edited').addEventListener(type, () => { painting = false; });
  });

  document.querySelectorAll('[name="prediction"]').forEach(e => {
    e.addEventListener('change', () => { $('compare').disabled = false; });
  });

  $('compare').addEventListener('click', () => {
    const choice = document.querySelector('[name="prediction"]:checked');
    if (!choice) return;
    plans = {};
    ready = true;
    active = null;
    x = base.slice();
    currentResult = baseResult;
    selectedPixel = null;
    previous = null;
    $('prediction-status').textContent =
      'You predicted ' + strategies.find(s => s[0] === choice.value)[1] + '. Each strategy now starts with the untouched 3.';
    $('compare').disabled = true;
    render();
  });

  $('strategies').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) advance(b.dataset.strategy, b.dataset.action === 'run');
  });

  ['1', '2'].forEach(i => {
    document.querySelectorAll('[name="check' + i + '"]').forEach(e => {
      e.addEventListener('change', () => { $('reveal' + i).disabled = false; });
    });
    $('reveal' + i).addEventListener('click', () => { $('answer' + i).hidden = false; });
  });

  PAI.onAppearanceChange(() => {
    drawHeatmaps();
    render();
  });

  drawDigit($('hook-digit'), samples[0]);
  drawHeatmaps();
  resetCenterpiece();

  // Snapshots support numerical and browser regression checks.
  window.Week5 = {
    Attack,
    samples,
    snapshot: () => ({
      x: Array.from(x),
      base: Array.from(base),
      active,
      ready,
      plans,
      result: currentResult
    }),
    render
  };
})();
