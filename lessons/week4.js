/* Week 4 uses supplied illustrative ratings, not image extraction. */
(function () {
  'use strict';
  var boats = [
    {name: 'Open sailboat', x: .90, y: 0, label: true},
    {name: 'Sailboat with a cabin', x: .55, y: .65, label: true},
    {name: 'Cabin motorboat', x: .10, y: .90, label: false},
    {name: 'Motorboat with a tall antenna', x: .60, y: .95, label: false},
    {name: 'Boat 5', x: .82, y: .10, label: true},
    {name: 'Boat 6', x: .72, y: .43, label: true},
    {name: 'Boat 7', x: .40, y: .55, label: true},
    {name: 'Boat 8', x: .23, y: .76, label: true},
    {name: 'Boat 9', x: .08, y: .30, label: false},
    {name: 'Boat 10', x: .32, y: .18, label: false},
    {name: 'Boat 11', x: .74, y: .35, label: false},
    {name: 'Boat 12', x: .48, y: .66, label: false}
  ];
  var selected = 1;
  var start = [3, -2, -.5];
  function el(id) { return document.getElementById(id); }
  function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
  function score(boat, weights) { return weights[0] * boat.x + weights[1] * boat.y + weights[2]; }
  function probability(boat, weights) { return sigmoid(score(boat, weights)); }
  function label(yes) { return yes ? 'Sailboat' : 'Not a sailboat'; }
  function prediction(boat, weights) { return label(score(boat, weights) >= 0); }
  function signed(n) { return (n > 0 ? '+' : n < 0 ? '-' : '') + Math.abs(n).toFixed(2); }
  function signedOutput(id, n) {
    el(id).textContent = signed(n);
    el(id).className = n > 0 ? 'positive' : n < 0 ? 'negative' : 'neutral';
  }
  function silhouette(index) {
    var shape = '<path d="M12 76 L149 76 L131 94 L32 94 Z" fill="currentColor"/>';
    if (index === 0) {
      shape += '<path d="M77 12 V76 M71 18 L38 67 H71 Z M83 29 L112 67 H83 Z" fill="currentColor" stroke="currentColor" stroke-width="3"/>';
    }
    if (index === 1) {
      shape += '<path d="M77 29 V76 M71 34 L47 67 H71 Z M83 43 L104 67 H83 Z" fill="currentColor" stroke="currentColor" stroke-width="3"/>';
    }
    if (index === 1) {
      shape += '<path d="M96 55 H127 L140 73 H96 Z" fill="currentColor"/>';
      shape += '<path d="M104 59 H123 L130 67 H104 Z" fill="var(--card)"/>';
    }
    if (index > 1) {
      shape += '<path d="M76 42 H124 L144 73 H76 Z" fill="currentColor"/><path d="M84 48 H119 L129 62 H84 Z" fill="var(--card)"/>';
    }
    if (index === 2) shape += '<path d="M115 55 V44" stroke="currentColor" stroke-width="3"/>';
    if (index === 3) shape += '<path d="M112 55 V12 M108 18 H116" stroke="currentColor" stroke-width="3"/>';
    return '<svg viewBox="0 0 160 110" role="img" aria-label="' + boats[index].name + ' silhouette">' + shape + '</svg>';
  }
  el('hook-boats').innerHTML = [0, 2, 1].map(function (i) {
    return '<figure>' + silhouette(i) + '<figcaption>' + boats[i].name + '</figcaption></figure>';
  }).join('');
  el('boat-options').innerHTML = boats.slice(0, 4).map(function (boat, i) {
    return '<label class="boat-card">' + silhouette(i) + '<span><input type="radio" name="boat" value="' + i + '"' + (i === selected ? ' checked' : '') + '><strong>' + boat.name + '</strong></span><span>Known label: ' + label(boat.label) + '</span><span>Mast ' + boat.x.toFixed(2) + ' · Cabin ' + boat.y.toFixed(2) + '</span></label>';
  }).join('');

  // Clip the unit square by the score half-plane. This handles vertical lines too.
  function region(weights, positive) {
    var square = [[0, 0], [1, 0], [1, 1], [0, 1]];
    var points = [];
    function value(p) { return (weights[0] * p[0] + weights[1] * p[1] + weights[2]) * (positive ? 1 : -1); }
    square.forEach(function (a, i) {
      var b = square[(i + 1) % 4], va = value(a), vb = value(b);
      if (va >= 0) points.push(a);
      if ((va < 0 && vb > 0) || (va > 0 && vb < 0)) {
        var t = va / (va - vb);
        points.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
      }
    });
    return points;
  }
  function plot(id, weights, compare) {
    var svg = el(id), tokens = PAI.getTokens();
    svg.querySelectorAll('g').forEach(function (g) { g.remove(); });
    var ns = 'http://www.w3.org/2000/svg';
    var group = document.createElementNS(ns, 'g');
    svg.appendChild(group);
    function node(tag, attrs, text) {
      var n = document.createElementNS(ns, tag);
      Object.keys(attrs).forEach(function (key) { n.setAttribute(key, attrs[key]); });
      if (text !== undefined) n.textContent = text;
      group.appendChild(n);
      return n;
    }
    function X(x) { return 54 + 340 * x; }
    function Y(y) { return 365 - 320 * y; }
    function area(points) {
      return Math.abs(points.reduce(function (sum, a, i) {
        var b = points[(i + 1) % points.length];
        return sum + a[0] * b[1] - b[0] * a[1];
      }, 0)) / 2;
    }
    node('rect', {x:54, y:45, width:340, height:320, fill:tokens.card, stroke:tokens.line});
    [true, false].forEach(function (yes) {
      var points = region(weights, yes);
      if (area(points) < 1e-10 || (!yes && weights.every(function (w) { return w === 0; }))) return;
      node('polygon', {points:points.map(function (p) { return X(p[0]) + ',' + Y(p[1]); }).join(' '), fill:yes ? tokens.positive : tokens.negative, opacity:.12});
      var center = points.reduce(function (a, p) { return [a[0] + p[0] / points.length, a[1] + p[1] / points.length]; }, [0, 0]);
      node('text', {x:X(center[0]), y:Y(center[1]), fill:tokens.ink, 'font-size':11, 'text-anchor':'middle', 'paint-order':'stroke', stroke:tokens.card, 'stroke-width':3}, yes ? 'Predict sailboat' : 'Predict not a sailboat');
    });
    [0, .25, .5, .75, 1].forEach(function (tick) {
      node('line', {x1:X(tick), x2:X(tick), y1:45, y2:365, stroke:tokens.line, 'stroke-opacity':.5});
      node('line', {x1:54, x2:394, y1:Y(tick), y2:Y(tick), stroke:tokens.line, 'stroke-opacity':.5});
      node('text', {x:X(tick), y:385, fill:tokens.muted, 'text-anchor':'middle', 'font-size':12}, tick);
      node('text', {x:44, y:Y(tick) + 4, fill:tokens.muted, 'text-anchor':'end', 'font-size':12}, tick);
    });
    function boundary(w, dashed) {
      if (w[0] === 0 && w[1] === 0) return;
      var points = region(w, true).filter(function (p) { return Math.abs(w[0] * p[0] + w[1] * p[1] + w[2]) < 1e-9; });
      if (points.length < 2) return;
      node('line', {x1:X(points[0][0]), y1:Y(points[0][1]), x2:X(points[points.length - 1][0]), y2:Y(points[points.length - 1][1]), stroke:tokens.ink, 'stroke-width':2, 'stroke-dasharray':dashed ? '7 5' : '', 'data-boundary':dashed ? 'after' : 'current'});
    }
    boundary(weights, false);
    if (compare) boundary(compare, true);
    boats.forEach(function (boat, i) {
      var x = X(boat.x), y = Y(boat.y);
      var attrs = {fill:tokens.card, stroke:tokens.ink, 'stroke-width':2};
      if (boat.label) node('circle', Object.assign({cx:x, cy:y, r:5}, attrs));
      else node('rect', Object.assign({x:x - 5, y:y - 5, width:10, height:10}, attrs));
      if (i === selected && !compare) node('circle', {cx:x, cy:y, r:10, fill:'none', stroke:tokens.accent, 'stroke-width':3});
      node('text', {x:x + 8, y:y - 8, fill:tokens.ink, 'font-size':12, 'paint-order':'stroke', stroke:tokens.card, 'stroke-width':3}, i + 1);
    });
    node('text', {x:224, y:414, fill:tokens.ink, 'text-anchor':'middle', 'font-size':13}, 'Mast prominence');
    node('text', {x:224, y:20, fill:tokens.ink, 'text-anchor':'middle', 'font-size':13}, 'Cabin prominence increases upward');
  }
  function update() {
    var weights = ['w1', 'w2', 'bias'].map(function (id) { return Number(el(id).value); });
    weights.forEach(function (w, i) { signedOutput(['w1-value', 'w2-value', 'bias-value'][i], w); });
    var boat = boats[selected], z = score(boat, weights), p = sigmoid(z);
    el('selected-name').textContent = boat.name;
    el('selected-ratings').textContent = 'Mast ' + boat.x.toFixed(2) + ' · Cabin ' + boat.y.toFixed(2) + ' · Known label: ' + label(boat.label);
    signedOutput('mast-term', weights[0] * boat.x);
    signedOutput('cabin-term', weights[1] * boat.y);
    signedOutput('bias-term', weights[2]);
    el('score').textContent = signed(z);
    el('probability').textContent = p.toFixed(3);
    el('prob-marker').textContent = p.toFixed(3);
    el('prob-marker').style.left = (p * 100) + '%';
    el('prediction').textContent = 'Prediction: ' + prediction(boat, weights) + '. Fixed threshold: 0.5.';
    el('boat-results').innerHTML = boats.map(function (b, i) {
      return '<tr><th scope="row">' + (i + 1) + '. ' + b.name + '</th><td>' + label(b.label) + '</td><td>' + b.x.toFixed(2) + '</td><td>' + b.y.toFixed(2) + '</td><td>' + probability(b, weights).toFixed(3) + '</td><td>' + prediction(b, weights) + '</td></tr>';
    }).join('');
    var cornerScores = [[0,0],[0,1],[1,0],[1,1]].map(function (p) { return score({x:p[0], y:p[1]}, weights); });
    if (weights[0] === 0 && weights[1] === 0) {
      el('region-note').textContent = 'Constant probability ' + sigmoid(weights[2]).toFixed(3) + '. Predict ' + label(weights[2] >= 0).toLowerCase() + ' everywhere. No boundary line.';
    } else if (Math.min.apply(null, cornerScores) > 0 || Math.max.apply(null, cornerScores) < 0) {
      el('region-note').textContent = 'The boundary lies outside the plot. Predict ' + label(cornerScores[0] >= 0).toLowerCase() + ' everywhere in the visible region.';
    } else {
      el('region-note').textContent = 'The line separates the predicted regions. Shapes show known labels, which can disagree with predictions.';
    }
    plot('feature-plot', weights);
    plot('bias-plot', start, [3, -2, 0]);
  }
  function buildReveals() {
    el('weight-reveal').innerHTML = [1, 0].map(function (i) {
      var b = boats[i];
      return '<h3>' + b.name + '</h3><p>Before: mast ' + signed(3 * b.x) + ', cabin ' + signed(-2 * b.y) + ', bias -0.50. Score ' + signed(score(b, start)) + '. Probability ' + probability(b, start).toFixed(3) + '.</p><p>After: mast ' + signed(3 * b.x) + ', cabin ' + signed(-3 * b.y) + ', bias -0.50. Score ' + signed(score(b, [3,-3,-.5])) + '. Probability ' + probability(b, [3,-3,-.5]).toFixed(3) + '.</p>';
    }).join('');
    var flips = [];
    el('bias-reveal').innerHTML = boats.map(function (b) {
      var changed = prediction(b, start) !== prediction(b, [3,-2,0]);
      if (changed) flips.push(b.name);
      return '<tr><th scope="row">' + b.name + '</th><td>' + probability(b, start).toFixed(3) + '</td><td>' + probability(b, [3,-2,0]).toFixed(3) + '</td><td>' + prediction(b, start) + '</td><td>' + prediction(b, [3,-2,0]) + '</td><td>' + (changed ? 'Changed' : 'Unchanged') + '</td></tr>';
    }).join('');
    el('flip-list').textContent = 'These boats change from not a sailboat to sailboat: ' + flips.join(', ') + '.';
    var p1 = probability(boats[0], start), p2 = 1 - probability(boats[2], start);
    var lp1 = Math.log(p1), lp2 = Math.log(p2);
    var average = (lp1 + lp2) / 2;
    el('likelihood-example').innerHTML = '<p>Using these two boats, the average of the natural logs is (' + lp1.toFixed(4) + ' &minus; ' + Math.abs(lp2).toFixed(4) + ') / 2 = ' + average.toFixed(4) + '. Its exponential is ' + Math.exp(average).toFixed(4) + ', the square root of the product of their known-label probabilities.</p>';
  }
  document.querySelectorAll('input[name="boat"]').forEach(function (input) {
    input.addEventListener('change', function () { selected = Number(input.value); update(); });
  });
  ['w1', 'w2', 'bias'].forEach(function (id) { el(id).addEventListener('input', update); });
  el('reset').addEventListener('click', function () {
    ['w1', 'w2', 'bias'].forEach(function (id, i) { el(id).value = start[i]; });
    selected = 1;
    document.querySelector('input[name="boat"][value="1"]').checked = true;
    update();
  });
  buildReveals();
  update();
  PAI.onAppearanceChange(update);
})();
