import re, difflib
from core import *

GREET = re.compile(r'^(Hallo|Hi|Liebe|Lieber|Sehr geehrte[rn]?|Guten (Tag|Morgen|Abend))\b')

def emails(ls):
    out = []; cur = None
    for s in ls:
        if GREET.match(s): cur = []; out.append(cur)
        if cur is not None: cur.append(s)
    return [paras(e) for e in out]

def beschwerde(spec, v, ans, title=None, model_fix=None):
    ls = pieces(spec)
    topic = ls[0] if not QRE.match(ls[0]) and not GREET.match(ls[0]) else None
    if topic and topic.startswith('('): topic = None
    qs = []
    if ans:
        i = next(k for k, s in enumerate(ls) if GREET.match(s))
        qs = questions(ls[:i], [19, 20])
        assert len(qs) == 2 and all(len(q['opts']) == 3 for q in qs), (v, qs)
        for q, a in zip(qs, ans): q['ans'] = a
    em = emails(ls)
    assert len(em) >= 2, (v, len(em))
    d = {'id': 'BV%s' % v, 'v': v, 'topic': title or topic, 'qs': qs, 'chef': em[0], 'mail': em[1], 'models': em[2:], 'src': 'derived'}
    if model_fix: d['models'] = model_fix(d)
    return d

GAP1 = re.compile(r'\b(4[6-9]|5[01])\s*\(\s*([a-k])\s*[-–—]?\s*([^)]*)\)')
GAP2 = re.compile(r'\b(5[2-7])\s*\(\s*([a-c])\s*[-–—]?\s*([^)]*)\)')

def best(word, opts, letter, tag):
    word = word.split('/')[0].strip().lower()
    if not word: return letter
    sc = [(difflib.SequenceMatcher(None, word, o.lower()).ratio(), l) for l, o in opts]
    r, l = max(sc)
    if r >= 0.6 and l != letter: print('  fix', tag, letter, '->', l, repr(word))
    return l if r >= 0.6 else letter

def sprach1(spec, v):
    ls = pieces(spec)
    k = next(i for i, s in enumerate(ls) if re.match(r'^a\)\s', s))
    body, optl = ls[:k], ls[k:]
    opts = []
    for s in optl:
        m = re.match(r'^([a-k])\)\s*(.*)$', s)
        if not m: continue
        w = first_alt(re.sub(r'\s*[-–—]\s*\d+', '', m.group(2)).strip())
        if w not in ('Ihnen', 'Sie', 'Ihr', 'Ihre'): w = w.lower()
        opts.append((m.group(1), w))
    subject = body.pop(0) if not GREET.match(body[0]) else None
    text = '\n'.join(paras(body))
    keys = {}
    def rep(m):
        keys[int(m.group(1))] = (m.group(2), m.group(3)); return '{{%s}}' % m.group(1)
    text = GAP1.sub(rep, text)
    assert sorted(keys) == list(range(46, 52)), (v, keys)
    keys = {n: best(w, opts, l, 'S1V%d/%d' % (v, n)) for n, (l, w) in keys.items()}
    letters = [o[0] for o in opts]
    for n, l in keys.items(): assert l in letters, (v, n, l, letters)
    return {'id': 'S1V%d' % v, 'v': v, 'subject': subject, 'text': text, 'opts': opts, 'ans': [keys[n] for n in range(46, 52)], 'src': 'file'}

def sprach2(spec, v):
    ls = pieces(spec)
    k = next(i for i, s in enumerate(ls) if re.match(r'^52\s*\.?\s*a\)', s))
    body, optl = ls[:k], ls[k:]
    subject = body.pop(0) if not GREET.match(body[0]) else None
    text = '\n'.join(paras(body))
    keys = {}
    def rep(m):
        keys[int(m.group(1))] = (m.group(2), m.group(3)); return '{{%s}}' % m.group(1)
    text = GAP2.sub(rep, text)
    assert sorted(keys) == list(range(52, 58)), (v, keys, text[:300])
    opts = {}; cur = None
    for s in optl:
        m = re.match(r'^(5[2-7])\s*\.?\s*([a-c])\)\s*(.*)$', s)
        if m: cur = int(m.group(1)); opts[cur] = [m.group(3)]; continue
        m = re.match(r'^([a-c])\)\s*(.*)$', s)
        if m and cur: opts[cur].append(m.group(2))
    assert all(len(opts.get(n, [])) == 3 for n in range(52, 58)), (v, opts)
    keys = {n: best(w, list(zip('abc', opts[n])), l, 'S2V%d/%d' % (v, n)) for n, (l, w) in keys.items()}
    return {'id': 'S2V%d' % v, 'v': v, 'subject': subject, 'text': text, 'opts': [opts[n] for n in range(52, 58)], 'ans': [keys[n] for n in range(52, 58)], 'src': 'file'}

def lutz_model(d):
    m = d_berger
    return [[p.replace('Frau Berger', 'Frau Lutz') for p in m]]

d_berger = None

def build():
    global d_berger
    d_berger = paras(lines(2420, 2428))
    B = [
      beschwerde([(2341,2345),(2351,2386)], 1, ['c','a']),
      beschwerde((2433,2462), 2, ['a','c'], model_fix=lutz_model),
      beschwerde((2466,2503), 3, ['a','a']),
      beschwerde((2507,2545), 4, ['b','b']),
      beschwerde((2549,2589), 5, ['a','c']),
      beschwerde((2608,2645), 6, ['a','a']),
      beschwerde((2649,2682), '6b', None),
      beschwerde((2685,2723), 7, ['c','b']),
      beschwerde((2726,2753), '7b', ['b','c'], title='Die Rechnung'),
      beschwerde((2772,2822), 8, ['a','c']),
    ]
    B[8]['models'] = [['Sehr geehrter Herr Schmidt,', 'vielen Dank für Ihre E-Mail und Ihre freundliche Rückmeldung zu unserer Lieferung. Wir bedauern die Fehler in der Rechnung sehr und bitten Sie um Entschuldigung. Der Grund dafür war ein Problem mit unserem Computersystem, durch das einige Positionen falsch übernommen wurden. Inzwischen hat unsere IT-Abteilung das Problem behoben. Selbstverständlich erhalten Sie wie gewohnt Ihren Rabatt von 10 %. Eine korrigierte Rechnung mit 100 Pinseln Größe S und 50 Töpfen grüner Farbe schicken wir Ihnen noch heute zu.', 'Wir freuen uns weiterhin auf eine gute Zusammenarbeit.', 'Mit freundlichen Grüßen', 'Sonja Klein']]
    B[8]['model_recon'] = True
    B[1]['model_recon'] = True
    S1 = [sprach1(r, i + 1) for i, r in enumerate([(2850,2877),(2878,2903),(2956,2982),(3008,3032),(3033,3056),(3057,3082),(3083,3108)])]
    S2 = [sprach2(r, i + 1) for i, r in enumerate([(3143,3178),(3179,3215),(3216,3249),(3250,3282),(3318,3353),(3354,3386),(3387,3419)])]
    return {'B': B, 'S1': S1, 'S2': S2}

if __name__ == '__main__':
    import json
    d = build()
    for b in d['B']: print(b['id'], b['topic'], [q['text'] for q in b['qs']], '| chef:', b['chef'][0], len(b['chef']), '| mail:', b['mail'][0], '| models', len(b['models']))
    for s in d['S1'] + d['S2']: print(s['id'], s['subject'], s['ans'], s['opts'] if s['id'].startswith('S1') else '')
