/* ============================================================
   SPL Forge, main app.
   Vanilla JS: Monaco wiring, themes, reference panel, and editor tools.
   No jQuery, no Splunk MVC, no analytics, no external calls.

   Storage contract:
     localStorage['splforge.theme']       - current theme
     localStorage['splforge.mode']        - 'spl' | 'xml'
     sessionStorage['splforge.docsOpen']  - '1' if docs panel expanded
   URL hash format:
     #<theme>,<mode>,<encoded source>
   ============================================================ */

// Monaco's worker bootstrap. Splunk's webserver injects an i18n_register()
// stub that breaks workers; we keep the same shim so vendored Monaco doesn't
// notice it's outside its native habitat. Harmless on standalone too.
function i18n_register(){}
(function () {
  // Resolve Monaco base against the document, not the script, so the
  // relative 'lib/...' path lands at the site root regardless of where
  // this script lives in the tree.
  var base = (new URL('lib/monaco-editor/min/', document.baseURI)).toString();
  require.config({
    paths: {
      'vs': 'lib/monaco-editor/min/vs',
      'spl_language': 'js/spl_language'
    }
  });
  window.MonacoEnvironment = {
    getWorkerUrl: function () {
      return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(
        "function i18n_register(){} " +
        "self.MonacoEnvironment = { baseUrl: '" + base + "' }; " +
        "importScripts('" + base + "vs/base/worker/workerMain.js');"
      );
    }
  };
})();

require(['vs/editor/editor.main', 'spl_language'], function (_editor, spl_language) {
  window.spl_language = spl_language;
  startApp();
});

// -----------------------------------------------------------------
// Theme definitions, one Monaco theme per app theme.
// Hex tuned to each theme's CSS palette (toolkit.css is the source of truth).
// SPL token roles:
//   command    - pipe commands (search, stats, etc.) bold accent
//   pipe       - the | itself, bold
//   function   - eval/agg/convert function names
//   argument   - named args (BY, WHERE, AS)
//   keyword    - AND, OR, NOT, etc.
//   operator   - = != < > etc.
//   string     - quoted literals
//   number     - numeric literals
//   delimiter  - punctuation
//   invalid    - unrecognised token
//   macro.*    - backtick macros / comments
// -----------------------------------------------------------------
function defineMonacoThemes() {
  // Mocha, Catppuccin
  monaco.editor.defineTheme('splforge-mocha', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '',                       foreground: 'cdd6f4', background: '11111b' },
      { token: 'command',                foreground: '74c7ec', fontStyle: 'bold' },
      { token: 'pipe',                   foreground: 'cdd6f4', fontStyle: 'bold' },
      { token: 'function',               foreground: 'cba6f7' },
      { token: 'argument',               foreground: '89dceb' },
      { token: 'keyword',                foreground: 'fab387' },
      { token: 'operator',               foreground: 'a6adc8' },
      { token: 'string',                 foreground: 'a6e3a1' },
      { token: 'number',                 foreground: 'f9e2af' },
      { token: 'delimiter',              foreground: 'bac2de' },
      { token: 'invalid',                foreground: 'f38ba8' },
      { token: 'macro.comment',          foreground: 'a6adc8', fontStyle: 'italic' },
      { token: 'macro.comment.wrap',     foreground: '6c7086', fontStyle: 'italic' },
      { token: 'macro.args',             foreground: '89b4fa' },
      { token: 'macro.function',         foreground: 'b4befe' },
      // XML / generic fallbacks
      { token: 'tag',                    foreground: '74c7ec' },
      { token: 'metatag',                foreground: 'fab387' },
      { token: 'attribute.name',         foreground: '89dceb' },
      { token: 'attribute.value',        foreground: 'a6e3a1' },
      { token: 'comment',                foreground: '7f849c', fontStyle: 'italic' },
    ],
    colors: {
      'editor.background':         '#11111b',
      'editor.foreground':         '#cdd6f4',
      'editor.lineHighlightBackground': '#1e1e2e',
      'editorLineNumber.foreground':    '#6c7086',
      'editorLineNumber.activeForeground': '#cdd6f4',
      'editorCursor.foreground':   '#74c7ec',
      'editor.selectionBackground': '#45475a',
      'editor.inactiveSelectionBackground': '#313244',
      'editorIndentGuide.background': '#313244',
      'editorIndentGuide.activeBackground': '#45475a',
      'editorWhitespace.foreground': '#313244',
      'editorBracketMatch.background': '#45475a',
      'editorBracketMatch.border':   '#74c7ec',
      'scrollbarSlider.background':  '#31324480',
      'scrollbarSlider.hoverBackground': '#45475a80',
      'scrollbarSlider.activeBackground':'#585b7080',
    }
  });

  // Dark, muted slate base, desaturated accents
  monaco.editor.defineTheme('splforge-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '',                       foreground: 'e4e4e8', background: '0a0b10' },
      { token: 'command',                foreground: '4f98a3', fontStyle: 'bold' },
      { token: 'pipe',                   foreground: 'e4e4e8', fontStyle: 'bold' },
      { token: 'function',               foreground: 'a78bfa' },
      { token: 'argument',               foreground: '5fb0bd' },
      { token: 'keyword',                foreground: 'fb923c' },
      { token: 'operator',               foreground: '9395a0' },
      { token: 'string',                 foreground: '68c28b' },
      { token: 'number',                 foreground: 'eab308' },
      { token: 'delimiter',              foreground: 'c5c7cf' },
      { token: 'invalid',                foreground: 'e06c6c' },
      { token: 'macro.comment',          foreground: '7a8294', fontStyle: 'italic' },
      { token: 'macro.comment.wrap',     foreground: '5a5a66', fontStyle: 'italic' },
      { token: 'macro.args',             foreground: '5fb0bd' },
      { token: 'macro.function',         foreground: 'a78bfa' },
      { token: 'tag',                    foreground: '4f98a3' },
      { token: 'metatag',                foreground: 'fb923c' },
      { token: 'attribute.name',         foreground: '5fb0bd' },
      { token: 'attribute.value',        foreground: '68c28b' },
      { token: 'comment',                foreground: '7a8294', fontStyle: 'italic' },
    ],
    colors: {
      'editor.background':         '#0a0b10',
      'editor.foreground':         '#e4e4e8',
      'editor.lineHighlightBackground': '#15161c',
      'editorLineNumber.foreground':    '#5a5a66',
      'editorLineNumber.activeForeground': '#e4e4e8',
      'editorCursor.foreground':   '#4f98a3',
      'editor.selectionBackground': '#262733',
      'editor.inactiveSelectionBackground': '#1a1b23',
      'editorIndentGuide.background': '#1a1b23',
      'editorIndentGuide.activeBackground': '#262733',
      'editorBracketMatch.background': '#262733',
      'editorBracketMatch.border':   '#4f98a3',
      'scrollbarSlider.background':  '#1a1b2380',
      'scrollbarSlider.hoverBackground': '#26273380',
      'scrollbarSlider.activeBackground':'#3a3b4a80',
    }
  });

  // Light, off-white paper base, blue accent. Syntax tokens tuned for
  // the light background (dark-bg hex would wash out here).
  monaco.editor.defineTheme('splforge-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: '',                       foreground: '111318', background: 'E4E7ED' },
      { token: 'command',                foreground: '2563EB', fontStyle: 'bold' },
      { token: 'pipe',                   foreground: '111318', fontStyle: 'bold' },
      { token: 'function',               foreground: '5b3a87' },
      { token: 'argument',               foreground: '1D4ED8' },
      { token: 'keyword',                foreground: 'a15a2a' },
      { token: 'operator',               foreground: '6b7280' },
      { token: 'string',                 foreground: '15803d' },
      { token: 'number',                 foreground: '9a6500' },
      { token: 'delimiter',              foreground: '3A3F4A' },
      { token: 'invalid',                foreground: 'DC2626' },
      { token: 'macro.comment',          foreground: '047857', fontStyle: 'italic' },
      { token: 'macro.comment.wrap',     foreground: '6B7280', fontStyle: 'italic' },
      { token: 'macro.args',             foreground: '1D4ED8' },
      { token: 'macro.function',         foreground: '5b3a87' },
      { token: 'tag',                    foreground: '2563EB' },
      { token: 'metatag',                foreground: 'a15a2a' },
      { token: 'attribute.name',         foreground: '1D4ED8' },
      { token: 'attribute.value',        foreground: '15803d' },
      { token: 'comment',                foreground: '6B7280', fontStyle: 'italic' },
    ],
    colors: {
      'editor.background':         '#E4E7ED',
      'editor.foreground':         '#111318',
      'editor.lineHighlightBackground': '#DDE1E8',
      'editorLineNumber.foreground':    '#9BA3B0',
      'editorLineNumber.activeForeground': '#111318',
      'editorCursor.foreground':   '#2563EB',
      'editor.selectionBackground': '#C8CDD8',
      'editor.inactiveSelectionBackground': '#DDE1E8',
      'editorIndentGuide.background': '#DDE1E8',
      'editorIndentGuide.activeBackground': '#C8CDD8',
      'editorBracketMatch.background': '#DDE1E8',
      'editorBracketMatch.border':   '#2563EB',
      'scrollbarSlider.background':  '#C8CDD880',
      'scrollbarSlider.hoverBackground': '#9BA3B080',
      'scrollbarSlider.activeBackground':'#6B728080',
    }
  });
}

