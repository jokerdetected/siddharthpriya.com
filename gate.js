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
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Screens from the case studies, shown frosted behind the panel */
  var WALL = [
    ['img/lightning-checkout/s01.webp', 'img/pi-business-ads/s05.webp', 'img/js-checkout/saved-cards.webp'],
    ['img/js-checkout/card-upi.webp', 'img/lightning-checkout/s10.webp', 'img/pi-business-ads/s12.webp'],
    ['img/pi-business-ads/s01.webp', 'img/js-checkout/net-banking.webp', 'img/lightning-checkout/s01.webp'],
    ['img/lightning-checkout/s10.webp', 'img/js-checkout/card-cards.webp', 'img/pi-business-ads/s16.webp']
  ];

  var FONT = '-apple-system, BlinkMacSystemFont, "Inter Site", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  var css = document.createElement('style');
  css.textContent =
    '@font-face { font-family: "Inter Site"; src: url("fonts/inter-var.woff2") format("woff2"); font-weight: 100 900; font-display: swap; }' +
    'html.sp-locked, html.sp-locked body { overflow: hidden !important; }' +
    'html.sp-locked body > *:not(#sp-gate) { visibility: hidden !important; }' +
    '#sp-gate { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; padding: 24px 16px; overflow: hidden;' +
    '  background: #F5F5F7; color: #1D1D1F; font-family: ' + FONT + '; letter-spacing: -.011em; -webkit-font-smoothing: antialiased; color-scheme: light; }' +
    /* the wall of work */
    '#sp-gate .wall { position: absolute; inset: -20% -10%; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 28px; transform: rotate(-9deg); filter: blur(2px) saturate(110%); }' +
    '#sp-gate .col { display: flex; flex-direction: column; gap: 28px; animation: sp-drift 70s linear infinite; }' +
    '#sp-gate .col:nth-child(even) { animation-direction: reverse; animation-duration: 90s; }' +
    '#sp-gate .col img { display: block; width: 100%; height: auto; border-radius: 18px; box-shadow: 0 20px 40px -24px rgba(0,0,0,.35); }' +
    '#sp-gate .col img.ph { width: 62%; margin-inline: auto; border-radius: 28px; outline: 6px solid #1D1D1F; outline-offset: -1px; }' +
    '@keyframes sp-drift { to { transform: translateY(-50%); } }' +
    '#sp-gate .veil { position: absolute; inset: 0; background: radial-gradient(60% 60% at 50% 50%, rgba(245,245,247,.30), rgba(245,245,247,.72)); }' +
    /* the glass panel: a control floating above content */
    '#sp-gate form { position: relative; width: 100%; max-width: 400px; padding: 40px 32px 32px; border-radius: 32px; text-align: center;' +
    '  background: rgba(255,255,255,.62); -webkit-backdrop-filter: blur(30px) saturate(180%); backdrop-filter: blur(30px) saturate(180%);' +
    '  box-shadow: inset 0 1px 0 rgba(255,255,255,.95), inset 0 0 0 1px rgba(255,255,255,.5), 0 0 0 .5px rgba(0,0,0,.08), 0 40px 90px -36px rgba(0,0,0,.45);' +
    '  transition: transform .45s cubic-bezier(.22,1,.36,1), opacity .45s; }' +
    '@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) { #sp-gate form { background: rgba(255,255,255,.95); } }' +
    '@media (prefers-reduced-transparency: reduce) { #sp-gate form { background: #fff; } }' +
    '#sp-gate .mono { width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 50%; display: grid; place-items: center; background: #1D1D1F; color: #fff; font-weight: 600; font-size: 22px; letter-spacing: -.02em; }' +
    '#sp-gate .name { font-size: 17px; font-weight: 600; margin: 0; }' +
    '#sp-gate h1 { font-size: 32px; line-height: 1.1; font-weight: 700; letter-spacing: -.03em; margin: 22px 0 10px; }' +
    '#sp-gate .note { font-size: 15px; line-height: 1.45; margin: 0 auto 26px; max-width: 30ch; }' +
    '#sp-gate .field { position: relative; }' +
    '#sp-gate input { display: block; width: 100%; height: 54px; padding: 0 60px 0 18px; font: inherit; font-size: 17px; letter-spacing: normal; color: #1D1D1F;' +
    '  background: #fff; border: 1px solid rgba(0,0,0,.14); border-radius: 14px; outline: none; transition: border-color .2s, box-shadow .2s; }' +
    '#sp-gate input::placeholder { color: #6E6E73; }' +
    '#sp-gate input:focus { border-color: #1D1D1F; box-shadow: 0 0 0 4px rgba(29,29,31,.12); }' +
    '#sp-gate input[aria-invalid="true"] { border-color: #D70015; box-shadow: 0 0 0 4px rgba(215,0,21,.12); }' +
    '#sp-gate button { position: absolute; top: 8px; right: 8px; width: 38px; height: 38px; border: 0; border-radius: 50%; display: grid; place-items: center; background: #1D1D1F; color: #fff; cursor: pointer; transition: background-color .2s, transform .2s; }' +
    '#sp-gate button:hover { background: #000; }' +
    '#sp-gate button:active { transform: scale(.92); }' +
    '#sp-gate button:focus-visible { outline: 2px solid #1D1D1F; outline-offset: 3px; }' +
    '#sp-gate .err { min-height: 20px; margin: 10px 0 0; font-size: 14px; color: #D70015; }' +
    '#sp-gate .help { margin: 14px 0 0; font-size: 14px; }' +
    '#sp-gate .help a { color: #1D1D1F; text-underline-offset: 3px; }' +
    '#sp-gate .shake { animation: sp-shake .42s cubic-bezier(.36,.07,.19,.97); }' +
    '@keyframes sp-shake { 15%, 85% { transform: translateX(-2px); } 30%, 70% { transform: translateX(5px); } 45%, 55% { transform: translateX(-7px); } }' +
    '#sp-gate.out { transition: opacity .5s ease; opacity: 0; }' +
    '#sp-gate.out form { transform: scale(1.04); opacity: 0; }' +
    '.sp-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }' +
    '@media (max-width: 640px) { #sp-gate .wall { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; inset: -20% -30%; } #sp-gate .col { gap: 16px; } #sp-gate .col:nth-child(4) { display: none; } #sp-gate form { padding: 32px 22px 24px; border-radius: 28px; } #sp-gate h1 { font-size: 28px; } }' +
    '@media (prefers-reduced-motion: reduce) { #sp-gate .col, #sp-gate .shake { animation: none; } #sp-gate form, #sp-gate.out { transition: none; } }';
  (document.head || doc).appendChild(css);

  function wall() {
    var w = document.createElement('div');
    w.className = 'wall';
    w.setAttribute('aria-hidden', 'true');
    WALL.forEach(function (list) {
      var col = document.createElement('div');
      col.className = 'col';
      /* each column twice, so the drift loops without a seam */
      list.concat(list).forEach(function (src) {
        var im = new Image();
        im.src = src; im.alt = ''; im.decoding = 'async';
        if (src.indexOf('lightning-checkout') > -1) im.className = 'ph';
        col.appendChild(im);
      });
      w.appendChild(col);
    });
    return w;
  }

  var ARROW = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3.5 9h10M9.5 4.5 14 9l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function mount() {
    var g = document.createElement('div');
    g.id = 'sp-gate';
    g.setAttribute('role', 'dialog');
    g.setAttribute('aria-modal', 'true');
    g.setAttribute('aria-labelledby', 'sp-gate-t');
    g.appendChild(wall());
    var veil = document.createElement('div');
    veil.className = 'veil';
    g.appendChild(veil);
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
    try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }

    function unlock() {
      remember();
      var done = function () {
        doc.classList.remove('sp-locked');
        if (g.parentNode) g.parentNode.removeChild(g);
        if (location.hash) {
          var t = document.getElementById(location.hash.slice(1));
          if (t) t.scrollIntoView();
        }
        try { document.dispatchEvent(new Event('sp-unlock')); } catch (e) {}
      };
      if (reduce) { done(); return; }
      doc.classList.remove('sp-locked');
      g.classList.add('out');
      try { document.dispatchEvent(new Event('sp-unlock')); } catch (e) {}
      setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 520);
      if (location.hash) {
        var t = document.getElementById(location.hash.slice(1));
        if (t) t.scrollIntoView();
      }
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
