# SPL Forge

A browser-based syntax editor for Splunk SPL searches and dashboard XML.
Static site, no build step, runs anywhere you can serve a folder
(including GitHub Pages).

The SPL tokenizer and command reference are written from scratch for this
project. On top of the editor it adds a searchable command reference, a
time-modifier inserter, copy as rich text, an autoformatter, and three
themes. No build, no jQuery, no analytics, no external calls.

## Features

- **Syntax-highlighted SPL editor** (Monaco) with a dashboard XML mode
  for `<form>` / `<dashboard>` editing
- **Searchable reference**, type-to-filter combobox covering pipe
  commands plus SPL2 topics: time modifiers (earliest/latest, relative
  time units + snap-to), time spans, strftime tokens, time zones,
  lexicographic-sort gotchas, wildcards, quoting, escaping, event
  segmentation, regex, operators (BETWEEN/IN/LIKE/IS), and more. All
  data is local, no network calls.
- **Insert time…**, popover with relative-time chips (`-1h`, `-24h`,
  `@d`, `@w0`, `now()`, etc.) and an absolute date/time picker with
  three output formats (Splunk `MM/DD/YYYY:HH:MM:SS`, ISO 8601, UNIX
  epoch). Inserts `earliest=` / `latest=` / raw at the cursor without
  disturbing the surrounding query.
- **Autoformat** (`Cmd/Ctrl + |`), pipes onto new lines, subsearches
  indented
- **Copy** as rich text, HTML, or plain text
- **Decode URL**, paste a Splunk `?q=` URL or an SPL Forge share link
  (or have one on the clipboard) and pull the SPL back out into the
  editor
- **Share link**, current theme, mode, and source encode into the URL
  hash so a copied address restores the exact state
- **Three themes**, Catppuccin Mocha (default), Dark, Light, selected
  via the `data-theme` attribute on `<html>`. Native form controls and
  scrollbars follow the theme via `color-scheme`.

## Run it

```bash
python3 -m http.server 8888
# open http://localhost:8888/
```

No build, no dependencies to install, Monaco is vendored under
`lib/monaco-editor/min/`.

## Deploy to GitHub Pages

1. Push to a repo.
2. Settings → Pages → deploy from the `main` branch, root folder.
3. The included `.nojekyll` file makes Pages serve the vendored Monaco
   files as-is (Jekyll otherwise skips paths that start with `_`).

## Layout

```
spl-forge/
├── index.html
├── .nojekyll
├── LICENSE
├── css/
│   ├── toolkit.css           # theme tokens + sidebar/topbar chrome
│   └── editor.css            # Monaco surface, app-bar, docs panel, popover
├── js/
│   ├── theme-boot.js         # pre-paint theme set (no flash)
│   ├── app.js                # main wiring
│   └── spl_language.js       # SPL Monarch tokenizer (original)
├── data/
│   ├── spl.json              # pipe command reference
│   └── spl2-reference.json   # syntax / time / operators / regex reference
└── lib/
    └── monaco-editor/        # vendored Monaco (minified)
```

## Storage

Two localStorage keys + one sessionStorage key, all UI preference only, 
no query content is ever persisted:

- `localStorage['splforge.theme']`, current theme
- `localStorage['splforge.mode']`, last mode (`spl` or `xml`)
- `sessionStorage['splforge.docsOpen']`, reference panel open/closed

The URL hash carries `theme,mode,encoded-source` for share links.

## Decode safety

Decode is built to be safe to receive from anyone:

- It only **parses** a URL, never **fetches** from it, host, port, and
  protocol are irrelevant.
- Theme and mode are validated against literal allow-lists; anything
  else is rejected before any state changes.
- Decoded source goes through Monaco's `setValue` as plain text, no
  `innerHTML`, no `eval`. A `<script>` in the source renders as visible
  characters, not executable code.

## Credits

- **[Monaco Editor](https://github.com/microsoft/monaco-editor)** by
  Microsoft, licensed MIT (see `lib/monaco-editor/LICENSE`).
- The SPL tokenizer (`js/spl_language.js`) and the command and syntax
  references (`data/spl.json`, `data/spl2-reference.json`) are original
  work written for this project, informed by Splunk's public
  documentation. No documentation text is copied.
- Not affiliated with or endorsed by Splunk. "Splunk" and "SPL" are
  trademarks of their respective owner, referenced here only to describe
  what the tool works with.

## License

[MIT](LICENSE). Use it however you want, just keep the copyright notice.
