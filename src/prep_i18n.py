"""One-off: build i18n_src.txt (id|EN|DE) and rules/extra json from the current d3_i18n.js and i18n_tr.txt."""
import re, json, os
H = os.path.dirname(os.path.abspath(__file__))
js = open(os.path.join(H, 'd3_i18n.js'), encoding='utf-8').read()
ru = json.load(open(os.path.join(H, 'i18n_ru.json'), encoding='utf-8'))
src = []  # (id, en, de)
for line in open(os.path.join(H, 'i18n_tr.txt'), encoding='utf-8'):
    line = line.rstrip('\n')
    if line:
        i, en, de = line.split('|', 2)
        if en != '-': src.append((i, en, de))
# EXTRA
ex = re.search(r'const EXTRA = \{(.*?)\};\nconst PREFIX_KEYS', js, re.S).group(1)
extra = {}
for m in re.finditer(r'"((?:[^"\\]|\\.)*)": \["((?:[^"\\]|\\.)*)", "((?:[^"\\]|\\.)*)"\]', ex):
    k, en, de = (json.loads('"%s"' % x) for x in m.groups())
    extra[k] = (en, de)
for n, (k, (en, de)) in enumerate(extra.items()):
    src.append(('x%d' % n, en, de))
# RULES
rules = []
rb = re.search(r'const RULES = \[\n(.*?)\n\];', js, re.S).group(1)
for line in rb.split('\n'):
    m = re.match(r'\s*\[/(.*)/, \(m(?:, t)?\) => \[`(.*?)`, `(.*?)`\]\],?$', line)
    assert m, line
    rx, en, de = m.groups()
    f = lambda s: re.sub(r'\$\{t\(m\[(\d)\]\)\}', r'{~\1}', re.sub(r'\$\{m\[(\d)\]\}', r'{\1}', s))
    rules.append((rx, f(en), f(de)))
for n, (rx, en, de) in enumerate(rules):
    src.append(('r%d' % n, en, de))
json.dump({'extra': {f'x{n}': k for n, k in enumerate(extra)}, 'rules': {f'r{n}': r[0] for n, r in enumerate(rules)}}, open(os.path.join(H, 'i18n_meta.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(H, 'i18n_src.txt'), 'w', encoding='utf-8').write(''.join(f'{i}|{en}|{de}\n' for i, en, de in src))
print(len(src), 'lines;', len(extra), 'extra;', len(rules), 'rules')
