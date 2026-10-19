/* Soft password lock for the portfolio.
   This runs in the browser, so it keeps casual visitors out but is not real security.
   Only a SHA-256 hash of the password is stored here. */
(function () {
  var HASH = 'b53628faa6ea801cb147387e6e8f2ec3a96e1f6131cf9cabae13a5d002507f8d';
  var KEY = 'sp-gate';
  var doc = document.documentElement;

  function stored() { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } }
  function remember() { try { sessionStorage.setItem(KEY, HASH); } catch (e) {} }
  if (stored() === HASH) return;

  /* SHA-256 in plain JS so it also works on http and older browsers */
  function sha256(str) {
    var K = [], H = [], i, j, isPrime = function (n) { for (var d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
    var frac = function (x) { return ((x - Math.floor(x)) * 4294967296) | 0; };
    for (var n = 2, c = 0; c < 64; n++) if (isPrime(n)) { if (c < 8) H[c] = frac(Math.pow(n, 1 / 2)); K[c++] = frac(Math.pow(n, 1 / 3)); }
    var bytes = unescape(encodeURIComponent(str)), l = bytes.length, words = [];
    for (i = 0; i < l; i++) words[i >> 2] |= bytes.charCodeAt(i) << (24 - (i % 4) * 8);
    words[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
    words[((l + 8) >> 6) * 16 + 15] = l * 8;
    var rotr = function (x, r) { return (x >>> r) | (x << (32 - r)); };
    for (i = 0; i < words.length; i += 16) {
      var w = [], a = H[0], b = H[1], cc = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (j = 0; j < 64; j++) {
        if (j < 16) w[j] = words[i + j] | 0;
        else {
          var s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
          var s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
          w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
        }
        var t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[j] + w[j]) | 0;
        var t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & cc) ^ (b & cc))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = cc; cc = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + cc) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = '';
    for (i = 0; i < 8; i++) out += ('00000000' + (H[i] >>> 0).toString(16)).slice(-8);
    return out;
  }

  doc.classList.add('sp-locked');

  /* ---------- Guilloché rosettes, drawn line by line ---------- */
  var SVGNS = 'http://www.w3.org/2000/svg', TAU = Math.PI * 2;
  /* silver with only a hint of hue */
  var PALETTE = ['#AAB3C2', '#D3BBC2', '#B5C7BC', '#C1BCD4', '#D4CAAD', '#B9BCC2', '#9FA6B1', '#C9C3BB'];   /* 25% lighter than the first version */
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function rint(a, b) { return Math.floor(rnd(a, b + 1)); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function f(n) { return Math.round(n * 10) / 10; }
  function polar(rFn, steps) {
    var d = '';
    for (var k = 0; k <= steps; k++) { var t = k / steps * TAU, r = rFn(t); d += (k ? 'L' : 'M') + f(r * Math.cos(t)) + ' ' + f(r * Math.sin(t)); }
    return d + 'Z';
  }
  function param(xy, steps) {
    var d = '';
    for (var k = 0; k <= steps; k++) { var p = xy(k / steps * TAU); d += (k ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1]); }
    return d + 'Z';
  }

  /* the parts, taken from banknote rosettes */
  function ring(R) { return [polar(function () { return R; }, 180)]; }
  function scallops(R, A, n, lines, gap, ph) {            /* the multi-line scalloped border */
    var out = [];
    for (var k = 0; k < lines; k++) out.push(polar(function (t) { return R - k * gap + A * Math.sin(n * t + ph); }, n * 18));
    return out;
  }
  function lattice(R0, R1, A, n, rings, step) {           /* two families of waves crossing into a mesh */
    var out = [];
    for (var i = 0; i < rings; i++) (function (i) {
      var R = R0 + (R1 - R0) * i / (rings - 1);
      out.push(polar(function (t) { return R + A * Math.sin(n * t + i * step); }, n * 12));
      out.push(polar(function (t) { return R + A * Math.sin(n * t + Math.PI - i * step); }, n * 12));
    })(i);
    return out;
  }
  function loops(Rm, a, n, phases) {                      /* looped lace, like a spirograph band */
    var out = [];
    for (var p = 0; p < phases; p++) (function (p) {
      var ph = p * TAU / phases / n;
      out.push(param(function (t) { return [Rm * Math.cos(t) + a * Math.cos(n * (t + ph)), Rm * Math.sin(t) + a * Math.sin(n * (t + ph))]; }, n * 26));
    })(p);
    return out;
  }
  function petals(c, a, b, count) {                       /* a fan of ellipses that reads as a flower */
    var out = [];
    for (var k = 0; k < count; k++) (function (k) {
      var rot = k * TAU / count, cs = Math.cos(rot), sn = Math.sin(rot);
      out.push(param(function (s) { var x = c + a * Math.cos(s), y = b * Math.sin(s); return [x * cs - y * sn, x * sn + y * cs]; }, 72));
    })(k);
    return out;
  }
  function star(R, A, n, lines, gap) {                    /* a pointed ring */
    var out = [];
    for (var k = 0; k < lines; k++) out.push(polar(function (t) {
      var u = (n * t / Math.PI) % 2; return R - k * gap + A * (2 * Math.abs(u - 1) - 1);
    }, n * 10));
    return out;
  }
  function waves(R1, R0, n, count) {                      /* small wavy circles at the heart */
    var out = [];
    for (var k = 0; k < count; k++) (function (k) {
      var R = R1 - k * (R1 - R0) / count;
      out.push(polar(function (t) { return R + R * .09 * Math.sin(n * t + k * .35); }, n * 14));
    })(k);
    return out;
  }

  /* four kinds of rosette, each made of parts in a few silver tints; outer parts draw first */
  var RECIPES = [
    function seal(c) { var n = rint(12, 16), m = rint(18, 26); return [
      [scallops(476, 13, n, 5, 7, rnd(0, 6)), c[0], .8],
      [ring(438).concat(ring(332)), c[0], .7],
      [lattice(346, 424, 13, m, 14, .3), c[1], .8],
      [loops(272, 36, 22, 4), c[2], .8],
      [petals(112, 118, 44, 18), c[1], .7],
      [waves(84, 24, n, 6), c[0], .8]
    ]; },
    function starRose(c) { var n = rint(9, 13); return [
      [star(470, 34, n, 4, 9), c[0], .8],
      [lattice(250, 390, 15, n * 2, 14, .26), c[1], .8],
      [ring(236), c[0], .7],
      [loops(178, 28, 20, 3), c[2], .8],
      [waves(110, 30, n, 7), c[1], .8]
    ]; },
    function lace(c) { var n = rint(14, 18); return [
      [scallops(478, 9, n, 3, 6, rnd(0, 6)), c[0], .8],
      [loops(400, 54, 30, 5), c[1], .8],
      [ring(330), c[0], .7],
      [lattice(170, 310, 11, n, 13, .36), c[2], .8],
      [petals(70, 64, 22, 16), c[0], .7]
    ]; },
    function bloom(c) { var n = rint(10, 14); return [
      [scallops(474, 18, n, 4, 8, rnd(0, 6)), c[0], .8],
      [petals(236, 214, 70, 30), c[1], .75],
      [lattice(120, 220, 10, n, 12, .33), c[2], .8],
      [waves(96, 40, n, 5), c[0], .8]
    ]; }
  ];

  var FONT = '-apple-system, BlinkMacSystemFont, "Inter Site", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  var css = document.createElement('style');
  css.textContent =
    '@font-face { font-family: "Inter Site"; src: url("fonts/inter-var.woff2") format("woff2"); font-weight: 100 900; font-display: swap; }' +
    'html.sp-locked, html.sp-locked body { overflow: hidden !important; background: #FFFFFF !important; }' +
    'html.sp-locked body > *:not(#sp-gate) { visibility: hidden !important; }' +
    '#sp-gate { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; padding: 24px 16px; overflow: hidden;' +
    '  background: #FFFFFF; color: #1D1D1F; font-family: ' + FONT + '; letter-spacing: -.011em; -webkit-font-smoothing: antialiased; color-scheme: light; }' +
    '#sp-gate .bed { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: .5; }' +
    '#sp-gate .ros { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; will-change: transform, opacity; }' +
    '#sp-gate .ros path { fill: none; vector-effect: non-scaling-stroke; stroke-linejoin: round; stroke-linecap: round; shape-rendering: geometricPrecision; }' +
    /* the glass panel, light again */
    '#sp-gate form { position: relative; width: 100%; max-width: 400px; padding: 40px 32px 32px; border-radius: 32px; text-align: center;' +
    '  background: rgba(255,255,255,.62); -webkit-backdrop-filter: blur(24px) saturate(160%); backdrop-filter: blur(24px) saturate(160%);' +
    '  box-shadow: inset 0 1px 0 rgba(255,255,255,.95), inset 0 0 0 1px rgba(255,255,255,.6), 0 0 0 .5px rgba(0,0,0,.08), 0 40px 90px -36px rgba(40,48,60,.35);' +
    '  transition: transform .5s cubic-bezier(.22,1,.36,1), opacity .5s; }' +
    '@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) { #sp-gate form { background: rgba(255,255,255,.96); } }' +
    '@media (prefers-reduced-transparency: reduce) { #sp-gate form { background: #FFFFFF; } }' +
    '#sp-gate .mono { width: 88px; height: 88px; margin: 0 auto 16px; padding: 3px; border-radius: 50%;' +
    '  background: linear-gradient(140deg, #FBFBFC 0%, #C6C9CF 38%, #F1EFEA 55%, #A2A6AD 100%); box-shadow: 0 10px 24px -12px rgba(40,48,60,.55); }' +
    '#sp-gate .mono img { display: block; width: 100%; height: 100%; border-radius: 50%; object-fit: cover; background: #E8E8ED; }' +
    '#sp-gate .name { font-size: 17px; font-weight: 600; margin: 0; }' +
    '#sp-gate h1 { font-size: 32px; line-height: 1.1; font-weight: 700; letter-spacing: -.03em; margin: 22px 0 10px; }' +
    '#sp-gate .note { font-size: 15px; line-height: 1.45; margin: 0 auto 26px; max-width: 30ch; }' +
    '#sp-gate .field { position: relative; }' +
    '#sp-gate input { display: block; width: 100%; height: 54px; padding: 0 60px 0 18px; font: inherit; font-size: 17px; letter-spacing: normal; color: #1D1D1F;' +
    '  background: #FFFFFF; border: 1px solid rgba(0,0,0,.14); border-radius: 14px; outline: none; transition: border-color .2s, box-shadow .2s; }' +
    '#sp-gate input::placeholder { color: #6E6E73; }' +
    '#sp-gate input:focus { border-color: #1D1D1F; box-shadow: 0 0 0 4px rgba(29,29,31,.1); }' +
    '#sp-gate input[aria-invalid="true"] { border-color: #D70015; box-shadow: 0 0 0 4px rgba(215,0,21,.12); }' +
    '#sp-gate button { position: absolute; top: 8px; right: 8px; width: 38px; height: 38px; border: 0; border-radius: 50%; display: grid; place-items: center; background: #1D1D1F; color: #FFFFFF; cursor: pointer; transition: background-color .2s, transform .2s; }' +
    '#sp-gate button:hover { background: #000000; }' +
    '#sp-gate button:active { transform: scale(.92); }' +
    '#sp-gate button:focus-visible { outline: 2px solid #1D1D1F; outline-offset: 3px; }' +
    '#sp-gate .err { min-height: 20px; margin: 10px 0 0; font-size: 14px; color: #D70015; }' +
    '#sp-gate .help { margin: 14px 0 0; font-size: 14px; }' +
    '#sp-gate .help a { color: #1D1D1F; text-underline-offset: 3px; }' +
    '#sp-gate .help a:focus-visible { outline: 2px solid #1D1D1F; outline-offset: 2px; border-radius: 4px; }' +
    '#sp-gate .shake { animation: sp-shake .42s cubic-bezier(.36,.07,.19,.97); }' +
    '@keyframes sp-shake { 15%, 85% { transform: translateX(-2px); } 30%, 70% { transform: translateX(5px); } 45%, 55% { transform: translateX(-7px); } }' +
    '#sp-gate.out { transition: opacity .6s ease; opacity: 0; }' +
    '#sp-gate.out form { transform: scale(1.04); opacity: 0; }' +
    '@media (max-width: 640px) { #sp-gate form { padding: 32px 22px 24px; border-radius: 28px; } #sp-gate h1 { font-size: 28px; } }' +
    '@media (prefers-reduced-motion: reduce) { #sp-gate .shake { animation: none; } #sp-gate form, #sp-gate.out { transition: none; } }';
  (document.head || doc).appendChild(css);

  var ARROW = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3.5 9h10M9.5 4.5 14 9l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function mount() {
    var g = document.createElement('div');
    g.id = 'sp-gate';
    g.setAttribute('role', 'dialog');
    g.setAttribute('aria-modal', 'true');
    g.setAttribute('aria-labelledby', 'sp-gate-t');

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, reduceMotion = reduce;
    var field = document.createElement('div');
    field.className = 'bed';
    field.setAttribute('aria-hidden', 'true');
    g.appendChild(field);
    var box = document.createElement('div');
    box.innerHTML =
      '<form novalidate>' +
      '<div class="mono"><img src="img/sp-avatar.webp" width="160" height="160" alt="" decoding="async"></div>' +
      '<p class="name">Siddharth Priya</p>' +
      '<h1 id="sp-gate-t">Enter the password</h1>' +
      '<p class="note">You will find the password in my email or job application.</p>' +
      '<div class="field">' +
      '<input id="sp-gate-pw" type="password" placeholder="Password" aria-labelledby="sp-gate-t" autocomplete="current-password" autocapitalize="off" spellcheck="false" required aria-describedby="sp-gate-err">' +
      '<button type="submit" aria-label="View portfolio">' + ARROW + '</button>' +
      '</div>' +
      '<p class="err" id="sp-gate-err" aria-live="polite"></p>' +
      '<p class="help">No password? <a href="mailto:siddharthpriya002@hotmail.com?subject=Portfolio%20password">Email me</a> and I will send it.</p>' +
      '</form>';
    var form = box.firstChild;
    g.appendChild(form);
    document.body.appendChild(g);

    /* ---------- life cycle: draw, float, fade, replace ---------- */
    var stopped = false, timers = [], alive = [];
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function slots() {
      var w = window.innerWidth, h = window.innerHeight;
      if (w >= h) {
        var S = Math.min(w, h);
        return [[.15, .30, .66], [.85, .70, .66], [.82, .22, .5], [.18, .78, .5], [.03, .06, .56], [.97, .94, .56],
                [.97, .07, .42], [.03, .93, .42], [.34, .1, .3], [.66, .9, .3]].map(function (s) { return [s[0] * w, s[1] * h, s[2] * S]; });
      }
      var S2 = w;   /* phones: rosettes sit above and below the panel */
      return [[.18, .12, 1.05], [.86, .2, .85], [.5, .02, .7], [.14, .88, .95], [.84, .9, 1.1], [.5, .99, .7]].map(function (s) { return [s[0] * w, s[1] * h, s[2] * S2]; });
    }
    function build(size) {
      var svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('class', 'ros');
      svg.setAttribute('viewBox', '-500 -500 1000 1000');
      svg.setAttribute('width', size); svg.setAttribute('height', size);
      var cols = shuffle(PALETTE).slice(0, 3);
      var parts = RECIPES[Math.floor(Math.random() * RECIPES.length)](cols);
      var paths = [];
      parts.forEach(function (part, pi) {
        var grp = document.createElementNS(SVGNS, 'g');
        grp.setAttribute('stroke', part[1]);
        grp.setAttribute('stroke-opacity', part[2]);
        grp.setAttribute('stroke-width', size > 420 ? .65 : .55);
        part[0].forEach(function (d, k) {
          var p = document.createElementNS(SVGNS, 'path');
          p.setAttribute('d', d);
          p.setAttribute('pathLength', '1');
          grp.appendChild(p);
          paths.push([p, pi, k]);
        });
        svg.appendChild(grp);
      });
      return { svg: svg, paths: paths };
    }
    function spawn(still) {
      if (stopped) return;
      var max = window.innerWidth >= window.innerHeight ? 7 : 4;
      if (!still && alive.filter(function (a) { return !a.fading; }).length >= max) return;
      var all = slots(), taken = alive.map(function (a) { return a.slot; });
      var free = all.map(function (s, i) { return i; }).filter(function (i) { return taken.indexOf(i) < 0; });
      if (!free.length) return;
      var si = free[0];
      if (!still && alive.length) {
        var scored = free.map(function (i) {
          var d = Infinity;
          alive.forEach(function (a) { var o = all[a.slot]; d = Math.min(d, Math.hypot(all[i][0] - o[0], all[i][1] - o[1])); });
          return [i, d * rnd(.8, 1.2)];
        }).sort(function (A, B) { return B[1] - A[1]; });
        si = scored[0][0];
      } else if (!still) {
        si = free[Math.floor(Math.random() * free.length)];
      }
      var sl = all[si], size = Math.round(sl[2] * rnd(.88, 1.12));
      var x = sl[0] + rnd(-.03, .03) * window.innerWidth, y = sl[1] + rnd(-.03, .03) * window.innerHeight;
      var r = build(size), el = r.svg;
      el.style.left = Math.round(x - size / 2) + 'px';
      el.style.top = Math.round(y - size / 2) + 'px';
      var a0 = rnd(0, 360);
      el.style.transform = 'rotate(' + a0 + 'deg)';
      field.appendChild(el);
      var rec = { el: el, slot: si };
      alive.push(rec);
      if (still) return;

      /* draw: outer parts first, each line spinning out a moment after the last */
      r.paths.forEach(function (item) {
        var p = item[0];
        p.style.strokeDasharray = '1';
        p.style.strokeDashoffset = '1';
        var anim = p.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
          { duration: rnd(5200, 8200), delay: item[1] * 1300 + item[2] * 70, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' });
        anim.onfinish = function () { p.style.strokeDasharray = 'none'; p.style.strokeDashoffset = '0'; try { anim.cancel(); } catch (e) {} };
      });
      /* float: a slow turn and a small drift; it keeps going until it is retired */
      var span = 180000, dir = Math.random() < .5 ? -1 : 1, turn = dir * rnd(34, 58);
      var dx = rnd(-60, 60), dy = rnd(-44, 44);
      var drift = el.animate([
        { transform: 'translate(0px, 0px) rotate(' + a0 + 'deg)' },
        { transform: 'translate(' + dx + 'px, ' + dy + 'px) rotate(' + (a0 + turn) + 'deg)' }
      ], { duration: span, easing: 'linear', fill: 'forwards' });
      rec.retire = function () {
        if (rec.fading) return;
        rec.fading = true;
        var fade = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 11000, easing: 'ease-in-out', fill: 'forwards' });
        fade.onfinish = function () {
          try { drift.cancel(); } catch (e) {}
          if (el.parentNode) el.parentNode.removeChild(el);
          var i = alive.indexOf(rec); if (i > -1) alive.splice(i, 1);
        };
      };
      drift.onfinish = rec.retire;
    }
    function cycle() {
      if (stopped) return;
      var max = window.innerWidth >= window.innerHeight ? 7 : 4;
      var staying = alive.filter(function (a) { return !a.fading; });
      if (staying.length >= max) staying[0].retire();
      spawn(false);
      later(cycle, rnd(9500, 12500));
    }
    if (reduceMotion) {
      for (var q = 0; q < 6; q++) spawn(true);
    } else {
      [0, 1100, 2200, 3300, 4400].forEach(function (ms) { later(function () { spawn(false); }, ms); });
      later(cycle, 11000);
    }
    function stopLife() { stopped = true; timers.forEach(clearTimeout); }

    var input = form.querySelector('input'), err = form.querySelector('.err');
    try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }

    function toHash() {
      if (!location.hash) return;
      var t = document.getElementById(location.hash.slice(1));
      if (t) t.scrollIntoView();
    }
    function unlock() {
      stopLife();
      remember();
      doc.classList.remove('sp-locked');
      toHash();
      try { document.dispatchEvent(new Event('sp-unlock')); } catch (e) {}
      if (reduce) { g.parentNode && g.parentNode.removeChild(g); return; }
      g.classList.add('out');
      setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 620);
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (sha256(input.value.trim()) === HASH) {
        unlock();
      } else {
        input.setAttribute('aria-invalid', 'true');
        err.textContent = 'That password did not work. Check it and try again.';
        form.classList.remove('shake');
        void form.offsetWidth;
        form.classList.add('shake');
        input.select();
      }
    });
    input.addEventListener('input', function () { input.removeAttribute('aria-invalid'); err.textContent = ''; });
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
