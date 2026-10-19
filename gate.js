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
    var groups = {}, order = [];
    function add(g, d) { if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push(d); }
    function f(n) { return Math.round(n * 10) / 10; }
    function closed(fn, steps) {
      var d = '';
      for (var k = 0; k <= steps; k++) { var p = fn(k / steps * TAU); d += (k ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1]); }
      return d + 'Z';
    }
    function ring(g, R, A, n, ph, steps) {
      add(g, closed(function (t) { var r = R + A * Math.sin(n * t + ph); return [cx + r * Math.cos(t), cy + r * Math.sin(t)]; }, steps));
    }
    /* the seal around the panel: two families of waves crossing into a lattice */
    for (var i = 0; i < 24; i++) {
      var R = 286 + i * 6.6;
      ring('seal', R, 13, 24, i * .3, 264);
      ring('seal', R, 13, 24, Math.PI - i * .3, 264);
    }
    ring('edge', 276, 0, 0, 0, 240); ring('edge', 272, 0, 0, 0, 240);
    ring('edge', 452, 0, 0, 0, 300); ring('edge', 456, 0, 0, 0, 300);
    /* a finer outer lace */
    for (i = 0; i < 12; i++) {
      var R2 = 478 + i * 8;
      ring('lace', R2, 6, 72, i * .5, 400);
      ring('lace', R2, 6, 72, Math.PI - i * .5, 400);
    }
    ring('edge', 574, 0, 0, 0, 360);
    /* a spirograph rosette at the centre, seen frosted through the glass */
    for (i = 0; i < 6; i++) (function (i) {
      var a = 150, b = 58 + i * 9, k = 23, rot = i * .045;
      add('rose', closed(function (t) {
        var x = a * Math.cos(t) + b * Math.cos(k * t), y = a * Math.sin(t) - b * Math.sin(k * t);
        return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
      }, 760));
    })(i);
    /* woven security ribbons along the top and bottom edges */
    function ribbon(y0) {
      for (var j = 0; j < 10; j++) [1, -1].forEach(function (dir) {
        var d = '';
        for (var x = -10; x <= W + 10; x += 6) {
          var y = y0 + 12 * Math.sin(x / 30 + dir * j * .42);
          d += (x === -10 ? 'M' : 'L') + f(x) + ' ' + f(y);
        }
        add('ribbon', d);
      });
      add('edge', 'M-10 ' + (y0 - 18) + 'H' + (W + 10));
      add('edge', 'M-10 ' + (y0 + 18) + 'H' + (W + 10));
    }
    ribbon(46); ribbon(H - 46);
    /* small rosettes tucked into the corners */
    [[0, 0], [W, 0], [0, H], [W, H]].forEach(function (c) {
      for (var j = 0; j < 8; j++) [1, -1].forEach(function (dir) {
        var Rc = 130 + j * 8;
        add('corner', closed(function (t) { var r = Rc + 7 * Math.sin(16 * t + dir * j * .5); return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]; }, 200));
      });
    });

    /* silver in several tints and shades: polished bands across the seal, softer lace, quiet corners */
    var INK = {
      seal:   { s: 'url(#sv-seal)', w: .75 },
      edge:   { s: '#A4A9B2', w: .9 },
      lace:   { s: 'url(#sv-lace)', w: .6 },
      rose:   { s: '#B4B9C1', w: .6 },
      ribbon: { s: 'url(#sv-rib)', w: .6 },
      corner: { s: '#CDD0D6', w: .6 }
    };
    var defs =
      '<defs>' +
      '<linearGradient id="sv-seal" gradientUnits="userSpaceOnUse" x1="' + (cx - 460) + '" y1="' + (cy - 460) + '" x2="' + (cx + 460) + '" y2="' + (cy + 460) + '">' +
      '<stop offset="0" stop-color="#9DA3AD"/><stop offset=".22" stop-color="#D3D6DC"/><stop offset=".42" stop-color="#AEB3BC"/><stop offset=".6" stop-color="#DDDFE4"/><stop offset=".8" stop-color="#A8ADB6"/><stop offset="1" stop-color="#C9CCD2"/></linearGradient>' +
      '<linearGradient id="sv-lace" gradientUnits="userSpaceOnUse" x1="' + (cx + 600) + '" y1="' + (cy - 600) + '" x2="' + (cx - 600) + '" y2="' + (cy + 600) + '">' +
      '<stop offset="0" stop-color="#C2C6CD"/><stop offset=".5" stop-color="#E0E2E6"/><stop offset="1" stop-color="#B9BDC5"/></linearGradient>' +
      '<linearGradient id="sv-rib" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="' + W + '" y2="0">' +
      '<stop offset="0" stop-color="#C6CAD0"/><stop offset=".3" stop-color="#ABB0B9"/><stop offset=".55" stop-color="#DCDEE3"/><stop offset=".8" stop-color="#B3B8C0"/><stop offset="1" stop-color="#D2D5DA"/></linearGradient>' +
      '</defs>';
    var head = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice">';
    var colour = head + defs, mask = head;
    order.forEach(function (g) {
      var d = groups[g].join('');
      colour += '<path fill="none" stroke="' + INK[g].s + '" stroke-width="' + INK[g].w + '" stroke-linejoin="round" d="' + d + '"/>';
      mask += '<path fill="none" stroke="#000" stroke-width="' + INK[g].w + '" stroke-linejoin="round" d="' + d + '"/>';
    });
    return { colour: colour + '</svg>', mask: mask + '</svg>' };
  }

  var FONT = '-apple-system, BlinkMacSystemFont, "Inter Site", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  var css = document.createElement('style');
  css.textContent =
    '@font-face { font-family: "Inter Site"; src: url("fonts/inter-var.woff2") format("woff2"); font-weight: 100 900; font-display: swap; }' +
    'html.sp-locked, html.sp-locked body { overflow: hidden !important; background: #FFFFFF !important; }' +
    'html.sp-locked body > *:not(#sp-gate) { visibility: hidden !important; }' +
    '#sp-gate { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; padding: 24px 16px; overflow: hidden;' +
    '  background: #FFFFFF; color: #1D1D1F; font-family: ' + FONT + '; letter-spacing: -.011em; -webkit-font-smoothing: antialiased; color-scheme: light; }' +
    /* the engraving in light silver */
    '#sp-gate .g { position: absolute; inset: 0; pointer-events: none; }' +
    '#sp-gate .g-base { background-size: cover; background-position: center; background-repeat: no-repeat; opacity: .72; }' +
    /* the same lines, lit: only visible where the floating light falls */
    '#sp-gate .g-lit { overflow: hidden;' +
    '  -webkit-mask-size: cover; mask-size: cover; -webkit-mask-position: center; mask-position: center; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; }' +
    '#sp-gate .light { position: absolute; left: 0; top: 0; border-radius: 50%; will-change: transform; }' +
    /* a glassy silver light: a bright core, a polished steel ring, then a soft cool-and-warm falloff */
    '#sp-gate .l1 { width: 62vmax; height: 62vmax; margin: -31vmax 0 0 -31vmax;' +
    '  background: radial-gradient(closest-side, rgba(255,255,255,1) 0%, rgba(250,251,253,.95) 6%, #7F8793 17%, #98A0AC 28%, rgba(176,183,194,.85) 40%, rgba(201,196,186,.5) 54%, rgba(214,219,227,.25) 68%, rgba(214,219,227,0) 84%);' +
    '  animation: sp-float-1 180s ease-in-out infinite; }' +
    '#sp-gate .l2 { width: 40vmax; height: 40vmax; margin: -20vmax 0 0 -20vmax; opacity: .55;' +
    '  background: radial-gradient(closest-side, rgba(255,255,255,.95) 0%, #8C95A3 22%, rgba(170,178,190,.6) 45%, rgba(190,196,206,0) 80%);' +
    '  animation: sp-float-2 140s ease-in-out infinite; }' +
    '@keyframes sp-float-1 {' +
    '  0%   { transform: translate(24vw, 28vh); }' +
    '  20%  { transform: translate(70vw, 16vh); }' +
    '  40%  { transform: translate(84vw, 60vh); }' +
    '  60%  { transform: translate(56vw, 86vh); }' +
    '  80%  { transform: translate(16vw, 70vh); }' +
    '  100% { transform: translate(24vw, 28vh); } }' +
    '@keyframes sp-float-2 {' +
    '  0%   { transform: translate(80vw, 82vh); }' +
    '  25%  { transform: translate(30vw, 90vh); }' +
    '  50%  { transform: translate(12vw, 30vh); }' +
    '  75%  { transform: translate(60vw, 10vh); }' +
    '  100% { transform: translate(80vw, 82vh); } }' +
    /* the glass panel, light again */
    '#sp-gate form { position: relative; width: 100%; max-width: 400px; padding: 40px 32px 32px; border-radius: 32px; text-align: center;' +
    '  background: rgba(255,255,255,.62); -webkit-backdrop-filter: blur(24px) saturate(160%); backdrop-filter: blur(24px) saturate(160%);' +
    '  box-shadow: inset 0 1px 0 rgba(255,255,255,.95), inset 0 0 0 1px rgba(255,255,255,.6), 0 0 0 .5px rgba(0,0,0,.08), 0 40px 90px -36px rgba(40,48,60,.35);' +
    '  transition: transform .5s cubic-bezier(.22,1,.36,1), opacity .5s; }' +
    '@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) { #sp-gate form { background: rgba(255,255,255,.96); } }' +
    '@media (prefers-reduced-transparency: reduce) { #sp-gate form { background: #FFFFFF; } }' +
    '#sp-gate .mono { width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 50%; display: grid; place-items: center; color: #1D1D1F; font-weight: 650; font-size: 22px; letter-spacing: -.02em;' +
    '  background: linear-gradient(140deg, #FBFBFC 0%, #C6C9CF 38%, #F1EFEA 55%, #A2A6AD 100%); box-shadow: inset 0 1px 0 rgba(255,255,255,.95), inset 0 0 0 .5px rgba(0,0,0,.12), 0 6px 16px -8px rgba(40,48,60,.5); }' +
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
    '@media (prefers-reduced-motion: reduce) { #sp-gate .light, #sp-gate .shake { animation: none; } #sp-gate .l1 { transform: translate(28vw, 26vh); } #sp-gate .l2 { transform: translate(76vw, 80vh); } #sp-gate form, #sp-gate.out { transition: none; } }';
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
    var urls = [];
    function toUrl(svg) {
      try { var u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); urls.push(u); return 'url("' + u + '")'; }
      catch (e) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'; }
    }
    function paint() {
      var old = urls; urls = [];
      var art = guilloche(window.innerWidth || 1440, window.innerHeight || 900);
      base.style.backgroundImage = toUrl(art.colour);
      var m = toUrl(art.mask);
      lit.style.webkitMaskImage = m; lit.style.maskImage = m;
      setTimeout(function () { old.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} }); }, 1000);
    }
    paint();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(paint, 250); });
    lit.innerHTML = '<div class="light l1"></div><div class="light l2"></div>';
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