// -----------------------------------------------------------------
// Main app
// -----------------------------------------------------------------
function startApp() {
  defineMonacoThemes();

  // Register the SPL Monarch language
  if (window.spl_language) {
    monaco.languages.register({ id: 'spl' });
    monaco.languages.setMonarchTokensProvider('spl', window.spl_language.lang);
  }

  // ---- State
  var DEFAULT_SAMPLE = "index=main sourcetype=access_combined\n| stats count by status\n| sort -count\n| head 10\n";
  var DEFAULT_XML = "<form>\n  <label>Top users</label>\n  <fieldset submitButton=\"false\">\n    <input type=\"time\" token=\"tr\">\n      <default>\n        <earliest>-24h</earliest>\n        <latest>now</latest>\n      </default>\n    </input>\n  </fieldset>\n  <row>\n    <panel>\n      <table>\n        <search>\n          <query>index=main | top user</query>\n          <earliest>$tr.earliest$</earliest>\n          <latest>$tr.latest$</latest>\n        </search>\n      </table>\n    </panel>\n  </row>\n</form>\n";

  var initial = parseHash() || {};
  var theme = initial.theme || localStorage.getItem('splforge.theme') || 'catppuccin';
  var mode  = initial.mode  || localStorage.getItem('splforge.mode') || 'spl';
  var srcOverride = initial.src;

  // ---- Editor model
  var lang = (mode === 'spl') ? 'spl' : 'xml';
  var initialText = srcOverride || (mode === 'spl' ? DEFAULT_SAMPLE : DEFAULT_XML);
  var model = monaco.editor.createModel(initialText, lang);
  var host = document.getElementById('monaco-host');
  var editor = monaco.editor.create(host, {
    model: model,
    automaticLayout: true,
    fontFamily: "'JetBrains Mono', 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
    fontSize: 14,
    lineHeight: 22,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    renderWhitespace: 'selection',
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    padding: { top: 14, bottom: 14 },
  });

  applyTheme(theme);
  applyMode(mode);

  document.getElementById('editorLoading').classList.add('hidden');

  // ---- SPL command tracking (for docs panel auto-follow)
  var splTokens = [];
  function rebuildSplTokens() {
    if (mode !== 'spl') return;
    var contents = model.getValue();
    var tok = monaco.editor.tokenize(contents, 'spl');
    splTokens = [{ cmd: 'search', start: 0, line: 0, end: 0 }];
    for (var i = 0; i < tok.length; i++) {
      for (var j = 0; j < tok[i].length; j++) {
        if (tok[i][j].type === 'command.spl') {
          var endPosition = (j + 1) < tok[i].length
            ? tok[i][j + 1].offset
            : model.getLineLength(i + 1);
          splTokens.push({
            cmd: model.getValueInRange(new monaco.Range(i + 1, tok[i][j].offset + 1, i + 1, endPosition + 1)),
            line: i + 1,
            start: j + 1,
            end: endPosition + 1,
          });
        }
      }
    }
  }
  function commandAt(pos) {
    for (var i = 0; i < splTokens.length; i++) {
      if (splTokens[i].line > pos.lineNumber ||
          (splTokens[i].line === pos.lineNumber + 1 && pos.column >= splTokens[i].start)) {
        return splTokens[i - 1] ? splTokens[i - 1].cmd : 'search';
      }
    }
    return splTokens[splTokens.length - 1] ? splTokens[splTokens.length - 1].cmd : 'search';
  }

  // ---- Reference panel
  //
  // Two data sources merged into one dropdown with optgroups:
  //   1. data/spl.json            - pipe commands (search, stats, eval, ...)
  //                                  Schema: {description, syntax, exampleN, commentN, related}
  //                                  Upstream-licensed; untouched.
  //   2. data/spl2-reference.json, search syntax, time modifiers, time
  //                                  format tokens, sort/wildcard/escape
  //                                  rules, regex, operators. Topics get
  //                                  prefixed IDs ("t:earliest") so they
  //                                  never collide with command names.
  //
  // Cursor-follow still works for the Commands optgroup only, SPL2 topics
  // are explicit picks since they don't appear in tokenised SPL.
  var docsData = null;     // spl.json (commands)
  var spl2Data = null;     // spl2-reference.json (topics)
  var docsBody   = document.getElementById('docsBody');

  // ---- Searchable reference combobox (replaces 165-entry native select)
  var refCombo      = document.getElementById('refCombo');
  var refComboInput = document.getElementById('refComboInput');
  var refComboList  = document.getElementById('refComboList');
  var refComboToggle = document.getElementById('refComboToggle');
  var refState = {
    selectedId: 'search',
    entries: [],
    open: false,
    visibleItems: [],   // currently rendered items in order, for keyboard nav
    hoveredIdx: -1
  };
  var REF_CAT_ORDER = ['Commands', 'Time', 'Syntax', 'Operators', 'SPL2 advanced'];

  function buildRefEntries() {
    refState.entries = [];
    if (docsData) {
      Object.keys(docsData).sort().forEach(function (k) {
        refState.entries.push({ id: k, label: k, category: 'Commands' });
      });
    }
    if (spl2Data) {
      Object.keys(SPL2_TOPICS).forEach(function (id) {
        var t = SPL2_TOPICS[id];
        refState.entries.push({ id: 't:' + id, label: t.label, category: t.category });
      });
    }
  }

  function filterRefEntries(q) {
    if (!q) return refState.entries;
    q = q.toLowerCase().trim();
    if (!q) return refState.entries;
    // Simple substring match on label OR category. Could fuzzy-match later
    // but plain contains is predictable and feels right for short tokens.
    return refState.entries.filter(function (e) {
      return e.label.toLowerCase().indexOf(q) >= 0 ||
             e.category.toLowerCase().indexOf(q) >= 0;
    });
  }

  function renderRefList(opts) {
    opts = opts || {};
    refComboList.innerHTML = '';
    refState.visibleItems = [];
    // showAll=true: render every entry regardless of current input value.
    // Used when the list opens via focus/toggle so the user sees the full
    // catalog instead of items filtered by their previous selection's label.
    var filtered = opts.showAll ? refState.entries : filterRefEntries(refComboInput.value);
    if (filtered.length === 0) {
      refComboList.appendChild(el('div', { cls: 'ref-combo-empty', text: 'No matches' }));
      return;
    }
    var byCat = {};
    filtered.forEach(function (e) {
      if (!byCat[e.category]) byCat[e.category] = [];
      byCat[e.category].push(e);
    });
    REF_CAT_ORDER.forEach(function (cat) {
      if (!byCat[cat]) return;
      refComboList.appendChild(el('div', { cls: 'ref-combo-cat', text: cat }));
      byCat[cat].forEach(function (entry) {
        var node = el('div', {
          cls: 'ref-combo-item' + (entry.id === refState.selectedId ? ' selected' : ''),
          text: entry.label
        });
        node.setAttribute('data-id', entry.id);
        node.setAttribute('role', 'option');
        refComboList.appendChild(node);
        refState.visibleItems.push({ id: entry.id, node: node });
      });
    });
    // Reset hover; arrow-down will start from first.
    refState.hoveredIdx = -1;
  }

  function selectRefEntry(id, opts) {
    opts = opts || {};
    if (!refState.entries.length) buildRefEntries();
    var entry = null;
    for (var i = 0; i < refState.entries.length; i++) {
      if (refState.entries[i].id === id) { entry = refState.entries[i]; break; }
    }
    if (!entry) return;
    refState.selectedId = id;
    refComboInput.value = entry.label;
    var current = document.getElementById('docsCurrent');
    if (current) current.textContent = entry.label;
    renderDocs(id);
    if (opts.openDocs) setDocsOpen(true);
    closeRefList();
  }

  function positionRefList() {
    // Fly out to the right of the sidebar input so the dropdown never
    // opens downward off-screen when the docs panel is collapsed.
    var r = refComboInput.getBoundingClientRect();
    var margin = 12;
    var maxH = Math.round(window.innerHeight * 0.7);
    var minH = 200;

    // Vertical: align with the input, but never run off the bottom. Cap the
    // height to the room below; if that is too tight, lift the top so the
    // list bottom-anchors above the viewport edge instead of clipping.
    var top = r.top;
    var h = Math.min(maxH, window.innerHeight - top - margin);
    if (h < minH) {
      h = Math.min(maxH, window.innerHeight - 2 * margin);
      top = window.innerHeight - margin - h;
      if (top < margin) top = margin;
    }
    refComboList.style.top = top + 'px';
    refComboList.style.maxHeight = h + 'px';

    // Horizontal: fly right of the sidebar; clamp if the viewport is narrow.
    refComboList.style.left = (r.right + 8) + 'px';
    var listW = refComboList.offsetWidth || 320;
    if (r.right + 8 + listW > window.innerWidth - margin) {
      refComboList.style.left = (window.innerWidth - listW - margin) + 'px';
    }
  }

  function openRefList() {
    if (refState.open) return;
    refState.open = true;
    refComboInput.setAttribute('aria-expanded', 'true');
    refComboList.hidden = false;
    renderRefList({ showAll: true });
    positionRefList();
  }
  function closeRefList() {
    if (!refState.open) return;
    refState.open = false;
    refComboInput.setAttribute('aria-expanded', 'false');
    refComboList.hidden = true;
    // Restore label if user typed something then clicked away
    var entry = null;
    for (var i = 0; i < refState.entries.length; i++) {
      if (refState.entries[i].id === refState.selectedId) { entry = refState.entries[i]; break; }
    }
    if (entry) refComboInput.value = entry.label;
  }

  function setHoveredIdx(idx) {
    refState.visibleItems.forEach(function (it, i) {
      it.node.classList.toggle('hovered', i === idx);
    });
    refState.hoveredIdx = idx;
    if (idx >= 0 && refState.visibleItems[idx]) {
      refState.visibleItems[idx].node.scrollIntoView({ block: 'nearest' });
    }
  }

  refComboInput.addEventListener('focus', function () {
    openRefList();
    // Select all so user can immediately type to replace
    refComboInput.select();
  });
  refComboInput.addEventListener('input', function () {
    openRefList();
    renderRefList();
  });
  refComboInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!refState.open) openRefList();
      setHoveredIdx(Math.min(refState.visibleItems.length - 1, refState.hoveredIdx + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHoveredIdx(Math.max(0, refState.hoveredIdx - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      var target = refState.hoveredIdx >= 0
        ? refState.visibleItems[refState.hoveredIdx]
        : refState.visibleItems[0];
      if (target) selectRefEntry(target.id, { openDocs: true });
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeRefList();
      refComboInput.blur();
    }
  });
  refComboToggle.addEventListener('click', function () {
    // Direct open/close, don't route through input.focus() because some
    // browsers don't reliably fire the focus event right after the click
    // handler returns. Also focus the input either way so the user can
    // immediately type to filter.
    if (refState.open) { closeRefList(); refComboInput.blur(); }
    else { openRefList(); refComboInput.focus(); refComboInput.select(); }
  });
  refComboList.addEventListener('mousedown', function (e) {
    // mousedown (not click) so we beat input.blur from outside-mousedown
    var node = e.target.closest('.ref-combo-item');
    if (!node) return;
    e.preventDefault();
    selectRefEntry(node.getAttribute('data-id'), { openDocs: true });
  });
  document.addEventListener('mousedown', function (e) {
    if (!refState.open) return;
    if (refCombo.contains(e.target)) return;
    closeRefList();
  });
  // Reposition floating list on window resize so it tracks the sidebar
  window.addEventListener('resize', function () {
    if (refState.open) positionRefList();
  });

  // DOM helpers, keep render functions terse and consistent.
  function el(tag, opts) {
    var n = document.createElement(tag);
    if (opts) {
      if (opts.cls) n.className = opts.cls;
      if (opts.text != null) n.textContent = opts.text;
      if (opts.html != null) n.innerHTML = opts.html;
    }
    return n;
  }
  function appendH4(parent, text, suffix) {
    var h = el('h4', { text: text });
    if (suffix) {
      var s = el('span', { cls: 'doc-ex-comment', text: ': ' + suffix });
      h.appendChild(s);
    }
    parent.appendChild(h);
    return h;
  }
  function appendP(parent, text)  { parent.appendChild(el('p', { text: text })); }
  function appendPre(parent, text){ parent.appendChild(el('span', { cls: 'doc-pre', text: text })); }
  function appendUl(parent, items) {
    var ul = el('ul', { cls: 'doc-list' });
    items.forEach(function (item) {
      var li = el('li');
      if (typeof item === 'string') li.textContent = item;
      else { li.appendChild(el('strong', { text: item.term + ': ' })); li.appendChild(document.createTextNode(item.def)); }
      ul.appendChild(li);
    });
    parent.appendChild(ul);
  }
  function appendTable(parent, headers, rows) {
    var t = el('table', { cls: 'doc-table' });
    var thead = el('thead'); var hr = el('tr');
    headers.forEach(function (h) { hr.appendChild(el('th', { text: h })); });
    thead.appendChild(hr); t.appendChild(thead);
    var tbody = el('tbody');
    rows.forEach(function (r) {
      var tr = el('tr');
      r.forEach(function (cell) { tr.appendChild(el('td', { text: cell })); });
      tbody.appendChild(tr);
    });
    t.appendChild(tbody); parent.appendChild(t);
  }
  function appendCallout(parent, text, tone) {
    parent.appendChild(el('div', { cls: 'doc-callout doc-callout--' + (tone || 'note'), text: text }));
  }

  // ---- SPL2 topic renderers, each pulls from spl2Data and builds DOM.
  // Ordering inside renderers matches the order a reader would scan.
  var SPL2_TOPICS = {
    'earliest': { label: 'earliest', category: 'Time', render: function (body) {
      var m = spl2Data.spl2_reference.dates_and_time.time_modifiers.primary_modifiers.earliest;
      appendP(body, m.description);
      appendH4(body, 'Syntax'); appendPre(body, m.syntax);
      appendH4(body, 'Examples');
      ['WHERE earliest=-5m', 'WHERE earliest=-4h latest=-2h', 'WHERE earliest=@w0', 'WHERE earliest="2023-11-15:20:00:00"']
        .forEach(function (e) { appendPre(body, e); });
      appendCallout(body, 'See "Relative time" topic for the full unit table (s/m/h/d/w/mon/q/y) and snap-to (@) rules.', 'note');
    }},
    'latest': { label: 'latest', category: 'Time', render: function (body) {
      var m = spl2Data.spl2_reference.dates_and_time.time_modifiers.primary_modifiers.latest;
      appendP(body, m.description);
      appendH4(body, 'Syntax'); appendPre(body, m.syntax);
      appendH4(body, 'Examples');
      ['WHERE latest=now()', 'WHERE earliest=-1h latest=now()', 'WHERE latest=@d', 'WHERE earliest=1 AND latest=now()  ← all time']
        .forEach(function (e) { appendPre(body, e); });
    }},
    'index-time': { label: '_index_earliest / _index_latest', category: 'Time', render: function (body) {
      var p = spl2Data.spl2_reference.dates_and_time.time_modifiers.primary_modifiers;
      appendP(body, 'Restrict by INDEX time (the _indextime field, when the event was indexed) rather than EVENT time (the _time field, when the event happened). Useful when chasing ingestion lag.');
      appendH4(body, '_index_earliest'); appendP(body, p._index_earliest.description);
      appendH4(body, '_index_latest');   appendP(body, p._index_latest.description);
      appendH4(body, 'Example'); appendPre(body, '_index_earliest=-h@h _index_latest=@h');
    }},
    'now': { label: 'now', category: 'Time', render: function (body) {
      var n = spl2Data.spl2_reference.dates_and_time.time_modifiers.primary_modifiers.now;
      appendP(body, n.description);
      appendH4(body, 'Syntax'); appendPre(body, n.syntax);
      appendH4(body, 'Examples');
      ['WHERE latest=now()', '| eval right_now = now()'].forEach(function (e) { appendPre(body, e); });
    }},
    'relative-time': { label: 'Relative time (units + snap)', category: 'Time', render: function (body) {
      var rt = spl2Data.spl2_reference.dates_and_time.relative_time;
      appendP(body, rt.description);
      appendH4(body, 'Syntax'); appendPre(body, rt.syntax);
      appendP(body, rt.default_integer);
      appendH4(body, 'Time units');
      appendTable(body, ['Unit', 'Abbreviations'], rt.time_units.map(function (u) { return [u.unit, u.abbreviations.join(', ')]; }));
      appendH4(body, 'Snap-to (@)');
      appendP(body, rt.snap_to.description);
      appendUl(body, Object.keys(rt.snap_to.examples).map(function (k) { return { term: k, def: rt.snap_to.examples[k] }; }));
      appendP(body, 'Chaining: ' + rt.snap_to.chaining);
      appendH4(body, 'Examples (anchored to Wed 05 Jun 2024 13:37:05)');
      appendTable(body, ['Modifier', 'Description', 'Result'], rt.examples_table.map(function (r) { return [r.modifier, r.description, r.result_from_Wed_05_Jun_2024_13_37 || r['result_from_Wed_05_Jun_2024_13:37']]; }));
      appendCallout(body, rt.note_24h_vs_1d, 'warn');
    }},
    'time-spans': { label: 'Time spans (for stats/timechart/bin)', category: 'Time', render: function (body) {
      var ts = spl2Data.spl2_reference.dates_and_time.time_spans;
      appendP(body, ts.description);
      appendH4(body, 'Syntax'); appendPre(body, ts.syntax);
      appendP(body, ts.notes);
      appendH4(body, 'Time units');
      appendTable(body, ['Unit', 'Abbreviations'], ts.timescales.map(function (u) { return [u.unit, u.abbreviations.join(', ')]; }));
      appendH4(body, 'Default spans by time range picker');
      appendTable(body, ['Time range', 'Default span'], ts.default_spans_by_time_range_picker.map(function (r) { return [r.time_range, r.default_span]; }));
      appendH4(body, 'Examples');
      ts.examples.forEach(function (e) { appendPre(body, e); });
    }},
    'time-variables': { label: 'Time format tokens (strftime)', category: 'Time', render: function (body) {
      var tv = spl2Data.spl2_reference.dates_and_time.time_variables;
      appendP(body, tv.description);
      function rows(arr) { return arr.map(function (r) { return [r.var, r.description]; }); }
      appendH4(body, 'Date & time');     appendTable(body, ['Token', 'Description'], rows(tv.date_and_time));
      appendH4(body, 'Time only');       appendTable(body, ['Token', 'Description'], rows(tv.time_only));
      appendH4(body, 'Date only');       appendTable(body, ['Token', 'Description'], rows(tv.date_only));
      appendH4(body, 'Days & weeks');    appendTable(body, ['Token', 'Description'], rows(tv.days_and_weeks));
      appendH4(body, 'Months');          appendTable(body, ['Token', 'Description'], rows(tv.months));
      appendH4(body, 'Years');           appendTable(body, ['Token', 'Description'], rows(tv.years));
      appendH4(body, 'Common format strings');
      appendTable(body, ['Format', 'Result'], tv.format_examples.map(function (r) { return [r.format, r.result]; }));
      appendH4(body, 'Usage examples');
      tv.usage_examples.forEach(function (e) { appendPre(body, e); });
    }},
    'time-zones': { label: 'Time zones', category: 'Time', render: function (body) {
      var tz = spl2Data.spl2_reference.dates_and_time.time_zones;
      appendP(body, tz.storage);
      appendP(body, tz.indexer_assumption);
      appendH4(body, 'Timestamp formats at index time');
      appendUl(body, tz.timestamp_formats_at_index);
      appendCallout(body, tz.consistency_note, 'note');
      appendH4(body, 'Timezone-divergent cases');
      appendUl(body, tz.timezone_divergence_cases);
      appendCallout(body, 'Best practice: ' + tz.best_practice, 'warn');
    }},
    'lexicographic-sort': { label: 'Lex sort (numbers-as-strings gotcha)', category: 'Syntax', render: function (body) {
      var lx = spl2Data.spl2_reference.sort_and_order.lexicographical_order;
      appendP(body, lx.description);
      appendH4(body, 'Rules'); appendUl(body, lx.rules);
      appendCallout(body, lx.number_sort_warning, 'warn');
      appendH4(body, 'Number sort example');
      appendTable(body, ['Unsorted', 'Lex order'], lx.number_example.unsorted.map(function (v, i) { return [v, lx.number_example.lexicographic[i]]; }));
      appendH4(body, 'Case sort example');
      appendTable(body, ['Unsorted', 'Lex order'], lx.case_example.unsorted.map(function (v, i) { return [v, lx.case_example.lexicographic[i]]; }));
      appendP(body, lx.case_example.note);
      appendH4(body, 'Commands using lex order');
      appendUl(body, lx.commands_using_lex_order);
      appendP(body, lx.custom_sort);
    }},
    'wildcards': { label: 'Wildcards (* vs LIKE %)', category: 'Syntax', render: function (body) {
      var w = spl2Data.spl2_reference.wildcards_quotes_escape.wildcards;
      appendP(body, w.description);
      appendH4(body, 'By context');
      w.wildcard_by_context.forEach(function (c) {
        appendP(body, c.context); appendUl(body, ['Use: ' + c.wildcard, 'Example: ' + c.example]);
      });
      appendP(body, w.quoting_requirement);
      appendH4(body, 'Best practices'); appendUl(body, w.best_practices);
      appendCallout(body, 'Middle wildcards: ' + w.wildcards_in_middle_warning.problem + ' Solution: ' + w.wildcards_in_middle_warning.solution, 'warn');
      appendP(body, w.wildcards_with_punctuation);
      appendH4(body, 'Examples'); w.examples.forEach(function (e) { appendPre(body, e); });
    }},
    'quotation-marks': { label: 'Quotes (single / double / backtick)', category: 'Syntax', render: function (body) {
      var q = spl2Data.spl2_reference.wildcards_quotes_escape.quotation_marks;
      appendH4(body, 'Single quotes \''); appendP(body, q.single_quotes.use_for);
      appendUl(body, q.single_quotes.examples);
      appendH4(body, 'Double quotes "'); appendP(body, q.double_quotes.use_for);
      appendUl(body, q.double_quotes.examples);
      appendH4(body, 'Backticks `'); appendP(body, q.backticks.use_for);
      appendUl(body, q.backticks.examples);
      appendH4(body, 'Field name rules'); appendUl(body, q.field_name_rules_summary);
    }},
    'escape-characters': { label: 'Escape characters', category: 'Syntax', render: function (body) {
      var ec = spl2Data.spl2_reference.wildcards_quotes_escape.escape_characters;
      appendP(body, 'Escape character: ' + ec.escape_char);
      appendH4(body, 'Alternatives'); appendUl(body, ec.alternatives);
      appendH4(body, 'Must escape');
      appendTable(body, ['Char / Sequence', 'Escape', 'Notes'], ec.must_escape.map(function (r) { return [r.char_or_seq, r.escape, r.notes]; }));
      appendH4(body, 'String values'); appendUl(body, ec.rules_by_data_type.string_values);
      appendH4(body, 'Field names');   appendUl(body, ec.rules_by_data_type.field_names);
      appendH4(body, 'Search literals'); appendUl(body, ec.rules_by_data_type.search_literals);
      appendH4(body, 'Windows path example');
      appendUl(body, ['Path: ' + ec.windows_path_example.path, 'In search: ' + ec.windows_path_example.in_search, 'As raw string: ' + ec.windows_path_example.as_raw_string]);
    }},
    'event-segmentation': { label: 'Event segmentation (tokenizer)', category: 'Syntax', render: function (body) {
      var es = spl2Data.spl2_reference.event_segmentation;
      appendP(body, es.overview);
      appendH4(body, 'Major breakers'); appendP(body, es.segmentation_levels.major_breakers.description);
      appendUl(body, es.segmentation_levels.major_breakers.characters);
      appendH4(body, 'Minor breakers'); appendP(body, es.segmentation_levels.minor_breakers.description);
      appendUl(body, es.segmentation_levels.minor_breakers.characters);
      appendH4(body, 'IP segmentation example'); appendP(body, es.example_segmentation.raw_ip_segment);
      appendH4(body, 'Quote impact');
      appendUl(body, ['With quotes: ' + es.example_segmentation.quote_impact.with_quotes, 'Without: ' + es.example_segmentation.quote_impact.without_quotes]);
      appendH4(body, 'Search implications'); appendUl(body, es.search_implications);
      appendH4(body, 'Best practices'); appendUl(body, es.best_practices);
    }},
    'regex-pcre': { label: 'Regex (PCRE)', category: 'Syntax', render: function (body) {
      var r = spl2Data.spl2_reference.expressions_and_predicates.regular_expressions;
      appendP(body, r.description);
      appendCallout(body, 'Pipe in regex: ' + r.pipe_in_regex, 'note');
      appendH4(body, 'Backslash rules'); appendUl(body, r.backslash_notes);
      appendH4(body, 'Character classes');
      appendTable(body, ['Symbol', 'Meaning'], r.character_types.map(function (c) { return [c.symbol, c.meaning]; }));
      appendH4(body, 'Quantifiers');
      appendTable(body, ['Symbol', 'Meaning'], r.quantifiers.map(function (c) { return [c.symbol, c.meaning]; }));
      appendH4(body, 'Groups');
      appendTable(body, ['Syntax', 'Meaning'], r.groups.map(function (c) { return [c.syntax, c.meaning]; }));
      appendH4(body, 'Named capture example'); appendPre(body, r.capture_group_example);
    }},
    'comments': { label: 'Comments (/* */, //, backtick)', category: 'Syntax', render: function (body) {
      var c = spl2Data.spl2_reference.comments;
      appendP(body, c.overview);
      appendCallout(body, 'Classic SPL (this tool\'s default mode) uses `comment("...")` macro syntax. The /* */ and // styles below are SPL2-only. Use whichever your stack supports.', 'warn');
      appendH4(body, 'Block /* */'); appendP(body, c.block_comments.description);
      appendUl(body, c.block_comments.examples);
      appendP(body, c.block_comments.limitation);
      appendH4(body, 'Line //'); appendP(body, c.line_comments.description);
      appendUl(body, c.line_comments.examples);
      appendH4(body, 'Keyboard shortcut');
      appendP(body, 'Win/Linux: ' + c.keyboard_shortcut_line_comment.windows_linux + ' · macOS: ' + c.keyboard_shortcut_line_comment.macos);
    }},
    'op-between': { label: 'BETWEEN ... AND', category: 'Operators', render: function (body) {
      var o = spl2Data.spl2_reference.expressions_and_predicates.predicate_expressions.operator_BETWEEN;
      appendH4(body, 'Syntax'); appendPre(body, o.syntax); appendPre(body, o.not_syntax);
      appendH4(body, 'Examples'); o.examples.forEach(function (e) { appendPre(body, e); });
    }},
    'op-in': { label: 'IN (value list)', category: 'Operators', render: function (body) {
      var o = spl2Data.spl2_reference.expressions_and_predicates.predicate_expressions.operator_IN;
      appendH4(body, 'Syntax'); appendPre(body, o.syntax); appendPre(body, o.not_syntax);
      appendH4(body, 'Examples'); o.examples.forEach(function (e) { appendPre(body, e); });
    }},
    'op-like': { label: 'LIKE (% and _ wildcards)', category: 'Operators', render: function (body) {
      var o = spl2Data.spl2_reference.expressions_and_predicates.predicate_expressions.operator_LIKE;
      appendH4(body, 'Syntax'); appendPre(body, o.syntax); appendPre(body, o.not_syntax);
      appendH4(body, 'Wildcards');
      appendUl(body, [{ term: '%', def: o.wildcards['%'] }, { term: '_', def: o.wildcards._ }]);
      appendH4(body, 'Examples'); o.examples.forEach(function (e) { appendPre(body, e); });
    }},
    'op-is': { label: 'IS / IS NULL', category: 'Operators', render: function (body) {
      var p = spl2Data.spl2_reference.expressions_and_predicates.predicate_expressions;
      appendH4(body, 'IS NULL');
      appendPre(body, p.operator_IS_NULL.syntax);
      appendPre(body, p.operator_IS_NULL.not_syntax);
      p.operator_IS_NULL.examples.forEach(function (e) { appendPre(body, e); });
      appendH4(body, 'IS data-type (SPL2)');
      appendP(body, p.operator_IS.description);
      appendPre(body, p.operator_IS.syntax);
      p.operator_IS.examples.forEach(function (e) { appendPre(body, e); });
    }},
    'op-relational': { label: 'Relational + logical operators', category: 'Operators', render: function (body) {
      var p = spl2Data.spl2_reference.expressions_and_predicates.predicate_expressions;
      appendH4(body, 'Relational');
      appendTable(body, ['Op', 'Alias', 'Meaning'], p.relational_operators.map(function (r) { return [r.op, r.alias || '', r.meaning]; }));
      appendH4(body, 'Logical');
      appendUl(body, Object.keys(p.logical_operators).map(function (k) { return { term: k, def: p.logical_operators[k].description }; }));
      appendCallout(body, 'Evaluation order in search command: ( ) → NOT → OR → AND → XOR. In from/where: ( ) → NOT → AND → OR → XOR.', 'note');
    }},
    'dataset-literals': { label: 'Dataset literals (inline data, SPL2)', category: 'SPL2 advanced', render: function (body) {
      var d = spl2Data.spl2_reference.datasets_and_dataset_literals.dataset_literals;
      appendCallout(body, 'SPL2 only. Inline datasets are not available in classic SPL.', 'warn');
      appendP(body, d.description);
      appendP(body, d.format);
      appendH4(body, 'Format rules'); appendUl(body, d.format_rules);
      appendH4(body, 'Syntax'); appendPre(body, d.syntax);
      appendH4(body, 'Examples'); d.examples.forEach(function (e) { appendPre(body, e); });
    }},
  };

  // Load both data files. Reference panel works once spl.json arrives;
  // SPL2 topics light up when spl2-reference.json arrives. One source
  // failing doesn't block the other.
  Promise.all([
    fetch('data/spl.json').then(function (r) { return r.json(); }).catch(function () { return null; }),
    fetch('data/spl2-reference.json').then(function (r) { return r.json(); }).catch(function () { return null; })
  ]).then(function (results) {
    docsData = results[0];
    spl2Data = results[1];
    buildRefEntries();
    if (docsData) { selectRefEntry('search', { openDocs: false }); }
    else if (spl2Data) { selectRefEntry('t:earliest', { openDocs: false }); }
    else { docsBody.innerHTML = '<p style="color:var(--red)">Could not load any reference.</p>'; }
  });

  function renderDocs(key) {
    docsBody.innerHTML = '';
    // SPL2 topic path
    if (key && key.indexOf('t:') === 0) {
      var topic = SPL2_TOPICS[key.slice(2)];
      if (!topic || !spl2Data) { docsBody.textContent = 'Topic not available.'; return; }
      try { topic.render(docsBody); }
      catch (e) {
        docsBody.innerHTML = '';
        var err = el('p', { text: 'Could not render this topic. Data shape may have changed.' });
        err.style.color = 'var(--red)';
        docsBody.appendChild(err);
      }
      return;
    }
    // Command path (legacy)
    if (!docsData || !docsData[key]) {
      docsBody.textContent = 'No documentation for "' + key + '".';
      return;
    }
    var d = docsData[key];
    if (d.related) {
      var topRow = el('div');
      topRow.appendChild(el('span', { cls: 'doc-related-label', text: 'See also: ' }));
      var rels = String(d.related).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      topRow.appendChild(document.createTextNode(rels.join(', ')));
      docsBody.appendChild(topRow);
    }
    if (d.description) {
      var paras = String(d.description).replace(/\\p\\/g, '\\i\\ \\i\\').split(/\\i\\/);
      paras.forEach(function (p) { if (p) appendP(docsBody, p); });
    }
    if (d.syntax) { appendH4(docsBody, 'Syntax'); appendPre(docsBody, d.syntax); }
    for (var i = 1; i <= 5; i++) {
      if (d['example' + i]) {
        appendH4(docsBody, 'Example ' + i, d['comment' + i] || null);
        appendPre(docsBody, d['example' + i]);
      }
    }
  }

  editor.onDidChangeCursorPosition(function (e) {
    if (mode !== 'spl' || !docsData) return;
    var cmd = commandAt(e.position);
    if (docsData[cmd]) {
      // Update combobox + docs but DO NOT auto-open the docs pane.
      selectRefEntry(cmd, { openDocs: false });
    }
  });
  editor.onDidChangeModelContent(function () {
    rebuildSplTokens();
    updateUrlHash();
  });

  // ---- Theme switcher
  document.querySelectorAll('[data-theme-set]').forEach(function (btn) {
    btn.addEventListener('click', function () { applyTheme(btn.getAttribute('data-theme-set')); });
  });

  function applyTheme(name) {
    theme = (name === 'dark' || name === 'light' || name === 'catppuccin') ? name : 'catppuccin';
    if (theme === 'catppuccin') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    var monacoTheme = (theme === 'catppuccin') ? 'splforge-mocha'
                    : (theme === 'dark')       ? 'splforge-dark'
                                               : 'splforge-light';
    monaco.editor.setTheme(monacoTheme);
    document.querySelectorAll('[data-theme-set]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-theme-set') === theme);
    });
    try { localStorage.setItem('splforge.theme', theme); } catch (e) {}
    updateUrlHash();
  }

  // ---- Mode switcher (sidebar nav + app-bar tabs)
  function applyMode(name) {
    mode = (name === 'xml') ? 'xml' : 'spl';
    var lang = (mode === 'spl') ? 'spl' : 'xml';
    monaco.editor.setModelLanguage(model, lang);

    document.querySelectorAll('[data-mode]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-mode') === mode);
    });

    var topbarTitle = document.getElementById('topbarTitle');
    topbarTitle.textContent = (mode === 'spl') ? 'Search SPL' : 'Dashboard XML';

    document.getElementById('docsPane').classList.toggle('hidden', mode !== 'spl');
    ['splOnlyTools', 'splOnlyDivider', 'splOnlyEditorSection', 'splOnlyEditorList'].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) n.style.display = (mode === 'spl') ? '' : 'none';
    });

    try { localStorage.setItem('splforge.mode', mode); } catch (e) {}
    rebuildSplTokens();
    updateUrlHash();
  }

  document.querySelectorAll('[data-mode]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      applyMode(el.getAttribute('data-mode'));
    });
  });

  // ---- Actions
  function showToast(msg, kind) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show' + (kind ? ' ' + kind : '');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { t.className = 'toast'; }, 2000);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      try { document.execCommand('copy'); resolve(); }
      catch (e) { reject(e); }
      finally { document.body.removeChild(ta); }
    });
  }

  function copyAsRich() {
    editor.focus();
    editor.setSelection(new monaco.Range(1, 1, 100000, 1));
    editor.trigger('source', 'editor.action.clipboardCopyAction');
    showToast('Copied with formatting', 'success');
  }

  function copyAsHtml() {
    var langForCopy = (mode === 'spl') ? 'spl' : 'xml';
    var coloredP = monaco.editor.colorize(model.getValue(), langForCopy, { tabSize: 2 });
    var cssText = '';
    document.querySelectorAll('style.monaco-colors, .monaco-colors').forEach(function (el) {
      cssText += el.textContent || '';
    });
    var stylemap = {};
    cssText.replace(/\.(\S+)\s*\{([^}]+)\}/g, function (_, sel, body) {
      stylemap[sel] = String(body).trim();
      return '';
    });
    var ed = host.querySelector('.monaco-editor');
    var fg = ed ? getComputedStyle(ed).color : '#cdd6f4';
    var bg = ed ? getComputedStyle(ed).backgroundColor : '#11111b';
    coloredP.then(function (html) {
      var inlined = html.replace(/<span class="([^"]+)">/g, function (_, classes) {
        var parts = classes.split(/\s+/);
        var s = '<span style="';
        parts.forEach(function (c) {
          if (stylemap[c]) {
            s += stylemap[c];
            if (!/;\s*$/.test(stylemap[c])) s += ';';
          }
        });
        return s + '">';
      });
      var wrapper = "<div style=\"font-family: 'JetBrains Mono', Consolas, monospace; font-size: 14px; line-height: 22px; color:" + fg + "; background:" + bg + "; padding:12px; border-radius:6px;\">" + inlined + "</div>";
      copyText(wrapper).then(function () { showToast('HTML copied', 'success'); },
                              function () { showToast('Copy failed', 'error'); });
    });
  }

  function copyAsPlain() {
    copyText(model.getValue()).then(
      function () { showToast('Plain text copied', 'success'); },
      function () { showToast('Copy failed', 'error'); }
    );
  }

  function clearEditor() {
    model.setValue('');
    editor.focus();
  }

  // tryDecodeURL: parse a string as either form and return a structured
  // result, or null if it isn't a decodable URL. No side effects.
  // Theme/mode allow-list is enforced here so callers can't accidentally
  // drive state into a bad value.
  function tryDecodeURL(str) {
    // Clean common paste artifacts before strict URL parsing:
    //  1. Strip embedded whitespace, line-wrapped paste from email/Slack
    //     puts newlines/tabs inside what should be one contiguous URL.
    //  2. If there's junk around the URL (subject line, "Here's the link:",
    //     trailing punctuation), grab the http(s)/file substring only.
    //  3. new URL() is permissive about () and [] in modern browsers, but
    //     still rejects raw |, ^, {, }, <, >, `, \, percent-encode those
    //     on the fallback try.
    var cleaned = String(str).replace(/\s+/g, '');
    var urlSub = cleaned.match(/(?:https?|file):\/\/\S+/);
    if (urlSub) cleaned = urlSub[0];

    var a = null;
    try { a = new URL(cleaned); } catch (e) {}
    if (!a) {
      var encoded = cleaned.replace(/[\^|{}<>`\\]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
      });
      try { a = new URL(encoded); } catch (e2) { return null; }
    }

    // Form 1: ?q=<encoded SPL>  (Splunk app URL)
    if (a.search) {
      var q = new URLSearchParams(a.search).get('q');
      if (q) {
        try { return { kind: 'q', src: decodeURIComponent(q) }; }
        catch (e) { return null; }
      }
    }

    // Form 2: #<theme>,<mode>,<encoded source>  (SPL Forge share link)
    if (a.hash && a.hash.length > 1) {
      var raw = a.hash.replace(/^#/, '');
      var parts = raw.match(/^([^,]+),([^,]+),([\s\S]*)$/);
      if (parts) {
        var t = parts[1], m = parts[2];
        if (!/^(catppuccin|dark|light)$/.test(t)) return null;
        if (!/^(spl|xml)$/.test(m))                return null;
        try { return { kind: 'hash', theme: t, mode: m, src: decodeURIComponent(parts[3]) }; }
        catch (e) { return null; }
      }
    }
    return null;
  }

  // Decode action:
  //   1. Clipboard preferred, if it holds a decodable URL, APPEND the
  //      decoded source to the editor (so the user's working content
  //      survives). Theme/mode from a share link are NOT auto-applied
  //      when appending, switching them mid-work would be jarring.
  //   2. Fallback, if the clipboard is empty/denied/non-URL, decode the
  //      editor itself and REPLACE its contents (since "the editor IS
  //      the URL I pasted to decode" is the original flow).
  //
  // Security posture:
  //   - No length cap. Browser + Monaco handle arbitrary text. The
  //     decoder never fetches from the URL, it only parses it.
  //   - Theme and mode are validated against literal allow-lists.
  //   - Source goes through Monaco setValue / append (text only). No
  //     innerHTML, no eval, no script context, '<script>' renders
  //     as visible text.
  //   - clipboard.readText() may prompt or throw on permission denial;
  //     either way we silently fall back to editor decoding.
  function decodeFromUrl() {
    var run = function (clipText) {
      var fromClipboard = clipText && clipText.trim();
      if (fromClipboard) {
        var cbResult = tryDecodeURL(fromClipboard);
        if (cbResult) {
          var cur = model.getValue();
          var sep = cur && !/\s$/.test(cur) ? '\n\n' : '';
          model.setValue(cur + sep + cbResult.src);
          showToast('Appended from clipboard', 'success');
          return;
        }
      }
      // Fallback: decode whatever is in the editor (replace flow)
      var contents = (model.getValue() || '').trim();
      if (!contents) { showToast('Nothing to decode', 'error'); return; }
      var edResult = tryDecodeURL(contents);
      if (!edResult) {
        var a;
        try { a = new URL(contents); }
        catch (e) { showToast('Not a valid URL', 'error'); return; }
        showToast('No decodable content in URL', 'error');
        return;
      }
      if (edResult.kind === 'q') {
        applyMode('spl');
        model.setValue(edResult.src);
        showToast('Decoded q= param', 'success');
      } else {
        applyTheme(edResult.theme);
        applyMode(edResult.mode);
        model.setValue(edResult.src);
        showToast('Loaded from share link', 'success');
      }
    };

    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(run, function () { run(''); });
    } else {
      run('');
    }
  }

  function copyShareLink() {
    updateUrlHash();
    copyText(window.location.href).then(
      function () { showToast('Share link copied', 'success'); },
      function () { showToast('Copy failed', 'error'); }
    );
  }

  // SPL autoformat, port of legacy reformatCode().
  function autoformat() {
    if (mode !== 'spl') {
      showToast('Autoformat is SPL-only', 'error');
      return;
    }
    var contents = model.getValue();
    var tokenized = monaco.editor.tokenize(contents, 'spl');
    var indent = 0;
    var deleteNextWhite = true;
    var doNewLine = false;
    var breakOnNext = false;
    var prevTok = '';
    var out = '';
    for (var i = 0; i < tokenized.length; i++) {
      for (var j = 0; j < tokenized[i].length; j++) {
        doNewLine = false;
        if ((deleteNextWhite || breakOnNext) && tokenized[i][j].type === 'white.spl') continue;
        deleteNextWhite = false;
        if (breakOnNext) doNewLine = true;
        breakOnNext = false;
        if (tokenized[i][j].type === 'macro.comment.wrap.close.spl') breakOnNext = true;
        if (tokenized[i][j].type === 'pipe.spl' && prevTok !== 'subsearch.start.spl') doNewLine = true;
        if (tokenized[i][j].type === 'macro.comment.wrap.open.spl') {
          if (prevTok !== 'macro.comment.wrap.close.spl') out += '\n';
          doNewLine = true;
        }
        if (tokenized[i][j].type === 'subsearch.start.spl') { indent++; doNewLine = true; }
        if (tokenized[i][j].type === 'subsearch.end.spl') { indent = Math.max(0, indent - 1); breakOnNext = true; }

        var endPos = (j + 1) < tokenized[i].length
          ? tokenized[i][j + 1].offset
          : model.getLineLength(i + 1);
        var tok = model.getValueInRange(new monaco.Range(i + 1, tokenized[i][j].offset + 1, i + 1, endPos + 1));

        if (doNewLine) {
          out += '\n' + '  '.repeat(indent);
          deleteNextWhite = true;
        }
        if (tokenized[i][j].type === 'white.spl') out += ' ';
        else out += tok;

        if (tokenized[i][j].type === 'pipe.spl') {
          out += ' ';
          deleteNextWhite = true;
        }
        if (tokenized[i][j].type !== 'white.spl') prevTok = tokenized[i][j].type;
      }
    }
    out = out.replace(/^\s+/, '');
    editor.executeEdits('autoformat', [{ identifier: 'delete', range: new monaco.Range(1, 1, 100000, 1), text: '', forceMoveMarkers: true }]);
    editor.executeEdits('autoformat', [{ identifier: 'insert', range: new monaco.Range(1, 1, 1, 1), text: out, forceMoveMarkers: true }]);
    showToast('Formatted', 'success');
  }

  // Bind action buttons (sidebar + app-bar share handlers)
  function bind(id, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', function (e) { e.preventDefault(); fn(); });
  }
  bind('appAutoformat', autoformat);
  bind('appCopyRich',   copyAsRich);
  bind('appCopyHtml',   copyAsHtml);
  bind('appCopyText',   copyAsPlain);
  bind('appDecode',     decodeFromUrl);
  bind('appClear',      clearEditor);
  bind('appShare',      copyShareLink);

  // ---- Time picker
  //
  // Two paths into "insert at cursor":
  //   1. Relative chips (-1h, -24h, @d, now(), ...), instant, no format
  //      conversion. Click chip → ask whether earliest= or latest= via
  //      the two footer buttons. Sticky last-clicked relative value held
  //      in pickerState.lastRel.
  //   2. Absolute datetime-local input + format radio, convert to
  //      Splunk MM/DD/YYYY:HH:MM:SS / ISO / epoch, then earliest/latest.
  //
  // Everything goes through editor.executeEdits at the current cursor
  // selection, so the surrounding query text is preserved.
  var timePopover = document.getElementById('timePopover');
  // Button moved from app-bar to sidebar (id=actInsertTime). When anchoring
  // the popover, prefer the sidebar trigger; null-safe in case the sidebar
  // is collapsed off-canvas at narrow widths.
  var timePickerBtn = document.getElementById('actInsertTime');
  var pickerState = { lastRel: null };

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function formatAbsolute(fmt) {
    var inp = document.getElementById('timePickerInput');
    if (!inp.value) return null;
    var d = new Date(inp.value);
    if (isNaN(d.getTime())) return null;
    if (fmt === 'epoch') return String(Math.floor(d.getTime() / 1000));
    if (fmt === 'iso') return d.toISOString();
    // Splunk default: MM/DD/YYYY:HH:MM:SS using local components
    return pad2(d.getMonth() + 1) + '/' + pad2(d.getDate()) + '/' + d.getFullYear()
         + ':' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  function getSelectedFormat() {
    var sel = document.querySelector('input[name="tfmt"]:checked');
    return sel ? sel.value : 'splunk';
  }

  function buildInsertText(field, valueOverride) {
    // valueOverride wins if provided (chip click). Otherwise read absolute
    // picker through the format radio.
    var value = valueOverride;
    if (value == null) {
      value = formatAbsolute(getSelectedFormat());
      if (value == null) {
        showToast('Pick a date and time first', 'error');
        return null;
      }
      // Splunk and ISO formats need quoting because they contain : and -
      var fmt = getSelectedFormat();
      if (fmt === 'splunk' || fmt === 'iso') value = '"' + value + '"';
    }
    if (field === 'raw') return value;
    return field + '=' + value;
  }

  function insertAtCursor(text) {
    if (!text) return;
    var sel = editor.getSelection();
    // If selection collapsed: insert at cursor. If not: replace selection.
    // executeEdits handles both via the range.
    editor.executeEdits('time-insert', [{
      range: new monaco.Range(sel.startLineNumber, sel.startColumn, sel.endLineNumber, sel.endColumn),
      text: text,
      forceMoveMarkers: true
    }]);
    editor.focus();
  }

  function openTimePopover() {
    timePopover.hidden = false;
    var btnRect = timePickerBtn ? timePickerBtn.getBoundingClientRect() : null;
    // Sidebar button: anchor popover to the RIGHT of it (in the main
    // editor area) at the button's vertical position. Falls back to
    // top-left if no anchor available.
    var top  = 80;
    var left = 260;
    if (btnRect) {
      top  = btnRect.top;
      left = btnRect.right + 10;
    }
    // Keep inside viewport
    var maxLeft = window.innerWidth  - timePopover.offsetWidth  - 12;
    var maxTop  = window.innerHeight - timePopover.offsetHeight - 12;
    if (left > maxLeft) left = maxLeft;
    if (top  > maxTop)  top  = maxTop;
    if (top  < 12)      top  = 12;
    timePopover.style.top  = top  + 'px';
    timePopover.style.left = left + 'px';
    // Default datetime input to "now" if unset (browser-local time, second precision)
    var inp = document.getElementById('timePickerInput');
    if (!inp.value) {
      var n = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
      inp.value = n.toISOString().slice(0, 19);
    }
    pickerState.lastRel = null;
  }
  function closeTimePopover() { timePopover.hidden = true; }

  // Help toggle inside the popover. Persisted only for this open session, 
  // closing the popover resets to hidden so first-time users don't have
  // a wall of text on subsequent opens.
  var helpBtn  = document.getElementById('timePopoverHelp');
  var helpBody = document.getElementById('timePopoverHelpBody');
  if (helpBtn && helpBody) {
    helpBtn.addEventListener('click', function () {
      var open = helpBody.hidden;
      helpBody.hidden = !open;
      helpBtn.setAttribute('aria-pressed', open ? 'true' : 'false');
    });
  }

  bind('actInsertTime', function () {
    if (timePopover.hidden) openTimePopover();
    else closeTimePopover();
  });
  bind('timePopoverClose', function () {
    closeTimePopover();
    // Reset help to closed so next open is clean
    if (helpBody) helpBody.hidden = true;
    if (helpBtn)  helpBtn.setAttribute('aria-pressed', 'false');
  });

  // Close on outside click (but not on the toggle button or inside popover)
  document.addEventListener('mousedown', function (e) {
    if (timePopover.hidden) return;
    if (timePopover.contains(e.target)) return;
    if (timePickerBtn.contains(e.target)) return;
    closeTimePopover();
  });

  // Chip click stores the relative value for the next insert button click
  ['timeChipsRelative', 'timeChipsSnap'].forEach(function (id) {
    var host = document.getElementById(id);
    if (!host) return;
    host.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-rel]');
      if (!b) return;
      pickerState.lastRel = b.getAttribute('data-rel');
      // Visual ack, flash border on selected chip
      host.querySelectorAll('button').forEach(function (x) { x.style.borderColor = ''; });
      b.style.borderColor = 'var(--sapphire)';
    });
  });

  function insertForField(field) {
    var override = null;
    if (pickerState.lastRel) {
      override = pickerState.lastRel;
      // Relative values like now() don't need quotes; snap/offset don't either.
      // Only quote Splunk absolute or ISO output (handled in buildInsertText).
    }
    var text = buildInsertText(field, override);
    if (text == null) return;
    // Add a leading space if the cursor is mid-line and previous char isn't whitespace
    var pos = editor.getPosition();
    if (pos && pos.column > 1) {
      var lineText = model.getLineContent(pos.lineNumber);
      var prev = lineText.charAt(pos.column - 2);
      if (prev && !/\s/.test(prev)) text = ' ' + text;
    }
    insertAtCursor(text);
    closeTimePopover();
    showToast('Inserted ' + (field === 'raw' ? 'time' : field + '='), 'success');
  }

  bind('timeInsertEarliest', function () { insertForField('earliest'); });
  bind('timeInsertLatest',   function () { insertForField('latest'); });
  bind('timeInsertRaw',      function () { insertForField('raw'); });

  // XML mode hides SPL-only tools (Autoformat, Insert time). Toggle here too.
  // (applyMode sets splOnlyTools display; mirror for the new group.)

  // Cmd/Ctrl + |
  window.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === '|' || e.which === 220)) {
      e.preventDefault();
      autoformat();
    }
  });

  // ---- Docs collapse/expand
  // Default closed. Persisted across reloads in sessionStorage so a
  // user who opens the panel doesn't have to re-open it on every
  // navigation, but the choice doesn't outlive the tab.
  var docsPane = document.getElementById('docsPane');
  var docsToggle = document.getElementById('docsToggle');
  var docsToggleLabel = docsToggle.querySelector('.docs-toggle-label');

  function setDocsOpen(open) {
    docsPane.classList.toggle('open', !!open);
    docsToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    docsToggleLabel.textContent = open ? 'Hide reference' : 'Show reference';
    // No inline-style cleanup needed: the resize height lives in the
    // --docs-h custom property which is only read by the .open rule. The
    // dragged height is therefore preserved across open/close and never
    // bleeds into the collapsed state.
    try { sessionStorage.setItem('splforge.docsOpen', open ? '1' : '0'); } catch (e) {}
  }
  var docsOpenInitial = false;
  try { docsOpenInitial = sessionStorage.getItem('splforge.docsOpen') === '1'; } catch (e) {}
  setDocsOpen(docsOpenInitial);

  docsToggle.addEventListener('click', function () {
    setDocsOpen(!docsPane.classList.contains('open'));
  });
  // Combobox handles its own openDocs flag via selectRefEntry(id, {openDocs}),
  // so no global change listener needed here. Cursor-follow uses openDocs:false,
  // explicit dropdown picks use openDocs:true.

  // ---- Docs resize drag
  var resize = document.getElementById('docsResize');
  resize.addEventListener('mousedown', function (e) {
    e.preventDefault();
    var startY = e.clientY;
    var startHeight = docsPane.getBoundingClientRect().height;
    function move(ev) {
      var delta = startY - ev.clientY;
      var h = Math.max(120, Math.min(window.innerHeight * 0.7, startHeight + delta));
      // Drive open height via a custom property read only by .docs-pane.open.
      // Never set inline flex-basis/max-height, those would leak into the
      // closed state and leave the header strip floating in empty space.
      docsPane.style.setProperty('--docs-h', h + 'px');
    }
    function up() {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    }
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });

  // ---- Mobile menu
  document.getElementById('menuToggle').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // ---- URL hash
  function updateUrlHash() {
    var hash = '#' + theme + ',' + mode + ',' + encodeURIComponent(model.getValue());
    if (history.replaceState) history.replaceState(null, '', hash);
    else location.hash = hash;
  }
  window.parseHash = parseHash; // exposed for resetEditor
  function parseHash() {
    var h = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!h) return null;
    var m = h.match(/^([^,]+),([^,]+),([\s\S]*)$/);
    if (!m) return null;
    return { theme: m[1], mode: m[2], src: m[3] };
  }

  rebuildSplTokens();
  updateUrlHash();
}

// Used by index.html sidebar-brand click, clear editor + URL.
function resetEditor(e) {
  e.preventDefault();
  history.replaceState(null, '', location.pathname);
  location.reload();
}
