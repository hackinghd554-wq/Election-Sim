#!/usr/bin/env python3
"""Bundle the split site into one self-contained HTML file.

  python3 tools/bundle.py                 -> dist/election-night-desk.html  (works offline, double-click)
  python3 tools/bundle.py --artifact      -> dist/artifact.html             (fragment format for claude.ai Artifacts)

Reads index.html as the single source of truth for the script order and inlines css/ and js/ and data/ files.
"""
import re, sys, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rd = lambda p: open(os.path.join(root, p), encoding='utf-8').read()
html = rd('index.html')
def css(m):  return '<style>\n' + rd(m.group(1)) + '\n</style>'
def js(m):
    s = rd(m.group(1))
    assert '</script' not in s.lower(), m.group(1) + ' contains a closing script tag'
    return '<script>\n' + s + '\n</script>'
html = re.sub(r'<link rel="stylesheet" href="((?:css)/[^"]+)">', css, html)
html = re.sub(r'<script src="([^"]+)"></script>', js, html)
os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
if '--artifact' in sys.argv:
    # Artifact pages are fragments: no doctype/html/head/body wrappers, title and meta first.
    title = re.search(r'<title>.*?</title>', html).group(0)
    fonts = re.search(r'<link rel="stylesheet" href="https://fonts[^>]+>', html).group(0)
    styles = ''.join(re.findall(r'<style>.*?</style>', html, re.S))
    body = re.search(r'<body>(.*)</body>', html, re.S).group(1)
    out = title + '\n<meta name="claude:viewport-fit-sides" content="cover">\n' + fonts + '\n' + styles + '\n' + body
    path = 'dist/artifact.html'
else:
    out = html
    path = 'dist/election-night-desk.html'
open(os.path.join(root, path), 'w', encoding='utf-8').write(out)
print(path, len(out) // 1024, 'KB')
