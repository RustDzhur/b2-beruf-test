"""Build i18n.js: Russian UI string -> [en, de, fr, tr, ar, it] plus pattern rules.
Sources: i18n_ru.json (index -> Russian), i18n_meta.json (ids of extras and rules), i18n_src.txt (id|EN|DE),
i18n_fr.txt, i18n_trk.txt, i18n_ar.txt, i18n_it.txt (id|translation). A missing translation falls back to English."""
import json, os
H = os.path.dirname(os.path.abspath(__file__))
rd = lambda n: open(os.path.join(H, n), encoding='utf-8')
ru = json.load(rd('i18n_ru.json'))
meta = json.load(rd('i18n_meta.json'))
src = {}
for line in rd('i18n_src.txt'):
    line = line.rstrip('\n')
    if line:
        i, en, de = line.split('|', 2)
        src[i] = [en, de]
extra_lang = {}
for code, fn in (('fr', 'i18n_fr.txt'), ('tr', 'i18n_trk.txt'), ('ar', 'i18n_ar.txt'), ('it', 'i18n_it.txt')):
    d = {}
    if os.path.exists(os.path.join(H, fn)):
        for line in rd(fn):
            line = line.rstrip('\n')
            if '|' in line:
                i, t = line.split('|', 1)
                d[i] = t
    extra_lang[code] = d
def row(i):
    en, de = src[i]
    return [en, de] + [extra_lang[c].get(i) or en for c in ('fr', 'tr', 'ar', 'it')]
dic = {}
for i in src:
    if i.isdigit():
        dic[ru[int(i)]] = row(i)
for xid, key in meta['extra'].items():
    dic[key] = row(xid)
rules = [[rx, row(rid)] for rid, rx in meta['rules'].items()]
miss = {c: sum(1 for i in src if i not in d) for c, d in extra_lang.items()}
open(os.path.join(H, 'i18n.js'), 'w', encoding='utf-8').write('const I18N = ' + json.dumps(dic, ensure_ascii=False) + ';\nconst I18N_RULES = ' + json.dumps(rules, ensure_ascii=False) + ';\n')
print('i18n entries', len(dic), 'rules', len(rules), 'missing', miss)
