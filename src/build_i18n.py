"""Build i18n.js: Russian UI string -> [English, German] dictionary (index-aligned with i18n_ru.json)."""
import json, os
H = os.path.dirname(os.path.abspath(__file__))
ru = json.load(open(os.path.join(H, 'i18n_ru.json'), encoding='utf-8'))
d = {}
for line in open(os.path.join(H, 'i18n_tr.txt'), encoding='utf-8'):
    line = line.rstrip('\n')
    if not line:
        continue
    i, en, de = line.split('|', 2)
    if en == '-':
        continue
    d[ru[int(i)]] = [en, de]
open(os.path.join(H, 'i18n.js'), 'w', encoding='utf-8').write('const I18N = ' + json.dumps(d, ensure_ascii=False) + ';\n')
print('i18n entries', len(d), 'of', len(ru))
