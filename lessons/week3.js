/* Week 3. Classic scripts and procedural geometry keep disk loading offline. */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const towers = [[-24, -18], [24, -18], [0, 24]];
  const counts = [16, 32, 43];

  let enabled = 1;
  let tokens;
  let timer = null;
  let guide = -1;
  let guideDone = false;
  let view3;
  let gridMax = 0;

  const warm = {
    point: null,
    trail: [],
    reveal: false,
    delta: ''
  };

  const phone = {
    point: [-12, 0],
    start: [-12, 0],
    trail: [[-12, 0]],
    truth: false,
    delta: '',
    reason: 'Choose a candidate to compare its rates.'
  };

  function terrain(x, y) {
    const a = 11 * Math.exp(-((x + 18) ** 2 + (y - 3) ** 2) / 170);
    const b = 16 * Math.exp(-((x - 18) ** 2 + (y - 1) ** 2) / 140);
    return {
      score: a + b,
      grad: [
        (-2 * (x + 18) * a) / 170 - (2 * (x - 18) * b) / 140,
        (-2 * (y - 3) * a) / 170 - (2 * (y - 1) * b) / 140
      ]
    };
  }

  // Same height-inclusive decreasing logistic reception model as the author's asset.
  function towerModel(x, y, i, k = counts[i]) {
    const [tx, ty] = towers[i];
    const d = Math.hypot(x - tx, y - ty, 8);
    const z = (d - 32) / 4.5;
    const p = 1 / (1 + Math.exp(z));
    const softplus = v => Math.max(v, 0) + Math.log1p(Math.exp(-Math.abs(v)));
    const f = (50 * p - k) / (4.5 * d);
    return {
      p,
      score: -k * softplus(z) - (50 - k) * softplus(-z),
      grad: [f * (x - tx), f * (y - ty)]
    };
  }

  function model(x, y, n = enabled, ks = counts) {
    let score = 0;
    const grad = [0, 0];
    for (let i = 0; i < n; i++) {
      const t = towerModel(x, y, i, ks[i]);
      score += t.score;
      grad[0] += t.grad[0];
      grad[1] += t.grad[1];
    }
    return { score, grad };
  }

  const fmt = (v, n = 3) => v.toFixed(n);
  const pair = p => '(' + p.map(v => fmt(v)).join(', ') + ')';

  function compassDirection(grad) {
    const mag = Math.hypot(grad[0], grad[1]);
    if (mag < 1e-6) return 'Flat';
    const angle = (Math.atan2(grad[1], grad[0]) * 180) / Math.PI;
    const normalized = ((angle % 360) + 360) % 360;
    const names = [
      'East',
      'Northeast',
      'North',
      'Northwest',
      'West',
      'Southwest',
      'South',
      'Southeast'
    ];
    return names[Math.round(normalized / 45) % 8];
  }

  function computedPath(start, fn, alpha, limit = 300) {
    let p = start.slice();
    const path = [p];
    for (let j = 0; j < limit; j++) {
      const g = fn(...p).grad;
      if (Math.hypot(...g) < 0.001) break;
      p = [p[0] + alpha * g[0], p[1] + alpha * g[1]];
      if (p.some(v => Math.abs(v) > 40)) break;
      path.push(p);
    }
    return path;
  }

  function coordinateForm(prefix, fn) {
    $(prefix + '-form').onsubmit = e => {
      e.preventDefault();
      fn([Number($(prefix + '-x').value), Number($(prefix + '-y').value)]);
    };
  }

  function canvasMap(id, fn) {
    $(id).onclick = e => {
      const r = e.target.getBoundingClientRect();
      fn([
        ((e.clientX - r.left) / r.width) * 80 - 40,
        40 - ((e.clientY - r.top) / r.height) * 80
      ]);
    };
  }

  function arrow(ctx, a, b, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.stroke();

    const t = Math.atan2(b[1] - a[1], b[0] - a[0]);
    ctx.beginPath();
    ctx.moveTo(...b);
    ctx.lineTo(b[0] - 10 * Math.cos(t - 0.4), b[1] - 10 * Math.sin(t - 0.4));
    ctx.lineTo(b[0] - 10 * Math.cos(t + 0.4), b[1] - 10 * Math.sin(t + 0.4));
    ctx.fill();
  }

  function dot(c, p, label, color, square = false) {
    c.fillStyle = color;
    c.strokeStyle = tokens.card;
    c.lineWidth = 2;
    c.beginPath();
    if (square) {
      c.rect(p[0] - 5, p[1] - 5, 10, 10);
    } else {
      c.arc(...p, 5, 0, Math.PI * 2);
    }
    c.fill();
    c.stroke();

    if (label) {
      c.font = 'bold 13px system-ui';
      c.fillStyle = tokens.ink;
      c.fillText(label, p[0] + 8, p[1] - 7);
    }
  }

  function mapDraw(id, fn, paths = [], point = null, gradient = null, n = 0, truth = false, ks = counts) {
    const cv = $(id);
    const c = cv.getContext('2d');
    const w = cv.width;
    const h = cv.height;
    const xy = p => [((p[0] + 40) / 80) * w, ((40 - p[1]) / 80) * h];

    c.fillStyle = tokens.card;
    c.fillRect(0, 0, w, h);

    let max = -Infinity;
    let min = Infinity;
    const vals = [];
    for (let j = 0; j < 60; j++) {
      for (let i = 0; i < 60; i++) {
        const v = fn(-40 + ((i + 0.5) * 80) / 60, 40 - ((j + 0.5) * 80) / 60).score;
        vals.push(v);
        max = Math.max(max, v);
        min = Math.min(min, v);
      }
    }

    // Use unsigned chart accent color for terrain/score intensity rather than signed-weight teal.
    vals.forEach((v, k) => {
      const t = (v - min) / (max - min || 1);
      c.globalAlpha = 0.06 + 0.64 * t;
      c.fillStyle = tokens.chart1;
      const i = k % 60;
      const j = Math.floor(k / 60);
      c.fillRect(
        Math.round((i * w) / 60),
        Math.round((j * h) / 60),
        Math.round(((i + 1) * w) / 60) - Math.round((i * w) / 60),
        Math.round(((j + 1) * h) / 60) - Math.round((j * h) / 60)
      );
    });
    c.globalAlpha = 1;

    c.strokeStyle = tokens.line;
    c.lineWidth = 1;
    for (let q = -20; q <= 20; q += 20) {
      c.beginPath();
      c.moveTo(...xy([q, -40]));
      c.lineTo(...xy([q, 40]));
      c.moveTo(...xy([-40, q]));
      c.lineTo(...xy([40, q]));
      c.stroke();
    }

    for (let i = 0; i < n; i++) {
      const pos = xy(towers[i]);
      const d = 32 + 4.5 * Math.log(50 / ks[i] - 1);
      const r = Math.sqrt(d * d - 64);
      c.save();
      c.strokeStyle = [tokens.chart1, tokens.chart2, tokens.chart3][i];
      c.lineWidth = 2;
      c.setLineDash([7, 4]);
      c.beginPath();
      c.ellipse(...pos, (r * w) / 80, (r * h) / 80, 0, 0, Math.PI * 2);
      c.stroke();
      c.restore();

      c.fillStyle = tokens.ink;
      c.beginPath();
      c.moveTo(pos[0], pos[1] - 7);
      c.lineTo(pos[0] - 6, pos[1] + 5);
      c.lineTo(pos[0] + 6, pos[1] + 5);
      c.closePath();
      c.fill();
      c.font = 'bold 14px system-ui';
      c.fillText('ABC'[i], pos[0] + 9, pos[1] + 5);
    }

    paths.forEach((path, i) => {
      c.strokeStyle = i ? tokens.negative : tokens.ink;
      c.lineWidth = 2.5;
      c.beginPath();
      path.forEach((p, j) => c[j ? 'lineTo' : 'moveTo'](...xy(p)));
      c.stroke();
      if (path.length) {
        dot(c, xy(path[path.length - 1]), paths.length > 1 ? 'Fit ' + (i + 1) : '', c.strokeStyle);
      }
    });

    if (point) {
      dot(c, xy(point), '', tokens.negative);
      if (gradient && Math.hypot(...gradient) > 0.00001) {
        const g = Math.hypot(...gradient);
        arrow(
          c,
          xy(point),
          xy([point[0] + (gradient[0] / g) * 8, point[1] + (gradient[1] / g) * 8]),
          tokens.negative
        );
      }
    }

    if (truth) {
      dot(c, xy([4, 2]), 'Phone', tokens.chart4, true);
    }

    c.fillStyle = tokens.ink;
    c.font = '12px system-ui';
    c.fillText('x increases right', 8, h - 9);
    c.fillText('y increases up', 8, 17);
  }

  function isoDraw(id, heightFn, paths = [], point = null, gradient = null, n = 0, truth = false, span = 40) {
    const cv = $(id);
    const c = cv.getContext('2d');
    const w = cv.width;
    const h = cv.height;
    const proj = (x, y, z) => [
      w / 2 + ((x - y) * w) / (span * 4.5),
      h * 0.62 + ((x + y) * h) / (span * 6.4) - (z * h) / 62
    ];

    c.fillStyle = tokens.card;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = tokens.chart1;
    c.lineWidth = 1;

    for (let j = 0; j <= 28; j++) {
      const y = -span + (j * span) / 14;
      c.beginPath();
      for (let i = 0; i <= 28; i++) {
        const x = -span + (i * span) / 14;
        c[i ? 'lineTo' : 'moveTo'](...proj(x, y, heightFn(x, y)));
      }
      c.stroke();
    }

    for (let i = 0; i <= 28; i++) {
      const x = -span + (i * span) / 14;
      c.beginPath();
      for (let j = 0; j <= 28; j++) {
        const y = -span + (j * span) / 14;
        c[j ? 'lineTo' : 'moveTo'](...proj(x, y, heightFn(x, y)));
      }
      c.stroke();
    }

    paths.forEach(path => {
      c.strokeStyle = tokens.negative;
      c.lineWidth = 3;
      c.beginPath();
      path.forEach((p, j) => c[j ? 'lineTo' : 'moveTo'](...proj(...p, heightFn(...p) + 0.3)));
      c.stroke();
    });

    for (let i = 0; i < n; i++) {
      const [x, y] = towers[i];
      arrow(c, proj(x, y, 0), proj(x, y, 8), tokens.ink);
      dot(c, proj(x, y, 8), 'ABC'[i], tokens.ink);
    }

    if (point) {
      const label = paths.length && paths[0].length > 1 ? 'Estimate' : 'Candidate';
      dot(c, proj(...point, heightFn(...point) + 0.5), label, tokens.negative);
      if (gradient && Math.hypot(...gradient) > 0.00001) {
        const len = Math.hypot(...gradient);
        const nextPt = [point[0] + (gradient[0] / len) * 7, point[1] + (gradient[1] / len) * 7];
        arrow(
          c,
          proj(...point, heightFn(...point) + 1),
          proj(...nextPt, heightFn(...nextPt) + 1),
          tokens.negative
        );
      }
    }

    if (truth) {
      dot(c, proj(4, 2, heightFn(4, 2) + 1), 'Phone', tokens.chart4, true);
    }
  }

  function init3D() {
    const canvas = $('phone-3d');
    let gl = null;
    try {
      gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    } catch (e) {
      // Isometric canvas fallback remains available.
    }
    if (!gl) {
      const replacement = canvas.cloneNode();
      canvas.replaceWith(replacement);
      $('render-mode').textContent = 'Fixed isometric canvas view. WebGL is unavailable.';
      return;
    }

    const renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: true });
    renderer.setSize(600, 420, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 600 / 420, 0.1, 500);
    camera.position.set(66, 62, 74);
    camera.lookAt(0, 6, 0);

    const geometry = new THREE.PlaneGeometry(80, 80, 50, 50);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.55 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(1.25, 12, 8),
      new THREE.MeshBasicMaterial({ depthTest: false })
    );
    marker.renderOrder = 3;
    scene.add(marker);

    const truthMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 2.3, 2.3),
      new THREE.MeshBasicMaterial({ depthTest: false })
    );
    truthMesh.renderOrder = 4;
    scene.add(truthMesh);

    const towerMeshes = towers.map(t => {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.65, 8, 8),
        new THREE.MeshBasicMaterial({ depthTest: false })
      );
      m.renderOrder = 2;
      m.position.set(t[0], 4, t[1]);
      scene.add(m);
      return m;
    });

    const pathGeo = new THREE.BufferGeometry();
    pathGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(903), 3));
    const line = new THREE.Line(pathGeo, new THREE.LineBasicMaterial({ depthTest: false }));
    line.renderOrder = 3;
    scene.add(line);

    const gradArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 6);
    gradArrow.line.material.depthTest = false;
    gradArrow.cone.material.depthTest = false;
    gradArrow.renderOrder = 4;
    scene.add(gradArrow);

    view3 = {
      draw(heightFn) {
        scene.background = new THREE.Color(tokens.card);
        material.color.set(tokens.chart1);
        marker.material.color.set(tokens.negative);
        truthMesh.material.color.set(tokens.chart4);
        line.material.color.set(tokens.negative);

        const pos = geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          pos.setY(i, heightFn(pos.getX(i), pos.getZ(i)));
        }
        pos.needsUpdate = true;
        geometry.computeBoundingSphere();

        const p = phone.point;
        marker.position.set(p[0], heightFn(...p) + 1, p[1]);
        truthMesh.visible = phone.truth;
        truthMesh.position.set(4, heightFn(4, 2) + 1, 2);

        towerMeshes.forEach((m, i) => {
          m.visible = i < enabled;
          m.material.color.set([tokens.chart1, tokens.chart2, tokens.chart3][i]);
        });

        const buf = pathGeo.attributes.position;
        phone.trail.forEach((pt, i) => buf.setXYZ(i, pt[0], heightFn(...pt) + 0.6, pt[1]));
        buf.needsUpdate = true;
        pathGeo.setDrawRange(0, phone.trail.length);
        pathGeo.computeBoundingSphere();

        const g = model(...p).grad;
        const len = Math.hypot(...g);
        gradArrow.visible = len > 0.00001;
        if (len > 0.00001) {
          gradArrow.position.copy(marker.position);
          gradArrow.setDirection(new THREE.Vector3(g[0] / len, 0, g[1] / len));
          gradArrow.setColor(tokens.negative);
          gradArrow.setLength(8, 2, 1);
        }
        renderer.render(scene, camera);
      }
    };

    $('render-mode').textContent = 'Fixed three-dimensional score view. Towers have height 8.';
  }

  function warmDraw() {
    const p = warm.point;
    const v = p ? terrain(...p) : null;
    mapDraw('warm-map', terrain, [warm.trail], p, warm.reveal && v ? v.grad : null);
    isoDraw('warm-3d', (x, y) => terrain(x, y).score, [warm.trail], p, warm.reveal && v ? v.grad : null);

    if (!p) {
      $('warm-output').textContent = 'Place a start on the map or use a preset.';
    } else if (!warm.reveal) {
      const lines = ['Position ' + pair(p) + '. Height ' + fmt(v.score) + '.'];
      if (warm.delta) lines.push(warm.delta);
      lines.push('Predict a direction, then reveal the gradient.');
      $('warm-output').textContent = lines.join('\n');
    } else {
      const actualDir = compassDirection(v.grad);
      const predicted = $('warm-predict').value;
      const comparison = actualDir === 'Flat'
        ? 'The slope is nearly flat here.'
        : predicted === actualDir
          ? 'The gradient points ' + actualDir.toLowerCase() + '. Your prediction matches.'
          : 'The gradient points ' + actualDir.toLowerCase() + '. You predicted ' + predicted.toLowerCase() + '.';
      const lines = ['Position ' + pair(p) + '. Height ' + fmt(v.score) + '.'];
      if (warm.delta) lines.push(warm.delta);
      lines.push('Gradient ' + pair(v.grad) + '. Magnitude ' + fmt(Math.hypot(...v.grad)) + '. ' + comparison);
      $('warm-output').textContent = lines.join('\n');
    }

    $('warm-reveal').disabled = !p || !$('warm-predict').value;
  }

  function moveWarm(p) {
    const old = warm.point;
    warm.delta = old
      ? 'Distance moved ' + fmt(Math.hypot(p[0] - old[0], p[1] - old[1])) + '. Height change ' + fmt(terrain(...p).score - terrain(...old).score) + '.'
      : '';
    warm.point = p;
    warm.trail.push(p);
    warm.reveal = false;
    $('warm-predict').value = '';
    warmDraw();
  }

  function updateGrid() {
    gridMax = -Infinity;
    for (let x = -40; x <= 40; x += 2) {
      for (let y = -40; y <= 40; y += 2) {
        gridMax = Math.max(gridMax, model(x, y).score);
      }
    }
  }

  function height(x, y) {
    return Math.max(0, 30 + (model(x, y).score - gridMax) / 8);
  }

  function drawPhone() {
    const p = phone.point;
    const v = model(...p);
    mapDraw('phone-map', model, [phone.trail], p, enabled === 3 ? v.grad : null, enabled, phone.truth);
    if (view3) {
      view3.draw(height);
    } else {
      isoDraw('phone-3d', height, [phone.trail], p, enabled === 3 ? v.grad : null, enabled, phone.truth);
    }

    $('rate-rows').innerHTML = towers.slice(0, enabled).map((_, i) => {
      const t = towerModel(...p, i);
      return '<tr><th>' + 'ABC'[i] + '</th><td>' + counts[i] + '/50 = ' + fmt(counts[i] / 50, 2) + '</td><td>' + fmt(t.p, 4) + '</td><td>' + fmt(t.score) + '</td></tr>';
    }).join('');

    const positionLabel = phone.trail.length > 1 ? 'Fitted estimate' : 'Candidate position';
    $('phone-output').textContent =
      positionLabel + ' ' + pair(p) + '.\n' +
      'Combined log-likelihood ' + fmt(v.score) + '.\n' +
      'Gradient ' + pair(v.grad) + '. Magnitude ' + fmt(Math.hypot(...v.grad)) + '.\n' +
      'Steps ' + (phone.trail.length - 1) + '. ' + phone.delta;

    $('stop-reason').textContent = phone.reason;
    $('truth').hidden = !phone.truth;
    $('truth').textContent =
      'Simulated phone (4, 2). ' + positionLabel + ' ' + pair(p) +
      '. Distance between them ' + fmt(Math.hypot(p[0] - 4, p[1] - 2)) + '.';

    $('step').disabled = enabled !== 3 || timer !== null;
    $('run').disabled = enabled !== 3 || timer !== null;
    $('stop').disabled = timer === null;

    drawAxes(v.grad);
  }

  function stop(reason) {
    if (timer !== null) clearInterval(timer);
    timer = null;
    if (reason) phone.reason = reason;
    drawPhone();
  }

  function resetPhone(p = phone.start) {
    stop();
    if (guide > 0) {
      guideDone = false;
      $('guide-next').disabled = true;
      $('guide-feedback').textContent = 'Complete this action before continuing.';
    }
    phone.point = p.slice();
    phone.start = p.slice();
    phone.trail = [p.slice()];
    phone.truth = false;
    phone.delta = '';
    phone.reason = 'Start selected. The trail has no moves yet.';
    drawPhone();
  }

  function candidate(p) {
    resetPhone(p);
    $('phone-x').value = fmt(p[0]);
    $('phone-y').value = fmt(p[1]);
    if (guide === 1 && Math.hypot(p[0] + 24, p[1] + 18) < 12) {
      completeGuide('The nearby candidate has a high expected receipt rate.');
    }
    if (guide === 2 && Math.hypot(p[0] + 24, p[1] + 18) > 33) {
      completeGuide('The expected rate falls with distance. The dashed ring matches 16 of 50.');
    }
    if (guide === 5) {
      completeGuide('The arrow shows the gradient at your chosen start.');
    }
  }

  function setTowers(n) {
    stop();
    enabled = n;
    $('tower-b').setAttribute('aria-pressed', String(n >= 2));
    $('tower-b').textContent = n >= 2 ? 'Remove Tower B and C' : 'Add Tower B · 32 of 50';
    $('tower-c').disabled = n < 2;
    $('tower-c').setAttribute('aria-pressed', String(n === 3));
    $('tower-c').textContent = n === 3 ? 'Remove Tower C' : 'Add Tower C · 43 of 50';
    updateGrid();
    resetPhone();
  }

  function step() {
    const a = Number($('alpha').value);
    if (!Number.isFinite(a) || a < 0.01 || a > 100) {
      stop('Choose a step size between 0.01 and 100.');
      return false;
    }

    const p = phone.point;
    const v = model(...p);
    if (Math.hypot(...v.grad) < 0.001) {
      stop('The gradient is small. This stopping cue does not certify a maximum.');
      return false;
    }
    if (phone.trail.length >= 301) {
      stop('The run reached the 300-step limit. The endpoint remains visible.');
      return false;
    }

    const next = p.map((coord, i) => coord + a * v.grad[i]);
    if (next.some(coord => Math.abs(coord) > 40)) {
      stop('The proposed step leaves the map. No clipped move was taken. Reduce the step size.');
      return false;
    }

    phone.point = next;
    phone.trail.push(next);
    phone.delta =
      'Distance moved ' + fmt(Math.hypot(next[0] - p[0], next[1] - p[1])) +
      '. Score change ' + fmt(model(...next).score - v.score) + '.';
    phone.reason = 'The endpoint is the current fitted estimate.';
    drawPhone();

    if (guide === 6) {
      completeGuide('The results show the actual move distance and score change.');
    }
    return true;
  }

  function run() {
    if (timer !== null || enabled !== 3) return;
    phone.reason = 'The climb is running.';
    timer = setInterval(() => {
      if (!step() && guide === 7) {
        completeGuide('The run stopped. Its fitted endpoint and trail remain visible. Reveal the phone when ready.');
      }
    }, 30);
    drawPhone();
  }

  function drawAxes(g) {
    const c = $('axis-map').getContext('2d');
    c.fillStyle = tokens.card;
    c.fillRect(0, 0, 420, 260);
    c.strokeStyle = tokens.line;
    c.beginPath();
    c.moveTo(10, 130);
    c.lineTo(410, 130);
    c.moveTo(210, 10);
    c.lineTo(210, 250);
    c.stroke();

    const s = 90 / Math.max(1, ...g.map(Math.abs));
    arrow(c, [210, 130], [210 + g[0] * s, 130], tokens.positive);
    arrow(c, [210, 130], [210, 130 - g[1] * s], tokens.negative);

    c.fillStyle = tokens.ink;
    c.font = '15px system-ui';
    c.fillText('x', 395, 150);
    c.fillText('y', 225, 20);

    $('axis-values').textContent =
      'At ' + pair(phone.point) + ', the x partial derivative is ' + fmt(g[0]) +
      '. The y partial derivative is ' + fmt(g[1]) + '.';
  }

  const instructions = [
    ["Read Tower A's 16 receipts out of 50 sent packets.", 'tower-controls', 'rates'],
    ['Choose a candidate within 12 map units of Tower A. Compare expected and observed rates.', 'candidate-controls', 'phone-views', 'rates'],
    ['Choose a candidate more than 33 map units from Tower A. Inspect the matching-rate ring.', 'candidate-controls', 'phone-views', 'rates'],
    ['Add Tower B. Inspect the two rings and their high-score overlap.', 'tower-controls', 'phone-views', 'rates'],
    ['Add Tower C. Inspect the combined peak and the three contributions.', 'tower-controls', 'phone-views', 'rates'],
    ['Choose an ascent start on the map or with coordinates. Inspect its gradient arrow.', 'candidate-controls', 'phone-views', 'phone-results'],
    ['Choose a step size and press Step. Compare distance moved and score change.', 'ascent-controls', 'phone-views', 'phone-results'],
    ['Press Run. Wait for a stop or press Stop. Inspect the endpoint, then choose whether to reveal the simulated phone.', 'ascent-controls', 'phone-views', 'phone-results']
  ];

  function completeGuide(message) {
    guideDone = true;
    $('guide-feedback').textContent = message;
    $('guide-next').disabled = false;
  }

  function guideStep(i) {
    stop();
    guide = i;
    guideDone = i === 0;
    $('guide').hidden = false;
    $('phone').classList.add('guided');
    document.querySelectorAll('.guide-piece').forEach(e => {
      e.classList.toggle('spot', instructions[i].slice(1).includes(e.id));
    });
    $('guide-instruction').textContent = 'Step ' + (i + 1) + ' of 8. ' + instructions[i][0];
    $('guide-feedback').textContent = i === 0
      ? 'These synthetic rounded expected counts stay fixed.'
      : 'Complete this action before continuing.';
    $('guide-back').disabled = i === 0;
    $('guide-next').disabled = !guideDone;
    $('guide-next').textContent = i === 7 ? 'Finish guide' : 'Next';
  }

  function exitGuide() {
    guide = -1;
    stop();
    $('guide').hidden = true;
    $('phone').classList.remove('guided');
    document.querySelectorAll('.spot').forEach(e => e.classList.remove('spot'));
    $('guide-open').focus();
  }

  function comparisonDraw() {
    const a = computedPath([-20, -12], terrain, 1);
    const b = computedPath([20, -12], terrain, 1);
    mapDraw('paths-map', terrain, [a, b]);
    $('paths-answer').textContent =
      'The west start ends at ' + pair(a.at(-1)) + ', height ' + fmt(terrain(...a.at(-1)).score) +
      '. The east start ends at ' + pair(b.at(-1)) + ', height ' + fmt(terrain(...b.at(-1)).score) +
      '. The valley separates their uphill paths.';

    const p = [-12, 0];
    const v = model(...p, 3);
    const small = p.map((coord, i) => coord + 0.5 * v.grad[i]);
    const big = p.map((coord, i) => coord + 5 * v.grad[i]);
    $('numeric-update').textContent =
      'With all towers enabled at (-12, 0), the gradient is ' + pair(v.grad) +
      '. With step size 0.5, the next point is ' + pair(small) + '.';
    $('step-answer').textContent =
      'At (-12, 0), the score is ' + fmt(v.score) +
      '. Step size 0.5 moves to ' + pair(small) + ' and scores ' + fmt(model(...small, 3).score) +
      '. Step size 5 moves to ' + pair(big) + ' and scores ' + fmt(model(...big, 3).score) +
      '. The larger step overshoots and lands lower.';

    mapDraw('rings-map', (x, y) => model(x, y, 3), [], null, null, 3);

    let seed = 2026;
    const noisy = towers.map((_, i) => {
      let k = 0;
      const prob = towerModel(4, 2, i).p;
      for (let j = 0; j < 50; j++) {
        seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
        if (seed / 4294967296 < prob) k++;
      }
      return k;
    });

    const fits = [counts, noisy].map(ks => computedPath([-12, 0], (x, y) => model(x, y, 3, ks), 0.5));
    mapDraw('noise-map', (x, y) => model(x, y, 3), fits.map(pt => [pt.at(-1)]), null, null, 0, true);
    $('noise-results').textContent =
      'Synthetic rounded expected counts 16, 32, 43 give Fit 1 ' + pair(fits[0].at(-1)) +
      '. Synthetic noisy counts ' + noisy.join(', ') + ' give Fit 2 ' + pair(fits[1].at(-1)) +
      '. The square is the simulated phone at (4, 2).';

    ['peak', 'valley', 'saddle'].forEach(name => {
      const fn = (x, y) => (
        name === 'peak' ? -x * x - y * y : name === 'valley' ? x * x + y * y : x * x - y * y
      ) * 4;
      isoDraw('mini-' + name, fn, [], [0, 0], null, 0, false, 2);
    });
  }

  function appearance() {
    tokens = PAI.getTokens();
    warmDraw();
    drawPhone();
    comparisonDraw();
  }

  $('warm-restart').onclick = () => {
    warm.point = null;
    warm.trail = [];
    warm.reveal = false;
    warm.delta = '';
    $('warm-predict').value = '';
    warmDraw();
  };

  $('start-left').onclick = () => {
    $('warm-restart').click();
    moveWarm([-20, -12]);
  };

  $('start-right').onclick = () => {
    $('warm-restart').click();
    moveWarm([20, -12]);
  };

  $('warm-predict').onchange = warmDraw;
  $('warm-reveal').onclick = () => {
    warm.reveal = true;
    warmDraw();
  };

  coordinateForm('warm', moveWarm);
  canvasMap('warm-map', moveWarm);
  coordinateForm('phone', candidate);
  canvasMap('phone-map', candidate);

  $('tower-b').onclick = () => {
    setTowers(enabled >= 2 ? 1 : 2);
    if (guide === 3 && enabled === 2) {
      completeGuide('Tower B adds its contribution. The two rings cross near high combined scores.');
    }
  };

  $('tower-c').onclick = () => {
    setTowers(enabled === 3 ? 2 : 3);
    if (guide === 4 && enabled === 3) {
      completeGuide('Three contributions now sum to the combined score.');
    }
  };

  $('step').onclick = step;
  $('run').onclick = run;
  $('stop').onclick = () => {
    stop('You stopped the climb. The endpoint and trail remain visible.');
    if (guide === 7) {
      completeGuide('The stopped endpoint remains visible. Reveal the phone when ready.');
    }
  };
  $('phone-restart').onclick = () => resetPhone();
  $('reveal-phone').onclick = () => {
    phone.truth = true;
    drawPhone();
  };

  $('guide-open').onclick = () => {
    setTowers(1);
    resetPhone([-12, 0]);
    guideStep(0);
    $('guide-next').focus();
  };

  $('guide-next').onclick = () => {
    if (!guideDone) return;
    if (guide === 7) {
      exitGuide();
      return;
    }
    guideStep(guide + 1);
  };

  $('guide-back').onclick = () => {
    const i = guide - 1;
    setTowers(i < 3 ? 1 : i === 3 ? 1 : i === 4 ? 2 : 3);
    resetPhone([-12, 0]);
    guideStep(i);
  };

  $('guide-exit').onclick = exitGuide;

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && guide >= 0) exitGuide();
  });

  // New actions invalidate a previously completed guide task, avoiding stale feedback.
  $('alpha').oninput = () => {
    if (guide === 6) {
      guideDone = false;
      $('guide-next').disabled = true;
    }
  };

  for (const item of document.querySelectorAll('.check-item')) {
    const select = item.querySelector('select');
    const answer = item.querySelector('.check-answer');
    const reveal = item.querySelector('.check-reveal');
    select.onchange = () => {
      answer.hidden = true;
      reveal.disabled = !select.value;
    };
    reveal.onclick = () => {
      answer.hidden = false;
    };
    item.querySelector('.check-reset').onclick = () => {
      select.value = '';
      reveal.disabled = true;
      answer.hidden = true;
    };
  }

  // Small public calculation seam for independent numerical QA, with no control over truth.
  window.Week3 = {
    terrain,
    towerModel,
    model,
    computedPath,
    state: () => ({
      enabled,
      point: phone.point.slice(),
      trail: phone.trail.map(p => p.slice()),
      running: timer !== null,
      truth: phone.truth,
      guide
    })
  };

  init3D();
  updateGrid();
  appearance();
  PAI.onAppearanceChange(appearance);
})();
