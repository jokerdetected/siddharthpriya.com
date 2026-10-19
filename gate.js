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

  /* ---------- Guilloché: banknote-style engraved line work, drawn as SVG ---------- */
  function guilloche(vw, vh) {
    var H = 1000, W = Math.max(600, Math.round(H * vw / vh)), cx = W / 2, cy = H / 2, TAU = Math.PI * 2;
    var paths = [];
    function f(n) { return Math.round(n * 10) / 10; }
    function closed(fn, steps) {
      var d = '';
      for (var k = 0; k <= steps; k++) { var p = fn(k / steps * TAU); d += (k ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1]); }
      return d + 'Z';
    }
    function ring(R, A, n, ph, steps, extra) {
      paths.push(closed(function (t) { var r = R + A * Math.sin(n * t + ph) + (extra ? extra(t) : 0); return [cx + r * Math.cos(t), cy + r * Math.sin(t)]; }, steps));
    }
    /* the seal around the panel: two families of waves crossing into a lattice */
    for (var i = 0; i < 24; i++) {
      var R = 286 + i * 6.6;
      ring(R, 13, 24, i * .3, 264);
      ring(R, 13, 24, Math.PI - i * .3, 264);
    }
    ring(276, 0, 0, 0, 240); ring(272, 0, 0, 0, 240);
    ring(452, 0, 0, 0, 300); ring(456, 0, 0, 0, 300);
    /* a finer outer lace */
    for (i = 0; i < 12; i++) {
      var R2 = 478 + i * 8;
      ring(R2, 6, 72, i * .5, 400);
      ring(R2, 6, 72, Math.PI - i * .5, 400);
    }
    ring(574, 0, 0, 0, 360);
    /* a spirograph rosette at the centre, seen frosted through the glass */
    for (i = 0; i < 6; i++) (function (i) {
      var a = 150, b = 58 + i * 9, k = 23, rot = i * .045;
      paths.push(closed(function (t) {
        var x = a * Math.cos(t) + b * Math.cos(k * t), y = a * Math.sin(t) - b * Math.sin(k * t);
        return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
      }, 760));
    })(i);
    /* woven security ribbons along the top and bottom edges */
    function ribbon(y0) {
      for (var j = 0; j < 10; j++) [1, -1].forEach(function (dir) {
        var d = '';
        for (var x = -10; x <= W + 10; x += 6) {
          var y = y0 + 12 * Math.sin(x / 30 + dir * j * .42) ;
          d += (x === -10 ? 'M' : 'L') + f(x) + ' ' + f(y);
        }
        paths.push(d);
      });
      paths.push('M-10 ' + (y0 - 18) + 'H' + (W + 10), 'M-10 ' + (y0 + 18) + 'H' + (W + 10));
    }
    ribbon(46); ribbon(H - 46);
    /* small rosettes tucked into the corners */
    [[0, 0], [W, 0], [0, H], [W, H]].forEach(function (c) {
      for (var j = 0; j < 8; j++) [1, -1].forEach(function (dir) {
        var Rc = 130 + j * 8;
        paths.push(closed(function (t) { var r = Rc + 7 * Math.sin(16 * t + dir * j * .5); return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]; }, 200));
      });
    });
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice">' +
      '<path fill="none" stroke="#000" stroke-width=".7" stroke-linejoin="round" d="' + paths.join('') + '"/></svg>';
    return svg;
  }

  var FONT = '-apple-system, BlinkMacSystemFont, "Inter Site", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  var css = document.createElement('style');
  css.textContent =
    '@font-face { font-family: "Inter Site"; src: url("fonts/inter-var.woff2") format("woff2"); font-weight: 100 900; font-display: swap; }' +
    'html.sp-locked, html.sp-locked body { overflow: hidden !important; background: #000 !important; }' +
    'html.sp-locked body > *:not(#sp-gate) { visibility: hidden !important; }' +
    '#sp-gate { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; padding: 24px 16px; overflow: hidden;' +
    '  background: radial-gradient(120% 90% at 50% 46%, #1B1B20 0%, #0B0B0D 55%, #000 100%);' +
    '  color: #F5F5F7; font-family: ' + FONT + '; letter-spacing: -.011em; -webkit-font-smoothing: antialiased; color-scheme: dark; }' +
    /* the engraving: a faint base, and a lit copy that only shows where the light falls */
    '#sp-gate .g { position: absolute; inset: 0; pointer-events: none;' +
    '  -webkit-mask-size: cover; mask-size: cover; -webkit-mask-position: center; mask-position: center; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; }' +
    '#sp-gate .g-base { background: rgba(255,255,255,.065); }' +
    '#sp-gate .g-lit { overflow: hidden; }' +
    /* a soft light wanders the screen; its core reads as polished metal */
    '#sp-gate .spot { position: absolute; left: 0; top: 0; width: 64vmax; height: 64vmax; margin: -32vmax 0 0 -32vmax; border-radius: 50%;' +
    '  background: radial-gradient(closest-side, #FFFFFF 0%, rgba(246,241,230,.92) 14%, rgba(205,208,216,.55) 34%, rgba(150,155,166,.22) 58%, rgba(150,155,166,0) 100%);' +
    '  animation: sp-wander 64s ease-in-out infinite; will-change: transform; }' +
    '@keyframes sp-wander {' +
    '  0%   { transform: translate(22vw, 26vh); }' +
    '  20%  { transform: translate(74vw, 14vh); }' +
    '  40%  { transform: translate(86vw, 62vh); }' +
    '  60%  { transform: translate(54vw, 88vh); }' +
    '  80%  { transform: translate(14vw, 72vh); }' +
    '  100% { transform: translate(22vw, 26vh); } }' +
    /* every so often a thin glint crosses on a diagonal, like tilting a note */
    '#sp-gate .glint { position: absolute; left: 50%; top: 50%; width: 26vmax; height: 260vmax; margin: -130vmax 0 0 -13vmax;' +
    '  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(214,222,236,.28) 38%, rgba(255,248,234,.62) 50%, rgba(214,222,236,.28) 62%, rgba(255,255,255,0) 100%);' +
    '  transform: rotate(24deg) translateX(-130vmax); animation: sp-glint 26s cubic-bezier(.45,0,.25,1) 3s infinite; will-change: transform; }' +
    '@keyframes sp-glint { 0% { transform: rotate(24deg) translateX(-130vmax); } 46%, 100% { transform: rotate(24deg) translateX(130vmax); } }' +
    /* the glass panel: dark, so it belongs on the engraving and catches the light behind it */
    '#sp-gate form { position: relative; width: 100%; max-width: 400px; padding: 40px 32px 32px; border-radius: 32px; text-align: center;' +
    '  background: rgba(30,30,34,.5); -webkit-backdrop-filter: blur(26px) saturate(160%); backdrop-filter: blur(26px) saturate(160%);' +
    '  box-shadow: inset 0 1px 0 rgba(255,255,255,.16), inset 0 0 0 1px rgba(255,255,255,.07), 0 0 0 .5px rgba(255,255,255,.1), 0 50px 120px -40px rgba(0,0,0,.9);' +
    '  transition: transform .5s cubic-bezier(.22,1,.36,1), opacity .5s; }' +
    '@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) { #sp-gate form { background: rgba(28,28,30,.96); } }' +
    '@media (prefers-reduced-transparency: reduce) { #sp-gate form { background: #1C1C1E; } }' +
    '#sp-gate .mono { width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 50%; display: grid; place-items: center; color: #1D1D1F; font-weight: 650; font-size: 22px; letter-spacing: -.02em;' +
    '  background: linear-gradient(140deg, #FAFAFA 0%, #C9CBD1 38%, #F2F0EA 55%, #9EA1A8 100%); box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 6px 16px -6px rgba(0,0,0,.7); }' +
    '#sp-gate .name { font-size: 17px; font-weight: 600; margin: 0; }' +
    '#sp-gate h1 { font-size: 32px; line-height: 1.1; font-weight: 700; letter-spacing: -.03em; margin: 22px 0 10px; }' +
    '#sp-gate .note { font-size: 15px; line-height: 1.45; margin: 0 auto 26px; max-width: 30ch; }' +
    '#sp-gate .field { position: relative; }' +
    '#sp-gate input { display: block; width: 100%; height: 54px; padding: 0 60px 0 18px; font: inherit; font-size: 17px; letter-spacing: normal; color: #F5F5F7;' +
    '  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.18); border-radius: 14px; outline: none; transition: border-color .2s, box-shadow .2s, background-color .2s; }' +
    '#sp-gate input::placeholder { color: rgba(235,235,245,.6); }' +
    '#sp-gate input:focus { border-color: rgba(255,255,255,.75); background: rgba(255,255,255,.11); box-shadow: 0 0 0 4px rgba(255,255,255,.12); }' +
    '#sp-gate input[aria-invalid="true"] { border-color: #FF6961; box-shadow: 0 0 0 4px rgba(255,105,97,.18); }' +
    '#sp-gate button { position: absolute; top: 8px; right: 8px; width: 38px; height: 38px; border: 0; border-radius: 50%; display: grid; place-items: center; background: #F5F5F7; color: #1D1D1F; cursor: pointer; transition: background-color .2s, transform .2s; }' +
    '#sp-gate button:hover { background: #FFFFFF; }' +
    '#sp-gate button:active { transform: scale(.92); }' +
    '#sp-gate button:focus-visible { outline: 2px solid #F5F5F7; outline-offset: 3px; }' +
    '#sp-gate .err { min-height: 20px; margin: 10px 0 0; font-size: 14px; color: #FF7A72; }' +
    '#sp-gate .help { margin: 14px 0 0; font-size: 14px; }' +
    '#sp-gate .help a { color: #F5F5F7; text-underline-offset: 3px; }' +
    '#sp-gate .help a:focus-visible { outline: 2px solid #F5F5F7; outline-offset: 2px; border-radius: 4px; }' +
    '#sp-gate .shake { animation: sp-shake .42s cubic-bezier(.36,.07,.19,.97); }' +
    '@keyframes sp-shake { 15%, 85% { transform: translateX(-2px); } 30%, 70% { transform: translateX(5px); } 45%, 55% { transform: translateX(-7px); } }' +
    '#sp-gate.out { transition: opacity .6s ease; opacity: 0; }' +
    '#sp-gate.out form { transform: scale(1.04); opacity: 0; }' +
    '@media (max-width: 640px) { #sp-gate form { padding: 32px 22px 24px; border-radius: 28px; } #sp-gate h1 { font-size: 28px; } }' +
    '@media (prefers-reduced-motion: reduce) { #sp-gate .spot, #sp-gate .glint, #sp-gate .shake { animation: none; } #sp-gate .spot { transform: translate(30vw, 30vh); } #sp-gate .glint { display: none; } #sp-gate form, #sp-gate.out { transition: none; } }';
  (document.head || doc).appendChild(css);

  var ARROW = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3.5 9h10M9.5 4.5 14 9l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function mount() {
    var g = document.createElement('div');
    g.id = 'sp-gate';
    g.setAttribute('role', 'dialog');
    g.setAttribute('aria-modal', 'true');
    g.setAttribute('aria-labelledby', 'sp-gate-t');

    var base = document.createElement('div'), lit = document.createElement('div');
    base.className = 'g g-base'; lit.className = 'g g-lit';
    base.setAttribute('aria-hidden', 'true'); lit.setAttribute('aria-hidden', 'true');
    var blobUrl = null;
    function paint() {
      var svg = guilloche(window.innerWidth || 1440, window.innerHeight || 900), m;
      try {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        blobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
        m = 'url("' + blobUrl + '")';
      } catch (e) { m = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'; }
      [base, lit].forEach(function (el) { el.style.webkitMaskImage = m; el.style.maskImage = m; });
    }
    paint();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(paint, 250); });
    lit.innerHTML = '<div class="spot"></div><div class="glint"></div>';
    g.appendChild(base); g.appendChild(lit);

    var box = document.createElement('div');
    box.innerHTML =
      '<form novalidate>' +
      '<div class="mono" aria-hidden="true">SP</div>' +
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

    var input = form.querySelector('input'), err = form.querySelector('.err');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }

    function toHash() {
      if (!location.hash) return;
      var t = document.getElementById(location.hash.slice(1));
      if (t) t.scrollIntoView();
    }
    function unlock() {
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
