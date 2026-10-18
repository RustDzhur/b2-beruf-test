import re
from core import *

SPK = re.compile(r'^((?:TN|Teilnehmer(?:in)?)\s?\d)\s*[-–:]\s*(.*)$|^([A-ZÄÖÜ][\wäöüß.\-]*(?: (?:[A-ZÄÖÜ0-9][\wäöüß.\-]*|von|van|de)){0,2})\s?:\s*(.*)$')
NOT_SPK = {'Name', 'Telefonnummer', 'Ort', 'Datum', 'Hinweis', 'Thema', 'Zu erledigen', 'Weitere Informationen', 'Tipp', 'Achtung', 'Antwort', 'Frage'}

def dialog(ls):
    segs = []
    ls2 = []
    for s in ls:
        if re.match(r'^Nummer\b', s): continue
        ls2 += re.split(r'\s(?=\d\.? ?Azubi\s?:)', s)
    for s in ls2:
        s = re.sub(r'^(\d)\.? ?Azubi\s?:', r'Azubi \1:', s)
        m = SPK.match(s)
        if m:
            who = (m.group(1) or m.group(3)).strip(); txt = (m.group(2) if m.group(1) else m.group(4)).strip()
            if who not in NOT_SPK and len(who) <= 30:
                segs.append({'who': who, 't': txt}); continue
        if segs: segs[-1]['t'] += ' ' + s
        else: segs.append({'who': None, 't': s})
    for g in segs:
        g['t'] = re.sub(r'\s+', ' ', g['t']).strip()
    return [g for g in segs if g['t']]

def monolog(ls, who='Sprecher'):
    return [{'who': who, 't': p} for p in paras(ls)]

def qs_last(ls, nums):
    """questions where later variants of the same number / option letter win"""
    byn = {}; order = []; cur = None; last_opt = None
    for s in ls:
        m = QRE.match(s)
        if m and int(m.group(1)) in nums:
            n = int(m.group(1))
            cur = {'n': n, 'text': m.group(2), 'type': 'mc', 'opts': {}}
            byn[n] = cur; last_opt = None
            if n not in order: order.append(n)
            continue
        if cur is None: continue
        if re.match(r'^Richtig\s*/\s*[Ff]alsch', s): cur['type'] = 'rf'; continue
        m = ORE.match(s)
        if m: last_opt = m.group(1).lower(); cur['opts'][last_opt] = m.group(2); continue
        if last_opt: cur['opts'][last_opt] += ' ' + s
        elif not cur['opts']: cur['text'] += ' ' + s
    out = []
    for n in sorted(order):
        q = byn[n]; q['text'] = first_alt(q['text'])
        if q['type'] == 'rf': del q['opts']
        else: q['opts'] = [first_alt(q['opts'].get(k, '?')).rstrip(',') for k in 'abc']
        out.append(q)
    return out

def split_dialog_q(ls, nums):
    for i, s in enumerate(ls):
        m = QRE.match(s)
        if m and int(m.group(1)) in nums: return ls[:i], ls[i:]
    return ls, []

def blocks_by(ls, pat):
    out = []; cur = None
    for s in ls:
        if re.match(pat, s): cur = []; out.append(cur); continue
        if cur is not None: cur.append(s)
    return out

def ov(q, o):
    q = dict(q); q.update(o); return q

def hoeren1(rng, v, ans, overrides=None, qpieces=None):
    bl = blocks_by(pieces(rng), r'^Nummer\s+2[246]')
    assert len(bl) == 3, (v, len(bl))
    dialogs = []; allq = []
    for i, blk in enumerate(bl):
        d, q = split_dialog_q(blk, range(22, 28))
        nums = range(22 + 2 * i, 24 + 2 * i)
        qs = qs_last(q, nums)
        assert [x['n'] for x in qs] == list(nums), (v, i, [x['n'] for x in qs])
        dialogs.append({'segs': dialog(d), 'qs': [x['n'] for x in qs]})
        allq += qs
    for q, a in zip(allq, ans): q['ans'] = a
    for q in allq:
        if overrides and q['n'] in overrides:
            allq[allq.index(q)] = ov(q, overrides[q['n']])
    return {'id': 'H1V%d' % v, 'v': v, 'dialogs': dialogs, 'qs': allq, 'src': 'derived'}

