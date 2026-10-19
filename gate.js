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
  var css = document.createElement('style');
  css.textContent =
    'html.sp-locked, html.sp-locked body { overflow: hidden !important; }' +
    'html.sp-locked body > *:not(#sp-gate) { visibility: hidden !important; }' +
    '#sp-gate { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; padding: 24px 16px;' +
    '  background: #FAF8F4; color: #141414; font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased; }' +
    '#sp-gate .box { width: 100%; max-width: 400px; }' +
    '#sp-gate .brand { font-family: "Fraunces", Georgia, serif; font-size: 1.125rem; margin: 0 0 40px; }' +
    '#sp-gate .label { font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace; font-size: .75rem; letter-spacing: .14em; text-transform: uppercase; color: #1E5B43; margin: 0 0 14px; }' +
    '#sp-gate h1 { font-family: "Fraunces", Georgia, serif; font-weight: 400; font-size: clamp(1.75rem, 6vw, 2.25rem); line-height: 1.1; letter-spacing: -.02em; margin: 0 0 12px; }' +
    '#sp-gate p.note { color: #55514A; font-size: .9688rem; line-height: 1.6; margin: 0 0 28px; }' +
    '#sp-gate label.f { display: block; font-size: .875rem; font-weight: 500; margin-bottom: 8px; }' +
    '#sp-gate .row { display: flex; gap: 10px; }' +
    '#sp-gate input { flex: 1; min-width: 0; font: inherit; font-size: 1rem; padding: 12px 14px; border: 1px solid rgba(20,20,20,.3); border-radius: 10px; background: #fff; color: #141414; }' +
    '#sp-gate input:focus { outline: 2px solid #1E5B43; outline-offset: 1px; border-color: #1E5B43; }' +
    '#sp-gate input[aria-invalid="true"] { border-color: #B3261E; }' +
    '#sp-gate button { font: inherit; font-weight: 500; font-size: .9375rem; padding: 12px 20px; border: 0; border-radius: 999px; background: #141414; color: #FAF8F4; cursor: pointer; white-space: nowrap; }' +
    '#sp-gate button:hover { background: #1E5B43; }' +
    '#sp-gate .err { min-height: 1.4em; color: #B3261E; font-size: .875rem; margin: 10px 0 0; }' +
    '#sp-gate .help { margin-top: 28px; font-size: .875rem; color: #55514A; }' +
    '#sp-gate .help a { color: #141414; }' +
    '@media (max-width: 420px) { #sp-gate .row { flex-direction: column; } }';
  (document.head || doc).appendChild(css);

  function mount() {
    var g = document.createElement('div');
    g.id = 'sp-gate';
    g.setAttribute('role', 'dialog');
    g.setAttribute('aria-modal', 'true');
    g.setAttribute('aria-labelledby', 'sp-gate-t');
    g.innerHTML =
      '<form class="box" novalidate>' +
      '<p class="brand">Siddharth Priya</p>' +
      '<p class="label">Private portfolio</p>' +
      '<h1 id="sp-gate-t">Enter the password</h1>' +
      '<p class="note">You will find the password in my email or job application.</p>' +
      '<label class="f" for="sp-gate-pw">Password</label>' +
      '<div class="row"><input id="sp-gate-pw" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false" required aria-describedby="sp-gate-err">' +
      '<button type="submit">View portfolio</button></div>' +
      '<p class="err" id="sp-gate-err" aria-live="polite"></p>' +
      '<p class="help">No password? <a href="mailto:siddharthpriya002@hotmail.com?subject=Portfolio%20password">Email me</a> and I will send it.</p>' +
      '</form>';
    document.body.appendChild(g);
    var form = g.querySelector('form'), input = g.querySelector('input'), err = g.querySelector('.err');
    input.focus();
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (sha256(input.value.trim()) === HASH) {
        remember();
        doc.classList.remove('sp-locked');
        g.remove();
      } else {
        input.setAttribute('aria-invalid', 'true');
        err.textContent = 'That password did not work. Check it and try again.';
        input.select();
      }
    });
    input.addEventListener('input', function () { input.removeAttribute('aria-invalid'); err.textContent = ''; });
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
