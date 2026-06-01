/* Theme pre-paint bootstrap, runs before first paint to set
   data-theme on <html> with no flash of the default theme.
   Source order: ?theme=<name> → localStorage['splforge.theme'] → unset (Mocha).
   The ?theme= param lets you deep-link a specific theme. */
(function () {
  try {
    var p = new URLSearchParams(window.location.search);
    var ls = window.localStorage;
    var t = p.get('theme') || (ls && ls.getItem('splforge.theme')) || '';
    if (t && t !== 'catppuccin') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) { /* never throw pre-paint */ }
})();