def hoeren2(rng, v, sets=None, synth=None):
    ls = pieces(rng)
    keysets = []; cur = None
    i = 0
    while i < len(ls):
        m = re.match(r'^(2[89]|3[01])\s*(?:…|\.\.\.)\s*\(([a-f])\)', ls[i])
        if m:
            if m.group(1) == '28': cur = {'keys': [], 'opts': []}; keysets.append(cur)
            cur['keys'].append(m.group(2))
        i += 1
    # options right after each key block
    for ks in keysets: pass
    idx = [i for i, s in enumerate(ls) if re.match(r'^31\s*(?:…|\.\.\.)\s*\(', s)]
    for ks, j in zip(keysets, idx):
        opts = []
        for s in ls[j + 1:]:
            m = re.match(r'^([a-g])\)\s*(.*)$', s)
            if not m:
                if opts and not re.match(r'^Nummer', s) and len(opts) < 6 and not s.startswith('('): continue
                break
            if m.group(1) not in [o[0] for o in opts]: opts.append((m.group(1), m.group(2)))
        assert len(opts) in (6, 7), (v, opts)
        ks['opts'] = [o[1] for o in opts]
    dialogs = []
    for blk in blocks_by(ls, r'^Nummer\s+(28|29|30|31)\b'):
        body = []
        for s in blk:
            if re.match(r'^[a-f]\)\s', s) or s.startswith('(') or re.match(r'^(2[89]|3[01])\s*(?:…|\.\.\.)', s): break
            body.append(s)
        dialogs.append({'segs': dialog(body)})
    if synth: dialogs = synth
    assert len(dialogs) == 4, (v, len(dialogs))
    if sets is not None: keysets = [keysets[k] for k in sets]
    out = []
    for k, ks in enumerate(keysets):
        out.append({'id': 'H2V%d%s' % (v, '' if len(keysets) == 1 else chr(97 + k)), 'v': v, 'dialogs': dialogs, 'opts': ks['opts'], 'ans': ks['keys'], 'src': 'file'})
    return out

def hoeren3(rng, v, ans, qrng=None, overrides=None):
    ls = pieces(rng)
    d, q = split_dialog_q(ls, range(32, 36))
    if qrng: q = pieces(qrng)
    qs = qs_last(q, range(32, 36))
    assert [x['n'] for x in qs] == [32, 33, 34, 35], (v, [x['n'] for x in qs])
    for x, a in zip(qs, ans): x['ans'] = a
    if overrides:
        qs = [ov(x, overrides[x['n']]) if x['n'] in overrides else x for x in qs]
    topic = None
    m = re.match(r'^Nummer\s+32\s*[-–]\s*35\s*(.*)$', ls[0]) if ls else None
    if m: topic = m.group(1).strip(' .') or None
    return {'id': 'H3V%d' % v, 'v': v, 'topic': topic, 'segs': dialog(d), 'qs': qs, 'src': 'derived'}

def hoeren4(rng, v, ans, genders, overrides=None):
    bl = blocks_by(pieces(rng), r'^Nummer\s+(3[6-9]|40)\b')
    assert len(bl) == 5, (v, len(bl))
    msgs = []
    for i, blk in enumerate(bl):
        n = 36 + i
        d, q = split_dialog_q(blk, [n])
        qs = qs_last(q, [n]); assert len(qs) == 1, (v, n)
        x = qs[0]; x['ans'] = ans[i]
        if overrides and n in overrides: x = ov(x, overrides[n])
        msgs.append({'n': n, 'g': genders[i], 'text': ' '.join(paras(d, 9999)), 'q': x})
    return {'id': 'H4V%d' % v, 'v': v, 'msgs': msgs, 'src': 'derived'}
