#!/usr/bin/env python3
"""Rebuilds the C24 table in data/baseline.js: real county names, vote totals and 2024 presidential margins for states
that have no 2026 county feed (everything not listed in CREAL).

Source CSV: https://raw.githubusercontent.com/tonmcg/US_County_Level_Election_Results_08-24/master/2024_US_County_Level_Presidential_Results.csv
Usage: python3 tools/gen_counties.py path/to/2024_US_County_Level_Presidential_Results.csv
"""
import csv, json, re, sys, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = os.path.join(root, 'data', 'baseline.js')
src = open(path, encoding='utf-8').read()
creal = json.loads(re.search(r'^const CREAL=(\{.*?\});$', src, re.M).group(1))
AB = {'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA','Colorado':'CO','Connecticut':'CT','Delaware':'DE','District of Columbia':'DC','Florida':'FL','Georgia':'GA','Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS','Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS','Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA','Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY'}
out = {}
for r in csv.DictReader(open(sys.argv[1], encoding='utf-8')):
    a = AB.get(r['state_name'])
    if not a or a in creal: continue
    t = int(float(r['total_votes']))
    if t <= 0: continue
    out.setdefault(a, []).append([r['county_name'], t, round((int(float(r['votes_dem'])) - int(float(r['votes_gop']))) / t, 4), r['county_fips']])
for a in out: out[a].sort(key=lambda x: -x[1])
line = 'const C24=' + json.dumps(out, separators=(',', ':')) + ';'
src = re.sub(r'^const C24=.*;$', lambda m: line, src, flags=re.M)
open(path, 'w', encoding='utf-8').write(src)
print('C24:', len(out), 'states,', sum(len(v) for v in out.values()), 'counties')
