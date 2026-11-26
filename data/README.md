# Data files

| File | What | How to update |
|---|---|---|
| `baseline.js` | `BASE` (state and district baselines), `CREAL` (real 2026 county data, 18 states), `C24` (2024 county data, other states) | Edit by hand for `BASE` and `CREAL`; `python3 tools/gen_counties.py <csv>` rebuilds `C24` |
| `geo.js` | State and county outlines, label positions, county centroids | `node tools/gen_geo.js` (needs `us-atlas`, `topojson-client`, `polylabel`) |
| `candidates.js` | 2026 candidates: Senate, governor, House, by state and district | Edit by hand when nominees change |

Each file is a plain script that defines a global, so the site works from `file://` with no server.
For a new election cycle: replace `BASE`/`CREAL`, update `candidates.js`, bump the version, and check `GM.STATE_ATTR` in `js/game-data.js`.
