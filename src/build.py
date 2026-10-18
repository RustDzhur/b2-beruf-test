import json, re, sys
import lesen, hoeren_spec, schreiben, rest
D = {}
D.update(lesen.build()); D.update(hoeren_spec.build()); D.update(schreiben.build())
D['N'] = rest.notiz(); D['F'] = rest.forum(); import sprechen_data as SD
seg = lambda m: [{'who': w, 't': t, 'g': 'f' if w == 'A' else 'm'} for w, t in m]
D['SP3'] = [dict(s, id='SP3-%d' % s['n'], model=seg(SD.M3[s['n']])) for s in rest.sprechen()]
D['SP2'] = [dict(n=i + 1, id='SP2-%d' % (i + 1), title=x['title'], situation=x['situation'], points=x['points'], model=seg(x['model'])) for i, x in enumerate(SD.T2)]
D['SP1'] = [dict(n=i + 1, id='SP1-%d' % (i + 1), title=x['title'], points=x['points'], model=[{'who': '', 't': p, 'g': 'm'} for p in x['model'].split('\n\n')]) for i, x in enumerate(SD.T1)]
from core import L, paras
D['F_MODEL'] = '\n'.join(paras([l.strip() for l in L[108:118]])) .replace(' Einerseits', '\nEinerseits').replace(' Andererseits', '\nAndererseits') + '\n(Ihr Name)'
js = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
bad = re.findall(r'.{30}[А-Яа-яЁё]{2,}.{10}', js)
print('cyrillic leftovers:', bad[:10])
print('size', len(js), {k: len(v) for k, v in D.items()})
open('data.js', 'w').write('const DB=' + js + ';\n')
