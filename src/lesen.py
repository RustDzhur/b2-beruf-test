import re
from core import *

def lesen1(a, b, v):
    ls = lines(a, b); persons = []; ads = []; cur = None
    for s in ls:
        m = re.match(r'^(\d)\.?\s+(.+?)\s+([a-hx])\b\s*(\(.*\))?\s*$', s, re.I)
        if m and not ads:
            persons.append({'n': int(m.group(1)), 'text': m.group(2).strip(), 'ans': m.group(3).lower()}); continue
        m = re.match(r'^([a-h])\)\s*(.*)$', s)
        if m:
            cur = {'l': m.group(1), 'title': m.group(2), 'lines': []}; ads.append(cur); continue
        if cur: cur['lines'].append(s)
    for ad in ads:
        ad['text'] = ' '.join(paras(ad.pop('lines'), 9999))
        ad['text'] = re.sub(r'\s*mehr\s*\.*\s*$', '', ad['text'])
    assert len(persons) == 5 and len(ads) >= 8, (v, len(persons), len(ads))
    return {'id': 'L1V%d' % v, 'v': v, 'persons': persons, 'ads': ads, 'src': 'file'}

def doc(ls):
    title = None; heading = None
    if ls and ls[0].startswith('Willkommensmappe'): title = ls.pop(0)
    if ls and len(ls[0]) < 60 and not ls[0].endswith('.'): heading = ls.pop(0)
    return {'title': title or 'Willkommensmappe für neue Mitarbeiterinnen und Mitarbeiter', 'heading': heading, 'paras': paras(ls)}

def apply_ans(qs, ans, v):
    assert len(qs) == len(ans), (v, [q['n'] for q in qs])
    for q, a in zip(qs, ans):
        q['ans'] = a
        if q['type'] == 'mc': assert len(q['opts']) == 3, (v, q)
    return qs

def lesen2(text, part, v, ans, q=None, nums=None):
    if q is None:
        t, ql = split_text_q(pieces(text), nums[0])
    else:
        t, ql = pieces(text), pieces(q)
    d = doc(t)
    d.update({'id': 'L2T%dV%d' % (part, v), 'part': part, 'v': v, 'qs': apply_ans(questions(ql, nums), ans, 'L2T%dV%d' % (part, v)), 'src': 'derived'})
    return d

def lesen3(spec, v):
    ls = pieces(spec); persons = []; posts = []; cur = None
    for s in ls:
        m = re.match(r'^(1[0-3])\.?\s+(.+?)\s*[-–—]\s*([a-fx])\s*$', s, re.I)
        if m:
            cur = {'n': int(m.group(1)), 'name': m.group(2), 'ans': m.group(3).lower(), 'lines': []}; persons.append(cur); continue
        m = re.match(r'^([a-f])\)\s*(.*)$', s)
        if m:
            cur = {'l': m.group(1), 'name': m.group(2), 'lines': []}; posts.append(cur); continue
        if cur: cur['lines'].append(s)
    for x in persons + posts: x['text'] = ' '.join(x.pop('lines'))
    assert len(persons) == 4 and len(posts) == 6, (v, len(persons), len(posts))
    return {'id': 'L3V%d' % v, 'v': v, 'persons': persons, 'posts': posts, 'src': 'file'}

def lesen4(text, v, ans, q=None):
    if q is None: t, ql = split_text_q(pieces(text), 14)
    else: t, ql = pieces(text), pieces(q)
    topic = None
    if t and t[0].startswith('('): topic = t.pop(0).strip('() ')
    return {'id': 'L4V%d' % v, 'v': v, 'topic': topic, 'paras': paras(t), 'qs': apply_ans(questions(ql, range(14, 19)), ans, 'L4V%d' % v), 'src': 'derived'}

def build():
    L1 = [lesen1(a, b, i + 1) for i, (a, b) in enumerate([(301,341),(342,381),(424,464),(465,505),(506,548),(549,590),(591,633)])]
    N1, N2 = [6, 7], [8, 9]
    L2 = [
      lesen2((636,648), 1, 1, ['R','c'], (656,662), N1),
      lesen2((688,700), 1, 2, ['F','b'], (701,706), N1),
      lesen2((709,730), 1, 3, ['F','c'], nums=N1),
      lesen2((731,757), 1, 4, ['R','b'], nums=N1),
      lesen2((781,803), 1, 5, ['R','b'], nums=N1),
      lesen2((808,822), 1, 6, ['F','c'], [(826,827),(833,836)], N1),
      lesen2((839,861), 1, 7, ['R','b'], nums=N1),
      lesen2((864,881), 2, 1, ['F','b'], (890,895), N2),
      lesen2((898,926), 2, 2, ['F','a'], nums=N2),
      lesen2((929,948), 2, 3, ['F','b'], (964,969), N2),
      lesen2((972,1001), 2, 4, ['F','a'], nums=N2),
      lesen2((1002,1031), 2, 5, ['R','b'], nums=N2),
      lesen2((1032,1062), 2, 6, ['F','a'], nums=N2),
      lesen2((1063,1091), 2, 7, ['F','a'], nums=N2),
    ]
    L3 = [lesen3(r, i + 1) for i, r in enumerate([(1175,1217),[(1218,1242),(1245,1262)],(1263,1305),(1306,1346),(1388,1428),(1429,1469),(1470,1512)])]
    # V2: append posts after the alt formulation lines
    L4 = [
      lesen4((1594,1675), 1, list('ccccb')),
      lesen4((1758,1838), 2, list('aaccb')),
      lesen4((1839,1897), 3, list('ccbca'), [(1898,1901),(1907,1924)]),
      lesen4((1925,2008), 4, list('baabc')),
      lesen4((2009,2085), 5, list('bcbaa')),
      lesen4((2086,2165), 6, list('acccа'.replace('а','a'))),
      lesen4((2166,2247), 7, list('cbaba')),
    ]
    return {'L1': L1, 'L2': L2, 'L3': L3, 'L4': L4}

if __name__ == '__main__':
    import json
    d = build()
    for k, v in d.items(): print(k, len(v))
