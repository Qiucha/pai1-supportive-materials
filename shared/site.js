/* Shared classic script for Probability for AI Lessons and Hub.
 * Works offline on file:// without ES modules or fetch.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var THEME_KEY = 'pai-theme';
  var PALETTE_KEY = 'pai-palette';
  var listeners = [];

  function safeGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      if (value == null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      // Ignore storage restrictions on file:// or private browsing.
    }
  }

  function notifyAppearance() {
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i]();
      } catch (e) {
        // Keep other listeners running.
      }
    }
  }

  function applyTheme(value) {
    if (value === 'light' || value === 'dark') {
      root.dataset.theme = value;
      safeSet(THEME_KEY, value);
    } else {
      delete root.dataset.theme;
      safeSet(THEME_KEY, null);
    }
    notifyAppearance();
  }

  function applyPalette(value) {
    if (value === 'cb') {
      root.dataset.palette = 'cb';
      safeSet(PALETTE_KEY, 'cb');
    } else {
      delete root.dataset.palette;
      safeSet(PALETTE_KEY, null);
    }
    notifyAppearance();
  }

  function initControls() {
    var savedTheme = safeGet(THEME_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      root.dataset.theme = savedTheme;
    }
    var savedPalette = safeGet(PALETTE_KEY);
    if (savedPalette === 'cb') {
      root.dataset.palette = 'cb';
    }

    var themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.value = root.dataset.theme || 'system';
      themeSelect.addEventListener('change', function () {
        applyTheme(themeSelect.value);
      });
    }

    var paletteSelect = document.getElementById('palette-select');
    if (paletteSelect) {
      paletteSelect.value = root.dataset.palette === 'cb' ? 'cb' : 'default';
      paletteSelect.addEventListener('change', function () {
        applyPalette(paletteSelect.value);
      });
    }

    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) {
        mq.addEventListener('change', notifyAppearance);
      }
    }
  }

  function getCssVar(name) {
    return window.getComputedStyle(root).getPropertyValue(name).trim();
  }

  function hexToRgb(hex) {
    var clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    var n = parseInt(clean, 16);
    if (isNaN(n)) return [128, 128, 128];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function getTokens() {
    var pos = getCssVar('--positive') || '#16665d';
    var neg = getCssVar('--negative') || '#903e59';
    var neu = getCssVar('--neutral') || '#585f6b';
    return {
      paper: getCssVar('--paper') || '#f6f3eb',
      ink: getCssVar('--ink') || '#262b23',
      muted: getCssVar('--muted') || '#51594e',
      line: getCssVar('--line') || '#c4c8b9',
      panel: getCssVar('--panel') || '#e8edde',
      card: getCssVar('--card') || '#fffdf8',
      accent: getCssVar('--accent') || '#38522f',
      accentInk: getCssVar('--accent-ink') || '#fffdf7',
      positive: pos,
      negative: neg,
      neutral: neu,
      positiveRgb: hexToRgb(pos),
      negativeRgb: hexToRgb(neg),
      neutralRgb: hexToRgb(neu),
      chart1: getCssVar('--chart-1') || '#38522f',
      chart2: getCssVar('--chart-2') || '#16665d',
      chart3: getCssVar('--chart-3') || '#903e59',
      chart4: getCssVar('--chart-4') || '#8a5a19',
      isDark:
        root.dataset.theme === 'dark' ||
        (!root.dataset.theme &&
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
    };
  }

  function renderMath(target) {
    if (typeof window.renderMathInElement === 'function') {
      window.renderMathInElement(target || document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    }
  }

  function onAppearanceChange(fn) {
    if (typeof fn === 'function') {
      listeners.push(fn);
    }
  }

  window.PAI = window.PAI || {};
  window.PAI.applyTheme = applyTheme;
  window.PAI.applyPalette = applyPalette;
  window.PAI.getTokens = getTokens;
  window.PAI.renderMath = renderMath;
  window.PAI.onAppearanceChange = onAppearanceChange;

  function boot() {
    initControls();
    renderMath(document.body);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
