# Election Night Desk

A US electoral simulator. Build a candidate, run a campaign in the 2026 midterms or a 2028 election, then watch the count come in county by county.

## Run it
Open `index.html` in a browser. No build step, no server.

## Layout
```
index.html          markup and the script load order (the single source of truth for order)
css/style.css
js/                 engine, game data, campaign logic, UI
data/               baseline results, county and state outlines, candidates (see data/README.md)
tools/              bundle.py (single-file build), gen_geo.js, gen_counties.py
tests/              sim.js (Node, no browser), smoke.js (Playwright)
```
Files share one global scope, so order in `index.html` matters.

## Develop
- `node tests/sim.js` runs engine and campaign checks.
- `npm i && npx playwright install chromium && node tests/smoke.js` runs the browser flow.
- `python3 tools/bundle.py` writes one self-contained file to `dist/`; `--artifact` writes the claude.ai Artifact format.
- Add `#debug` to the URL to expose `window.__demo` and `window.__game`.

## Release
1. Update data if needed. 2. Bump `js/version.js`. 3. Add a `CHANGELOG.md` entry. 4. `node tests/sim.js`. 5. Push to `main`; the workflow in `.github/workflows/pages.yml` tests and deploys to GitHub Pages (set Pages source to "GitHub Actions").

See `CREDITS.md` for data sources and caveats. No license is set yet; add one before making the repo public.
