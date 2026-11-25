"""New variants from the updated collection "Alle Information от 02.11.26" (see newpdf.py).

Facts for the maintainer: build.py calls extra_build.add(D) after the old pipeline. Existing variant ids are never touched
(students' progress and mistake lists are stored under them); every variant added here gets a NEW id and `src` = "pdf2"
(answers read from the PDF) or "pdf2-solved" (the PDF text carries no answer key, answers were worked out from the text).
"""
import os
import re
import newpdf as P


def glue(a, b):
    """join a wrapped line pair; 'Produk-'+'tion' -> 'Produktion', but 'form-'+'und' stays a hanging compound"""
    if a.endswith('-') and not a.endswith(' -') and b[:1].islower() and not re.match(r'(und|oder|bzw|sowie)\b', b):
        return a[:-1] + b
    return (a + ' ' + b).strip()


def reflow(lines, letter=False):
    """PDF lines -> paragraphs: glue hyphenated line ends, start a paragraph after a clearly short line that ends a sentence."""
    lines = [s.strip() for s in lines if s.strip()]
    mx = max([len(s) for s in lines] or [0])
    paras, cur, prev = [], '', ''
    for s in lines:
        if cur and prev.endswith(('.', '!', '?', ':', '"', '“')) and len(prev) < mx * 0.8 and s[:1].isupper():
            paras.append(cur)
            cur = ''
        if letter and len(s) < 45 and (not cur or cur.endswith(('.', '!', '?', ',', ':'))):
            if cur:
                paras.append(cur)
            paras.append(s)
            cur, prev = '', s
            continue
        cur = glue(cur, s)
        prev = s
    if cur:
        paras.append(cur)
    return [re.sub(r'\s+', ' ', p) for p in paras]


def mc_questions(lines):
    """'14. Stem' + 'a) .. b) .. c) ..' (or 'Richtig / falsch') -> [{n,text,type,opts|ans...}] without answers"""
    qs, cur = [], None
    for s in lines:
        m = re.match(r'^(\d{1,2})\.\s*(.+)$', s)
        if m and not re.match(r'^\d+\.\s*[A-Z]\w+ (und|und der|der)\b.*\bTOP\b', s):
            cur = {'n': int(m.group(1)), 'text': m.group(2).strip(), 'type': 'mc', 'opts': []}
            qs.append(cur)
            continue
        if re.match(r'^Richtig\s*/\s*falsch', s, re.I) and cur:
            cur['type'] = 'rf'
            cur.pop('opts')
            continue
        m = re.match(r'^([abc])\)\s*(.+)$', s)
        if m and cur is not None and 'opts' in cur:
            cur['opts'].append(m.group(2).strip())
    return qs


def solved(qs, ans):
    assert len(qs) == len(ans), (len(qs), ans)
    for q, a in zip(qs, ans):
        q['ans'] = a
    return qs


def lesen1_8(D):
    b = [x for x in P.all_lesen1() if x['no'] == 8][0]
    ads = [dict(l=a['l'], title=a['title'], text=a['text']) for a in b['ads']]
    ads[-1]['text'] += ' …'  # the PDF itself cuts this advert off after "Auslandsaufenthalte können"
    D['L1'].append({'id': 'L1V8', 'v': 8, 'persons': [{'n': p['n'], 'text': p['text'], 'ans': p['ans']} for p in b['persons']],
                    'ads': ads, 'src': 'pdf2', 'note': b['note']})


def lesen3_8(D):
    b = [x for x in P.all_lesen3() if x['no'] == 8][0]
    posts = []
    for p in b['posts']:
        name, text = p['name'], p['text']
        m = re.match(r'^(\w+, vor [\w ]+?(?:Minuten|Stunden|Tagen))\s+(.+)$', name)
        if m:  # the PDF puts the first words of the post on the name line
            name, text = m.group(1), m.group(2) + ' ' + text
            text = re.sub(r'(\w)- (\w)', r'\1\2', text)
        posts.append({'l': p['l'], 'name': name, 'text': text})
    D['L3'].append({'id': 'L3V8', 'v': 8, 'persons': [{'n': p['n'], 'name': p['name'], 'ans': p['ans'], 'text': p['text']} for p in b['persons']],
                    'posts': posts, 'src': 'pdf2', 'note': b['note']})


def lesen2_t1_8(D):
    h, pg, ls = P.blocks(r'Text 1 \(вариант №8')[0]
    title, heading = ls[0], ls[1]
    cut = next(i for i, s in enumerate(ls) if re.match(r'^6\.', s))
    qs = solved(mc_questions(ls[cut:]), ['R', 'a'])
    D['L2'].append({'title': title, 'heading': heading, 'paras': reflow(ls[2:cut]), 'id': 'L2T1V8', 'part': 1, 'v': 8, 'qs': qs,
                    'src': 'pdf2-solved', 'note': P.note_of(h)})


def lesen4_new(D):
    for no, ans in ((8, ['a', 'c', 'b', 'b', 'c']), (9, ['c', 'c', 'c', 'c', 'c'])):
        h, pg, ls = [b for b in P.blocks(r'Lesen Teil 4 \(вариант\s*№\s*%d\b' % no)][0]
        topic = re.sub(r'^\(|\)$', '', ls[0]).strip()
        q0 = next(i for i, s in enumerate(ls) if re.match(r'^14\.', s))
        body = ls[1:q0]
        paras, cur = [], []
        for s in body:
            if re.match(r'^(TOP \d|Tagesordnungspunkte:)', s) and cur:
                paras.append(cur)
                cur = []
            cur.append(s)
        paras.append(cur)
        out = []
        for p in paras:
            if p and re.match(r'^TOP \d', p[0]):
                out.append(p[0])
                out += reflow(p[1:])
            else:  # protocol header: one paragraph per item (room, place, people, chair, agenda points)
                cur = ''
                for x in p:
                    if cur and re.match(r'^(Protokoll|Sitzungsraum|Konferenzraum|Ort:|Anwesende|Teilnehm|Gast|Nicht Anwesende|Sitzungsleitung|Tagesordnungspunkte|\d\.)', x):
                        out.append(cur)
                        cur = ''
                    cur = glue(cur, x)
                if cur:
                    out.append(cur)
        D['L4'].append({'id': 'L4V%d' % no, 'v': no, 'topic': topic, 'paras': out, 'qs': solved(mc_questions(ls[q0:]), ans),
                        'src': 'pdf2-solved', 'note': P.note_of(h)})


def sprach1_8(D):
    h, pg, ls = P.blocks(r'Sprachbausteine Teil 1 \(вариант №8')[0]
    subject = ls[0]
    end = next(i for i, s in enumerate(ls) if re.match(r'^a\)', s))
    body = ' '.join(ls[1:end])
    ans, words = {}, {}

    def gap(m):
        n = int(m.group(1))
        ans[n] = m.group(2)
        words[m.group(2)] = re.sub(r'\s+', ' ', m.group(3)).strip()
        return '{{%d}}' % n
    body = re.sub(r'(\d\d)\s*\(\s*([a-j])\s*[–-]\s*([^)]+?)\s*\)', gap, body)
    opts = []
    for s in ls[end:]:
        m = re.match(r'^([a-j])\)\s*(.+?)(?:\s*-\s*\d\d)?$', s)
        if m:
            opts.append([m.group(1), words.get(m.group(1)) or m.group(2).strip().capitalize()])
    text = re.sub(r'(\w)- (\w)', lambda m: m.group(1) + m.group(2) if m.group(2).islower() and not re.match(r'und\b', body[m.end() - 1:]) else m.group(0), body)
    text = text.replace(' Sehr geehrte', '\nSehr geehrte', 1).replace(' Mit freundlichen Grüßen', '\nMit freundlichen Grüßen')
    text = text.replace('Sehr geehrte Damen und Herren, ', 'Sehr geehrte Damen und Herren,\n', 1)
    assert sorted(ans) == list(range(46, 52)) and len(opts) == 10, (ans, opts)
    D['S1'].append({'id': 'S1V8', 'v': 8, 'subject': subject, 'text': text, 'opts': opts, 'ans': [ans[n] for n in range(46, 52)],
                    'src': 'pdf2', 'note': P.note_of(h)})


# the PDF shows only the right option of Sprachbausteine 2 №8; the two wrong options per gap were written here
S2_8 = [
    (['Ihrer Auftragsbestätigung', 'Ihre Auftragsbestätigung', 'Ihrem Auftragsbestätigung'], 0),
    (['problemlose funktioniert', 'problemlos funktionierte', 'problemlos funktioniert'], 2),
    (['dieses Versprechen', 'diesem Versprechen', 'dieser Versprechen'], 0),
    (['verbindlicher Auskunft', 'verbindlichen Auskunft', 'verbindliche Auskunft'], 2),
    (['aufgrund des Zeitverzugs', 'aufgrund dem Zeitverzug', 'wegen den Zeitverzug'], 0),
    (['Rechnungssumme abzuziehen', 'Rechnungssummen abziehen', 'Rechnungssumme abziehen'], 2),
]


def sprach2_8(D):
    h, pg, ls = P.blocks(r'Sprachbausteine Teil 2 \( вариант №8')[0]
    subject = ls[0]
    end = next(i for i, s in enumerate(ls) if re.match(r'^52\.', s))
    body = ' '.join(ls[1:end])
    body = re.sub(r'(\d\d)\s*\(\s*[abcс]\s*[–-]\s*[^)]+?\)', lambda m: '{{%s}}' % m.group(1), body)
    body = re.sub(r'(\w)- (\w)', lambda m: m.group(1) + m.group(2) if m.group(2).islower() and not re.match(r'und\b', body[m.end() - 1:]) else m.group(0), body)
    body = body.replace('{{57}} (', '{{57}} (')
    # "Rech- nungssumme abziehen)" ends with a stray bracket after the gap tag if the cut was uneven
    body = re.sub(r'\{\{(\d\d)\}\}\)', r'{{\1}}', body)
    body = body.replace(' Mit freundlichen Grüßen', '\nMit freundlichen Grüßen').replace('Sehr geehrter Herr Vogel, ', 'Sehr geehrter Herr Vogel,\n', 1)
    assert all('{{%d}}' % n in body for n in range(52, 58)), body
    opts = [o for o, _ in S2_8]
    ans = ['abc'[i] for _, i in S2_8]
    assert ans == ['a', 'c', 'a', 'c', 'a', 'c'], ans
    D['S2'].append({'id': 'S2V8', 'v': 8, 'subject': subject, 'text': body, 'opts': opts, 'ans': ans, 'src': 'pdf2',
                    'note': P.note_of(h) + ' · неверные варианты дописаны (в PDF только правильные)'})


def beschwerde_9(D):
    h, pg, ls = P.blocks(r'Lesen und Schreiben (Teil )?Beschwerde \(вариант № 9')[0]
    topic = ls[0]
    q0 = next(i for i, s in enumerate(ls) if re.match(r'^19\.', s))
    m0 = next(i for i, s in enumerate(ls) if re.match(r'^Hallo', s))
    mail0 = next(i for i, s in enumerate(ls) if re.match(r'^Sehr geehrter Herr Herrmann', s))
    model0 = next(i for i, s in enumerate(ls) if re.match(r'^Sehr geehrte Frau Talheim', s))
    cut = next(i for i, s in enumerate(ls) if s.startswith('Ссылка'))
    qs = solved(mc_questions(ls[q0:m0]), ['b', 'b'])
    mail = reflow(ls[mail0:model0], True)
    mail.append('Nummer 21 Schreiben Sie eine E-Mail an den Kunden.')
    D['B'].append({'id': 'BV9', 'v': 9, 'topic': topic, 'qs': qs, 'chef': reflow(ls[m0:mail0], True), 'mail': mail,
                   'models': [reflow(ls[model0:cut], True)], 'src': 'pdf2-solved', 'note': P.note_of(h)})


def add(D):
    for f in (lesen1_8, lesen3_8, lesen2_t1_8, lesen4_new, sprach1_8, sprach2_8, beschwerde_9):
        f(D)


# ---------------------------------------------------------------- Hören / Telefonnotiz
SPEAKER = re.compile(r'^([A-ZÄÖÜ][\wäöüß]*(?: [\wäöüß]+)?(?: \d)?|TN(?: \d)?):\s*(.*)$')


def dialog(lines):
    """'Chef: text' lines (wrapped) -> [{who,t}]"""
    segs = []
    for s in lines:
        if s.startswith('Ссылка') or s.startswith('(звуковая') or s.startswith('( звуковая'):
            continue
        m = SPEAKER.match(s)
        if m and not re.match(r'^(Nummer|Name|Telefonnummer|Zu erledigen)\b', s):
            segs.append({'who': m.group(1), 't': m.group(2).strip()})
        elif segs:
            segs[-1]['t'] = glue(segs[-1]['t'], s)
    return segs


def hoeren1_8(D):
    h, pg, ls = P.blocks(r'Hören Teil ?1\s*\(вариант №8')[0]
    idx = [i for i, s in enumerate(ls) if s.startswith('Nummer')] + [len(ls)]
    key = [['R', 'a'], ['R', 'c'], ['R', 'b']]  # worked out from the transcripts: the PDF carries no answer key
    dialogs, qs = [], []
    for k in range(3):
        part = ls[idx[k] + 1:idx[k + 1]]
        q0 = next(i for i, s in enumerate(part) if re.match(r'^\d\d\.', s))
        dq = solved(mc_questions(part[q0:]), key[k])
        dialogs.append({'segs': dialog(part[:q0]), 'qs': [q['n'] for q in dq]})
        qs += dq
    D['H1'].append({'id': 'H1V8', 'v': 8, 'dialogs': dialogs, 'qs': qs, 'src': 'pdf2-solved', 'note': P.note_of(h)})


def hoeren2_7(D):
    h, pg, ls = P.blocks(r'Hören Teil ?2\s*\(вариант №7')[0]
    ans = [re.match(r'^(\d\d) … \(([a-f])\)', s).group(2) for s in ls if re.match(r'^\d\d … \(', s)]
    opts = [re.sub(r'^[a-f]\s?\)\s*', '', s) for s in ls[:12] if re.match(r'^[a-f]\s?\)', s)]
    opts = [o.replace('wieterbildet', 'weiterbildet') for o in opts]  # typo of the PDF
    ls = [s.replace('Yogga', 'Yoga') for s in ls]
    assert len(ans) == 4 and len(opts) == 6, (ans, opts)
    idx = [i for i, s in enumerate(ls) if re.match(r'^Nummer \d\d', s)] + [len(ls)]
    dialogs = []
    for k in range(4):
        part = ls[idx[k] + 1:idx[k + 1]]
        end = next((i for i, s in enumerate(part) if re.match(r'^[a-f]\s?\)', s)), len(part))
        dialogs.append({'segs': dialog(part[:end])})
    D['H2'].append({'id': 'H2V7', 'v': 7, 'dialogs': dialogs, 'opts': opts, 'ans': ans, 'src': 'pdf2', 'note': P.note_of(h)})


def hoeren3_8(D):
    bl = P.blocks(r'Hören Teil ?3\s*\(вариант №7')
    head = bl[0][2][0]
    topic = re.sub(r'^Nummer 32-35\s*', '', head)
    qs = solved(mc_questions(bl[1][2]), ['c', 'b', 'a', 'b'])
    D['H3'].append({'id': 'H3V8', 'v': 8, 'topic': topic, 'segs': dialog(bl[0][2][1:]), 'qs': qs, 'src': 'pdf2-solved',
                    'note': P.note_of(bl[0][0]) + ' (в PDF №7)'})


def hoeren4_8(D):
    h, pg, ls = P.blocks(r'Hören Teil ?4\s*\(вариант №8')[0]
    genders = {36: 'f', 37: 'm', 38: 'm', 39: 'm', 40: 'f'}
    ans = {36: 'a', 37: 'a', 38: 'a', 39: 'b', 40: 'b'}
    idx = [i for i, s in enumerate(ls) if s.startswith('Nummer')] + [len(ls)]
    msgs = []
    for k in range(5):
        n = 36 + k
        part = ls[idx[k] + 1:idx[k + 1]]
        q0 = next(i for i, s in enumerate(part) if re.match(r'^%d\.' % n, s))
        text = ''
        for s in part[:q0]:
            if s.startswith('Ссылка') or s.startswith('(звуковая') or s.startswith('( звуковая'):
                continue
            text = glue(text, s)
        q = solved(mc_questions(part[q0:]), [ans[n]])[0]
        msgs.append({'n': n, 'g': genders[n], 'text': text, 'q': q})
    D['H4'].append({'id': 'H4V8', 'v': 8, 'msgs': msgs, 'src': 'pdf2-solved', 'note': P.note_of(h)})


def notizen(D):
    base = {'src': 'pdf2'}
    D['N'] += [
        dict(base, id='N13', type='Beschwerde', who='Frau Günter', g='f', name='Günter', phone='0135 821 764 9',
             info=[{'t': 'statt der 40 Kisten Rotwein nur 30 Kisten angekommen', 'kw': ['40', '30|rotwein']},
                   {'t': 'statt 10 Kisten Weißwein 20 Kisten bekommen', 'kw': ['10', '20|weißwein|weisswein']},
                   {'t': 'vom roten schnell nachliefern', 'kw': ['rot', 'nachliefer']},
                   {'t': 'vom Saft sind zwei Flaschen kaputt gegangen', 'kw': ['saft', '2|zwei|kaputt']},
                   {'t': 'eine neue Rechnung für alles', 'kw': ['rechnung']}],
             todo='Zurückrufen und vom roten schnell nachliefern', todo_kw=['zurück|rückruf', 'nachliefer'],
             text='Guten Tag, hier ist Frau Günter. Leider mussten wir feststellen, dass statt der 40 Kisten Rotwein nur 30 Kisten angekommen sind. Wir haben statt 10 Kisten Weißwein 20 bekommen. Aber vom roten müssen Sie schnell nachliefern. Vom Saft sind zwei Flaschen kaputt gegangen. Bitte schicken Sie uns doch eine neue Rechnung für alles. Bitte rufen Sie doch zurück. Mein Name ist Günter, G-Ü-N-T-E-R. Meine Telefonnummer lautet 0135 821 764 9. Vielen Dank. Auf Wiederhören.'),
        dict(base, id='N14', type='Angebot', who='Herr Schmidt', g='m', name='Schmidt', phone='0171 88 45 545',
             info=[{'t': '80 € pro Tag ein kleines Fahrzeug', 'kw': ['80', 'klein']},
                   {'t': 'das Auto mit vollem Benzintank', 'kw': ['tank|benzin']},
                   {'t': 'keine großen Fahrzeuge zur Verfügung', 'kw': ['groß', 'kein|nicht|nur']},
                   {'t': 'Rückgabe des Autos persönlich oder sie können organisieren', 'kw': ['rückgabe', 'persönlich|organis']},
                   {'t': 'über die Versicherungsoptionen sprechen', 'kw': ['versicherung']}],
             todo='Zurückrufen und Details klären', todo_kw=['zurück|rückruf', 'klär'],
             text='Guten Morgen, hier spricht Herr Schmidt. Wir bedanken uns herzlich für Ihr Interesse an unserer Autovermietung. Gerne bestätigen wir den Erhalt Ihrer Anfrage und möchten Ihnen einige weitere Einzelheiten zu unserem Angebot erläutern. Wir haben ein kleines Fahrzeug für Sie verfügbar, das zu einem Sonderpreis von 80 Euro pro Tag angeboten wird. Bitte beachten Sie, dass das Auto mit vollem Benzintank bereitgestellt wird. Außerdem möchten wir Sie darauf hinweisen, dass wir momentan keine großen Fahrzeuge mehr zur Verfügung haben, sondern nur noch kleine. Die Rückgabe des Autos kann entweder persönlich durch Sie erfolgen oder wir können dies für Sie organisieren. Zum Abschluss möchten wir noch über die möglichen Versicherungsoptionen sprechen. Bitte rufen Sie uns zurück, damit wir diese Details klären können. Sie erreichen uns unter der Telefonnummer 0171 88 45 545. Mein Name ist Schmidt, buchstabiert S-C-H-M-I-D-T. Vielen Dank für Ihr Verständnis und Ihre Zusammenarbeit.'),
        dict(base, id='N15', type='Buchung', who='Herr Herrmann', g='m', name='Herrmann', phone='0172 439 378 6',
             info=[{'t': 'Tisch für 6 Personen reservieren (5 Kunden und er)', 'kw': ['6|sechs']},
                   {'t': 'am Donnerstagabend um 18:30 Uhr', 'kw': ['donnerstag', '18']},
                   {'t': 'Gibt es Parkplätze für Gäste?', 'kw': ['park']},
                   {'t': 'Menü 2 bereitstellen / bestätigen', 'kw': ['2|zwei']}],
             todo='Zurückrufen, Reservierung und Parkplatz bestätigen', todo_kw=['zurück|rückruf', 'bestätig'],
             text='Guten Tag, hier spricht Herr Herrmann. Ich möchte für kommenden Donnerstagabend um 18.30 Uhr eine Tischreservierung für sechs Personen vornehmen. Es handelt sich dabei um fünf Kunden sowie mich als Leiter. Darüber hinaus würde ich gerne in Erfahrung bringen, ob für unsere Gäste Parkplätze zur Verfügung stehen. Zudem bitte ich um Bestätigung, dass das Menü 2 für uns bereitgestellt wird. Ich wäre Ihnen sehr dankbar, wenn Sie mir die Reservierung sowie die Verfügbarkeit des Parkplatzes telefonisch bestätigen könnten. Sie erreichen mich unter der Nummer 0172 439 378 6. Mein Name wird wie folgt buchstabiert H-E-R-R-M-A-N-N. Vielen Dank und auf Wiederhören.'),
    ]


add_text = add


def add(D):  # noqa: F811  (text variants first, then recordings)
    add_text(D)
    for f in (hoeren1_8, hoeren2_7, hoeren3_8, hoeren4_8, notizen):
        f(D)


# ---------------------------------------------------------------- Sprechen Teil 1: the 8 presentation topics of the new collection

HERE = os.path.dirname(os.path.abspath(__file__))
CYR = re.compile(r'[А-Яа-яЁё]')


def _groups(lines):
    out = []
    for s in lines:
        ru = bool(CYR.search(s))
        if out and out[-1][0] == ru:
            out[-1][1].append(s)
        else:
            out.append((ru, [s]))
    return out


def _split_intro_end(lines):
    """German intro + conclusion of one topic: the conclusion starts at "Zusammenfassend"/"Abschließend"/"Insgesamt"."""
    i = next(k for k, s in enumerate(lines) if re.match(r'^(Zusammenfassend|Abschließend|Insgesamt|Fazit|Zum Schluss)', s))
    return reflow(lines[:i]), reflow(lines[i:])


def sprechen1(D):
    kurz = open(os.path.join(HERE, 'praes_kurz.txt'), encoding='utf-8').read()
    lang = open(os.path.join(HERE, 'praes_lang.txt'), encoding='utf-8').read()
    topics = []
    for page in re.split(r'=====PAGE \d+=====\n', kurz)[1:]:
        ls = [l.strip() for l in page.split('\n') if l.strip() and not l.startswith('🗣')]
        titles = [re.match(r'^\d\. (\w+)', l).group(1) for l in ls[:2]]
        g = _groups(ls[2:])
        de = [x[1] for x in g if not x[0]]  # intro+conclusion A, intro+conclusion B, both bodies
        assert len(de) == 3, (titles, [(x[0], len(x[1])) for x in g])
        body = de[2]
        half = len(body) // 2
        bodies = [reflow(body[:half]), reflow(body[half:])]
        for t, ie, b in zip(titles, de[:2], bodies):
            intro, end = _split_intro_end(ie)
            topics.append((t, intro + b + end))
    assert len(topics) == 8, len(topics)
    # task text of every topic: what the exam card asks for ("z. B. ..." items become the bullet points)
    prompts = {}
    for k, block in re.findall(r'(?m)^(\d)️⃣\n(.*?)(?=^\d️⃣\n|\Z)', lang, re.S):
        german = []
        for l in block.split('\n'):
            if CYR.search(l):
                break
            german.append(l.strip())
        prompts[int(k)] = ' '.join(german)
    from sprechen_pres import TEXTS  # own texts: the PDF's (blue) texts are the same for everybody and must not be memorised 1:1
    for i, (title, _pdf_paras) in enumerate(topics):
        paras = TEXTS[title]
        n = 9 + i
        text = prompts.get(i + 1, '')
        m = re.search(r'\(z\. ?B\.? ?(.+?)\)', text)
        points = [p.strip()[:1].upper() + p.strip()[1:] for p in re.split(r',\s*', m.group(1))] if m else [text]
        D['SP1'].append({'n': n, 'id': 'SP1-%d' % n, 'title': title, 'points': points, 'task': text,
                         'model': [{'who': '', 't': p, 'g': 'm'} for p in paras], 'src': 'pdf2'})


add_before_sp = add


def add(D):  # noqa: F811
    add_before_sp(D)
    sprechen1(D)


def _words(t):
    return set(re.findall(r'[a-zäöüß]+', t.lower()))


def beschwerde_models(D):
    """Beschwerde.pdf: one model reply per task (1..9); a letter the site already has (same words) is not added twice."""
    txt = open(os.path.join(HERE, 'beschwerde_models.txt'), encoding='utf-8').read()
    ids = {1: ['BV1'], 2: ['BV2'], 3: ['BV3'], 4: ['BV4'], 5: ['BV5'], 6: ['BV6', 'BV6b'], 7: ['BV7', 'BV7b'], 8: ['BV8'], 9: ['BV9']}
    parts = re.split(r'(?m)^(\d) [A-ZÄÖÜ][^\n]*\n', re.sub(r'=====PAGE \d+=====\n', '', txt))
    byid = {b['id']: b for b in D['B']}
    for k in range(1, len(parts), 2):
        n = int(parts[k])
        lines = [l.strip() for l in parts[k + 1].split('\n') if l.strip()]
        letter = reflow(lines, True)
        w = _words(' '.join(letter))
        for bid in ids.get(n, []):
            b = byid.get(bid)
            if not b:
                continue
            have = b.setdefault('models', [])
            if any(len(w & _words(' '.join(m if isinstance(m, list) else [m]))) / max(1, len(w)) > 0.85 for m in have):
                continue
            have.append(letter)
            b.setdefault('models_added', []).append('pdf2')


add_before_models = add


def add(D):  # noqa: F811
    add_before_models(D)
    beschwerde_models(D)


# older / alternative wordings of the Telefonnotiz recordings that the collection still lists (the exam may use any of them)
def notizen_versions(D):
    def N(i, typ, who, g, name, phone, text, info, todo, todo_kw):
        D['N'].append({'id': i, 'type': typ, 'who': who, 'g': g, 'name': name, 'phone': phone, 'info': [{'t': t, 'kw': kw} for t, kw in info],
                       'todo': todo, 'todo_kw': todo_kw, 'text': text, 'src': 'pdf2'})
    CB = ['zurück|rückruf']
    N('N16', 'Angebot', 'Herr Walter', 'm', 'Walter', '0174 113 806 6',
      'Guten Tag, hier spricht Walter von der Firma Groß und Co. Ich rufe wegen Ihrer Kopierpapierbestellung an. Zu Ihren Fragen: Wir haben aktuell das Premiumpapier im Angebot. Sie nehmen ja immer unser Standardpapier. Kopierpapier in Premiumqualität gibt es momentan zu 4,49 € pro 500 Blatt. Wir können Ihnen das Kopierpapier im Rahmen des Expressversands innerhalb eines Tages liefern. Wenn Sie bis 18:00 Uhr bestellen, können wir Ihnen dieses garantieren. Bitte rufen Sie mich zurück und bestätigen Sie die Papiersorte. Mein Name ist Walter, W-A-L-T-E-R. Meine Telefonnummer ist die 0174 113 806 6. Ich wünsche Ihnen noch einen schönen Tag. Auf Wiederhören.',
      [('wegen der Kopierpapierbestellung', ['kopierpapier']), ('Premiumpapier im Angebot', ['premium']), ('4,49 € pro 500 Blatt', ['4,49|4.49', '500']), ('Expressversand innerhalb eines Tages, wenn bis 18:00 Uhr bestellt wird', ['express', '18'])],
      'Zurückrufen und Papiersorte bestätigen', CB + ['papier'])
    N('N17', 'Angebot', 'Herr Fröhlich', 'm', 'Fröhlich', '0178 939 584 2',
      'Guten Tag, hier spricht Fröhlich, buchstabiert F-R-Ö-H-L-I-C-H. Ich wollte Ihnen bezüglich Ihrer Visitenkartenbestellung ein Angebot unterbreiten. Visitenkarten mit dem Premiumpapier gibt es momentan schon ab 16,32 € für 25 Stück. Wir können Ihnen die Visitenkarten im Rahmen des Expressversands innerhalb von 2 Tagen liefern. Wenn Sie bis 20:00 Uhr bestellen, können wir Ihnen diesen garantieren. Bitte rufen Sie mich zurück und bestätigen Sie die Papiersorte. Sie erreichen mich unter der Telefonnummer 0178 939 584 2. Vielen Dank und auf Wiederhören.',
      [('Visitenkartenbestellung', ['visitenkarte']), ('Premiumpapier ab 16,32 € für 25 Stück', ['premium', '16,32|16.32']), ('Expressversand innerhalb von 2 Tagen, bis 20:00 Uhr bestellen', ['2|zwei', '20'])],
      'Zurückrufen und Papiersorte bestätigen', CB + ['papier'])
    N('N18', 'Beschwerde', 'Herr Städtler', 'm', 'Städtler', '0173 536 47 15',
      'Guten Tag, hier spricht Herr Städtler, buchstabiert S-T-Ä-D-T-L-E-R. Ich habe kürzlich 180 Prospekte bei Ihnen bestellt. Allerdings sind nur 100 angekommen. Ich würde darum bitten, die fehlenden 80 Prospekte bis morgen zu liefern. Bitte rufen Sie mich zurück, um die Lieferung zu bestätigen. Sie erreichen mich unter der Telefonnummer 0173 536 47 15. Vielen Dank und auf Wiederhören.',
      [('180 Prospekte bestellt, nur 100 angekommen', ['180', '100']), ('die fehlenden 80 Prospekte bis morgen liefern', ['80', 'morgen'])], 'Zurückrufen, die Lieferung bestätigen', CB + ['liefer'])
    N('N19', 'Beschwerde', 'Herr Hoffmann', 'm', 'Hoffmann', '0179 536 47 15',
      'Guten Tag, hier spricht Herr Hoffmann, buchstabiert H-O-F-F-M-A-N-N. Ich habe kürzlich 200 Prospekte bei Ihnen bestellt, allerdings sind nur 120 angekommen. Ich würde darum bitten, die fehlenden 80 Prospekte bis morgen zu liefern. Bitte rufen Sie mich zurück, um die Lieferung zu bestätigen. Sie erreichen mich unter der Telefonnummer 0179 536 47 15. Vielen Dank und auf Wiederhören.',
      [('200 Prospekte bestellt, nur 120 angekommen', ['200', '120']), ('die fehlenden 80 Prospekte bis morgen liefern', ['80', 'morgen'])], 'Zurückrufen, die Lieferung bestätigen', CB + ['liefer'])
    N('N20', 'Buchung', 'Herr Messner', 'm', 'Messner', '041 337 843 009',
      'Guten Tag, hier spricht Herr Messner, buchstabiert M-E-S-S-N-E-R. Ich möchte für kommenden Freitagabend, den 19.30 Uhr, eine Tischreservierung für fünf Personen vornehmen. Außerdem würde ich gerne wissen, ob für Ihre Gäste Parkmöglichkeiten zur Verfügung stehen. Es wäre ideal, wenn Sie für unsere Gruppe das Menü Nr. 1 vorbereiten könnten. Bitte bestätigen Sie mir die Reservierung sowie die Verfügbarkeit eines Parkplatzes. Sie erreichen mich unter der Telefonnummer 041 337 843 009. Vielen Dank im Voraus für Ihre Rückmeldung. Auf Wiederhören.',
      [('Tisch für 5 Personen reservieren', ['5|fünf']), ('am Freitagabend um 19:30 Uhr', ['freitag', '19']), ('Gibt es Parkplätze für Gäste?', ['park']), ('Menü Nr. 1 vorbereiten', ['1|eins|ein'])],
      'Zurückrufen, Reservierung und Parkplatz bestätigen', CB + ['bestätig'])
    N('N21', 'Buchung', 'Frau Meßner', 'f', 'Meßner', '0413 378 430 09',
      'Nikol Meßner, Firma Karcher und Söhne. Guten Tag. Wir waren letzte Woche bei Ihnen zum Essen, und ich muss sagen, es hat hervorragend geschmeckt. Derzeit würde ich jetzt gerne einen Tisch für fünf Personen reservieren. Es geht um ein Geschäftsessen für meinen Chef und vier Kunden, und zwar für Freitagabend um 19.30 Uhr. Ich bestelle auch jetzt gleich das Essen, damit dann alles problemlos funktioniert. Bitte bereiten Sie für alle das Menü 1 vor. Haben Sie eigentlich einen Parkplatz für Gäste? Bitte rufen Sie mich zurück, um meine Reservierung zu bestätigen. Mein Name ist Meßner, M-E-ß-N-E-R. Meine Telefonnummer lautet 0413 378 430 09. Vielen Dank. Auf Wiedersehen.',
      [('Tisch für 5 Personen reservieren (Chef und 4 Kunden)', ['5|fünf']), ('am Freitagabend um 19:30 Uhr', ['freitag', '19']), ('Haben Sie einen Parkplatz für Gäste?', ['park']), ('Menü 1 vorbereiten', ['1|eins|ein'])],
      'Zurückrufen und Reservierung bestätigen', CB + ['bestätig'])
    N('N22', 'Angebot', 'Herr Schmitt', 'm', 'Schmitt', '0171 88 45 545',
      'Guten Morgen. Herr Schmitt am Apparat. Vielen Dank für Ihr Interesse an unserer Autovermietung. Gerne bestätigen wir den Eingang Ihrer Anfrage und möchten Ihnen einige weitere Details zu unserem Angebot mitteilen. Wir haben ein kleines Auto für Sie verfügbar, das zu einem besonderen Preis von 75 € pro Tag angeboten wird. Bitte beachten Sie, dass das Auto mit einem vollen Tank Benzin bereitgestellt wird. Bitte beachten Sie auch, dass wir derzeit keine großen Fahrzeuge mehr verfügbar haben, sondern nur noch kleine. Die Rückgabe des Autos kann entweder von Ihnen persönlich vorgenommen werden, oder wir können dies für Sie arrangieren. Abschließend möchten wir gerne noch über die Versicherungsoptionen sprechen. Bitte rufen Sie uns zurück, damit wir diese Details klären können. Sie können uns unter der Telefonnummer 0171 88 45 545 erreichen. Mein Name ist Schmitt. Ich buchstabiere S-C-H-M-I-T-T. Vielen Dank für Ihr Verständnis und Ihre Zusammenarbeit.',
      [('75 € pro Tag ein kleines Auto', ['75', 'klein']), ('das Auto mit vollem Tank Benzin', ['tank|benzin']), ('kein großes Auto verfügbar', ['groß']), ('Rückgabe persönlich oder sie können arrangieren', ['rückgabe']), ('über die Versicherungsoptionen sprechen', ['versicherung'])],
      'Zurückrufen und Details klären', CB + ['klär'])
    N('N23', 'Beschwerde', 'Dr. Meyer', 'm', 'Meyer', '0512 37 285 618',
      'Guten Tag, hier ist Dr. Meyer. Wir müssen dringend etwas besprechen. Vor ein paar Tagen hatten wir vereinbart, dass Ihre Firma heute unsere Praxis streichen würde. Wir haben extra dafür die Praxis geschlossen und alles vorbereitet. Nun höre ich von meinen Mitarbeitern, dass die Maler überhaupt nicht erschienen sind. Wie gedenken Sie jetzt weiter vorzugehen? Als wir vor fünf Jahren das letzte Mal gestrichen haben, gab es solche Probleme nicht. Denken Sie auch daran, weiße und grüne Farbe mitzubringen. Ich erwarte, dass die Wände bis morgen um 13 Uhr fertig gestrichen sind. Bitte rufen Sie mich umgehend zurück. Mein Name ist Meyer, buchstabiert M-E-Y-E-R. Sie können mich unter der Nummer 0512 37 285 618 erreichen. Vielen Dank und auf Wiederhören.',
      [('Heute die Praxis streichen', ['praxis']), ('die Maler überhaupt nicht erschienen', ['maler', 'nicht']), ('weiße und grüne Farbe mitbringen', ['weiß', 'grün']), ('bis morgen um 13 Uhr fertig gestrichen', ['morgen', '13'])],
      'Umgehend zurückrufen', CB)
    N('N24', 'Beschwerde', 'Dr. Mayer', 'm', 'Mayer', '05123 72 85 618',
      'Guten Tag. Hier spricht Dr. Mayer. Wir müssen dringend etwas klären. Wir hatten doch vor ein paar Tagen verabredet, dass Ihre Firma heute unsere Praxis streicht. Wir haben extra unsere Praxis geschlossen und alles für Sie vorbereitet. Und jetzt höre ich von meinen Mitarbeitern, dass die Maler gar nicht gekommen sind. Wie stellen Sie sich das jetzt vor? Wir haben zuletzt vor fünf Jahren streichen lassen. Da gab es solche Probleme gar nicht. Denken Sie auch daran, dass Sie weiße und grüne Farbe mitbringen. Ich erwarte, dass bis morgen Mittag die Wände gestrichen sind. Ich bitte dringend um Rückruf. Mein Name ist Mayer, M-A-Y-E-R. Sie erreichen mich unter der Nummer 05123 72 85 618. Danke und auf Wiederhören.',
      [('Heute die Praxis streichen', ['praxis']), ('die Maler gar nicht gekommen', ['maler', 'nicht']), ('weiße und grüne Farbe mitbringen', ['weiß', 'grün']), ('bis morgen Mittag die Wände gestrichen', ['morgen', 'mittag'])],
      'Dringend um Rückruf', CB)


add_before_nv = add


def add(D):  # noqa: F811
    add_before_nv(D)
    notizen_versions(D)


# ---------------------------------------------------------------- Redemittel with Russian translation (DB.RM)
def _bullets(text):
    cur, out = None, []
    for l in text:
        if l.startswith('• '):
            cur = [l[2:]]
            out.append(cur)
        elif cur is not None and not re.match(r'^\d [^\s]+\s+[A-ZА-Я]', l) and not l.startswith(('DUZEN', 'SIEZEN')):
            cur.append(l)
    return [re.sub(r'\s*★.*$', '', glue_all(b)) for b in out]


def glue_all(parts):
    t = ''
    for p in parts:
        t = glue(t, p)
    return t


def rm_forum():
    lines = [l.strip() for l in open(os.path.join(HERE, 'forum_rm.txt'), encoding='utf-8').read().split('\n')
             if l.strip() and not l.startswith(('=====', '💬'))]
    heads = [re.match(r'^(\d)\s+\S+\s+(.+?)\s+\1\s+\S+\s+(.+)$', l) for l in lines if re.match(r'^\d [^\s]+\s+[A-ZА-Я]', l)]
    heads = [(m.group(2), m.group(3)[:1].upper() + m.group(3)[1:].lower()) for m in heads if m][:8]
    runs = []
    for b in _bullets(lines):
        ru = bool(CYR.search(b))
        if runs and runs[-1][0] == ru:
            runs[-1][1].append(b)
        else:
            runs.append((ru, [b]))
    de_runs = [r[1] for r in runs if not r[0]]
    ru_runs = [r[1] for r in runs if r[0]]
    assert len(de_runs) == len(ru_runs) == len(heads) == 8 and all(len(a) == len(b) for a, b in zip(de_runs, ru_runs))
    def ph(t):  # the PDF text layer lost the [placeholders]; they stand at " ." and at double spaces
        t = re.sub(r'\s*\[Thema\] \[Thema\].*$', '', t)  # the legend of the page glued to the last greeting
        t = re.sub(r'\[тема\]', '[…]', t)
        t = re.sub(r'планирует$', 'планирует […].', t)
        t = re.sub(r'\s{2,}', ' […] ', t)
        return re.sub(r'(?<=\S) \.', ' […].', t)
    return [{'h': hd, 'hr': hr.capitalize(), 'items': [{'de': ph(d), 'ru': ph(r)} for d, r in zip(a, b)]}
            for (hd, hr), a, b in zip(heads, de_runs, ru_runs)]


def _pairs(*pp):
    return [{'de': d, 'ru': r} for d, r in pp]


def rm_beschwerde():
    """Beschwerde.pdf / pages 205-206: the 10 building blocks of the answer to the customer, German + Russian."""
    def topic(tag, de, ru):
        return {'de': de, 'ru': ru, 'tag': tag}
    return [
        {'h': 'Anrede', 'hr': 'Обращение', 'items': _pairs(('Sehr geehrte Frau [Name], / Sehr geehrter Herr [Name],', 'Уважаемая г-жа [Фамилия], / Уважаемый г-н [Фамилия],'))},
        {'h': 'Dank & Bezugnahme', 'hr': 'Благодарность и указание темы', 'items': [
            topic('alle Themen (Putzdienst, Webseite, Umzug …)', 'vielen Dank für Ihre Nachricht, in der Sie uns über Probleme mit unserem Service informiert haben.', 'Благодарим вас за сообщение, в котором вы информируете нас о проблемах с нашим сервисом.'),
            topic('Spülmaschine, Drucker', 'vielen Dank für Ihre Nachricht, in der Sie uns über Probleme mit dem Gerät informiert haben.', 'Благодарим вас за сообщение, в котором вы информируете нас о проблемах с устройством.'),
            topic('Rechnung', 'vielen Dank für Ihre Nachricht, in der Sie uns über Probleme mit der Rechnung informiert haben.', 'Благодарим вас за сообщение, в котором вы информируете нас о проблемах со счётом.'),
            topic('Tischlampe, Mangelhafte Lieferung', 'vielen Dank für Ihre Nachricht, in der Sie uns über Probleme mit der Lieferung informiert haben.', 'Благодарим вас за сообщение, в котором вы информируете нас о проблемах с доставкой.'),
            topic('Pflanzenlieferung', 'vielen Dank für Ihre Nachricht, in der Sie uns über Probleme mit der Bestellung informiert haben.', 'Благодарим вас за сообщение, в котором вы информируете нас о проблемах с заказом.')]},
        {'h': 'Entschuldigung', 'hr': 'Извинения', 'items': [
            topic('wenn die Firma schuld ist', 'Wir bedauern die entstandenen Unannehmlichkeiten sehr und bitten Sie um Entschuldigung.', 'Мы глубоко сожалеем о причинённых неудобствах и приносим свои извинения.'),
            topic('wenn die Verantwortung unklar ist (Drucker / Schmidt & Zeller)', 'Wir bedauern, dass es zu dieser Situation gekommen ist.', 'Мы сожалеем, что сложилась такая ситуация.')]},
        {'h': 'Erklärung', 'hr': 'Объяснение причины', 'items': [
            topic('Reinigung, Umzug', 'Nach interner Prüfung wurde festgestellt, dass es aufgrund von internen organisatorischen Problemen zu diesem Vorfall gekommen ist.', 'По результатам внутренней проверки было установлено, что из-за внутренних организационных проблем возникла данная ситуация.'),
            topic('Umzug, Mangelhafte Lieferung', 'Nach interner Prüfung wurde festgestellt, dass es aufgrund von personellen Engpässen zu diesem Vorfall gekommen ist.', 'По результатам внутренней проверки было установлено, что из-за нехватки персонала возникла данная ситуация.'),
            topic('Spülmaschine', 'Nach interner Prüfung wurde festgestellt, dass es aufgrund eines technischen Defekts am Gerät zu diesem Vorfall gekommen ist.', 'По результатам внутренней проверки было установлено, что из-за технической неисправности устройства возникла данная ситуация.'),
            topic('Rechnung', 'Nach interner Prüfung wurde festgestellt, dass es aufgrund eines Computerproblems zu diesem Vorfall gekommen ist.', 'По результатам внутренней проверки было установлено, что из-за сбоя в компьютерной системе возникла данная ситуация.'),
            topic('Tischlampe, Mangelhafte Lieferung', 'Nach interner Prüfung wurde festgestellt, dass es aufgrund unvorhergesehener Lieferschwierigkeiten zu diesem Vorfall gekommen ist.', 'По результатам внутренней проверки было установлено, что из-за непредвиденных трудностей с поставкой возникла данная ситуация.'),
            topic('Pflanzenlieferung, Webseite, Rechnung', 'Nach interner Prüfung wurde festgestellt, dass es aufgrund einer Verwechslung bei der Bearbeitung zu diesem Vorfall gekommen ist.', 'По результатам внутренней проверки было установлено, что из-за ошибки при обработке заказа возникла данная ситуация.'),
            topic('Drucker', 'Nach interner Prüfung wurde festgestellt, dass es aufgrund einer fehlerhaften Bedienung des Geräts zu diesem Vorfall gekommen ist.', 'По результатам внутренней проверки было установлено, что из-за неправильной эксплуатации устройства возникла данная ситуация.')]},
        {'h': 'Verständnis zeigen', 'hr': 'Понимание важности решения', 'items': _pairs(('Darüber hinaus verstehen wir, wie wichtig eine schnelle Lösung für Ihr Unternehmen ist.', 'Мы понимаем, насколько важно для вашей компании скорейшее решение вопроса.'))},
        {'h': 'Lösung', 'hr': 'Решение', 'items': [
            topic('Putzdienst / Lassner', 'Wir haben heute mit unseren Mitarbeitern gesprochen und die Situation geklärt. Wir möchten Ihnen versichern, dass sich dies nicht wiederholen wird.', 'Сегодня мы провели беседу с нашими сотрудниками и прояснили ситуацию. Заверяем вас, что подобное не повторится.'),
            topic('Tischlampe / Berger & Lutz', 'Wir bitten Sie, noch bis nächste Woche Montag zu warten. Falls Ihre Bestellung bis dahin nicht eingetroffen ist, bieten wir Ihnen gerne ein vergleichbares Modell aus unserem Lagerbestand an.', 'Просим вас подождать до следующего понедельника. Если ваш заказ не поступит к этому сроку, мы с удовольствием предложим вам аналогичную модель из нашего складского запаса.'),
            topic('Webseite / Stiller', 'Den Fehler bei den Namen werden wir bis Ende dieser Woche kostenfrei korrigieren. Bitte beachten Sie, dass das vereinbarte Farbschema laut Vertrag korrekt umgesetzt wurde. Weitere Korrekturen sind leider nur gegen einen Aufpreis von [X €] möglich.', 'Ошибку с именами мы исправим бесплатно до конца этой недели. Обращаем ваше внимание, что цветовая схема была реализована в соответствии с договором. Любые дополнительные правки возможны только за доплату в размере [X €].'),
            topic('Spülmaschine / Krüger', 'Unser Techniker kann am [Datum] um [Uhrzeit] Uhr zu Ihnen kommen und das Gerät überprüfen. Bitte teilen Sie uns mit, ob der Termin passt. Bitte beachten Sie, dass eine sofortige Reparatur nicht möglich ist, falls wir Ersatzteile bestellen müssen. In diesem Fall informieren wir Sie umgehend.', 'Наш технический специалист может приехать к вам [дата] в [время]. Пожалуйста, сообщите нам, подходит ли вам это время. Обращаем ваше внимание, что в случае необходимости заказа запчастей незамедлительный ремонт будет невозможен. В таком случае мы сразу же вас уведомим.'),
            topic('Umzug / Zaun & Lozano', 'Am Mittwochmorgen werden pünktlich zwei unserer Mitarbeiter bei Ihnen sein und den Möbelaufbau abschließen. Für die beschädigten Gegenstände übernehmen wir selbstverständlich die Kosten.', 'В среду утром ровно в назначенное время к вам прибудут двое наших сотрудников и завершат сборку мебели. Расходы на повреждённое имущество мы, разумеется, берём на себя.'),
            topic('Drucker / Schmidt & Zeller', 'Nach Rücksprache mit unserem Techniker wurde festgestellt, dass die Fehler auf eine fehlerhafte Bedienung zurückzuführen sind. Wir möchten Sie daher höflich darauf hinweisen, dass die Lösung dieses Problems nicht in unserem Verantwortungsbereich liegt. Gerne kommt unser Techniker erneut zu Ihnen und weist Ihre Mitarbeiterinnen und Mitarbeiter kostenfrei in die Bedienung ein. Bitte beachten Sie, dass die Kosten für [die bisherigen Technikerbesuche] / [die Überprüfung des Geräts] bei Ihnen verbleiben.', 'По результатам консультации с нашим техническим специалистом было установлено, что неполадки вызваны неправильной эксплуатацией устройства. Мы хотели бы вежливо указать вам, что решение данной проблемы не входит в нашу зону ответственности. Наш специалист готов повторно посетить вашу компанию и бесплатно провести обучение сотрудников. Обращаем ваше внимание, что расходы за [предыдущие визиты технического специалиста] / [диагностику устройства] остаются на вашей стороне.'),
            topic('Rechnung / Schmidt', 'Wir haben Ihren Auftrag überprüft und die erforderlichen Korrekturen vorgenommen. Ihr üblicher Rabatt von [X %] wurde dabei selbstverständlich berücksichtigt. Die korrigierte Rechnung erhalten Sie in Kürze erneut zugesandt.', 'Мы проверили ваш заказ и внесли необходимые исправления. Ваша обычная скидка в размере [X %] была учтена. Исправленный счёт будет выслан вам в ближайшее время.'),
            topic('Mangelhafte Lieferung / Schramm', 'Für die beschädigten Waren bieten wir Ihnen einen Preisnachlass von [X %] an. Alternativ können Sie uns die Artikel zurücksenden und wir liefern Ersatz in einwandfreier Qualität. Die fehlenden T-Shirts liefern wir aufgrund unserer aktuellen Personalsituation leider erst bis zum [Datum] nach. Die Versandkosten übernehmen selbstverständlich wir.', 'За повреждённый товар мы предлагаем вам скидку в размере [X %]. В качестве альтернативы вы можете вернуть нам товар, и мы доставим замену надлежащего качества. Недостающие футболки мы, к сожалению, отправим не ранее [дата] в связи с текущей кадровой ситуацией. Расходы на доставку мы берём на себя.'),
            topic('Pflanzenlieferung / Talheim', 'Die durch unseren Fehler entstandenen Zusatzkosten übernehmen wir selbstverständlich. Bitte senden Sie uns die entsprechenden Belege zu. Wir würden uns freuen, Sie weiterhin zu unseren Kunden zählen zu dürfen.', 'Дополнительные расходы, возникшие по нашей вине, мы, разумеется, компенсируем в полном объёме. Просим вас направить нам соответствующие подтверждающие документы. Мы будем рады продолжить сотрудничество с вами.')]},
        {'h': 'Entgegenkommen', 'hr': 'Компенсация (только если скидка упомянута в письме руководителя)', 'items': [
            topic('Putzdienst / Lassner, Pflanzenlieferung / Talheim', 'Als Zeichen unseres Entgegenkommens bieten wir Ihnen einen Rabatt von [X %] auf Ihren nächsten Auftrag an.', 'В знак нашей доброй воли мы предлагаем вам скидку в размере [X %] на ваш следующий заказ.')]},
        {'h': 'Dank & Zusammenarbeit', 'hr': 'Благодарность и сохранение сотрудничества', 'items': _pairs(('Abschließend danken wir Ihnen für Ihr Verständnis und hoffen auf eine weiterhin gute Zusammenarbeit.', 'В заключение благодарим вас за понимание и надеемся на дальнейшее плодотворное сотрудничество.'))},
        {'h': 'Service-Satz', 'hr': 'Готовность к обратной связи', 'items': _pairs(('Für Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung.', 'По всем вопросам вы можете обратиться к нам в любое время.'))},
        {'h': 'Grußformel', 'hr': 'Вежливое завершение письма', 'items': _pairs(('Mit freundlichen Grüßen\n[Ihr Vorname und Nachname]', 'С уважением,\n[Ваше имя и фамилия]'))},
    ]


def redemittel(D):
    D['RM'] = {'forum': rm_forum(), 'beschwerde': rm_beschwerde()}


add_before_rm = add


def add(D):  # noqa: F811
    add_before_rm(D)
    redemittel(D)


# ---------------------------------------------------------------- Forum topics that only occur in the exam table (pp. 98-106)
# (the table itself is not shown on the site; only topics that were missing are added, numbers continue after the old ones)
FORUM_NEW = [
    ('Zusätzliche Aufgaben', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrer Firma müssen mehr Aufgaben übernehmen, da keine neuen Mitarbeitenden eingestellt werden können.'),
    ('Privattelefonate sind verboten', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrer Firma dürfen während der Arbeitszeit nur dienstliche Telefonate führen. Private Handynutzung ist am Arbeitsplatz verboten.'),
    ('Überstunden ohne Extra-Bezahlung', 'Alle Mitarbeiterinnen und Mitarbeiter sollen bereit sein, Überstunden zu leisten. Diese werden nicht extra bezahlt, sondern sind mit dem übertariflichen Gehalt ausgeglichen.'),
    ('Parken nur für Kunden', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrer Firma dürfen nicht mehr ihre Autos auf dem Firmengelände parken. Das Parken ist jetzt nur noch für Kunden. Das Unternehmen übernimmt die Kosten nur noch für den öffentlichen Nahverkehr.'),
    ('Im Firmengebäude parken', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrer Firma sollen im Firmengebäude parken und jeden Monat 20 € bezahlen.'),
    ('Chat einrichten', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrer Firma sollen einen Chat einrichten, um Probleme während der Arbeit oder in den Pausen schnell zu lösen.'),
    ('Weiterbildung. Zuschlag 50 Euro', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrer Firma müssen mindestens zweimal pro Jahr eine Weiterbildung nach der Arbeitszeit machen. Die Firma unterstützt sie dabei und bezahlt einen Zuschlag von 50 Euro.'),
    ('Betriebliche Erreichbarkeitsregelung', 'Wegen eines großen Betriebsauftrags müssen alle Mitarbeitenden am Wochenende / unter der Woche zwei Monate lang telefonisch erreichbar sein. Dann bekommen sie noch 2 extra Urlaubstage.'),
    ('Wochenendreise statt Weihnachtsfeier', 'Die Geschäftsleitung plant, statt der Weihnachtsfeier mit allen Mitarbeiter*innen und ihren Familien über das Wochenende in eine europäische Stadt zu fahren.'),
    ('Mitarbeiter*in des Jahres', 'Die Firma plant, jedes Jahr einen „Mitarbeiter*in des Jahres“ zu wählen. Der oder die Gewinner*in erhält eine finanzielle Belohnung.'),
    ('Urlaubstage bis zum Ende eines jeden Jahres', 'Alle Mitarbeitenden müssen die verbleibenden Urlaubstage bis zum Ende eines jeden Jahres verbrauchen, sonst verfallen sie.'),
    ('Samstags 2 Mal pro Jahr an Fortbildungen', 'Alle Mitarbeiterinnen und Mitarbeiter sollen samstags 2 Mal pro Jahr an Fortbildungen teilnehmen. Zusätzlich bekommen sie einen Urlaubstag.'),
    ('Mitarbeiterbindung', 'Um die Mitarbeiterbindung zu stärken, möchte unsere Firma in Zukunft den Mitarbeiterinnen und Mitarbeitern alle 5 Jahre den Urlaub um einen Tag verlängern.'),
    ('Erste-Hilfe-Kurse', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrer Firma sollen verpflichtend Erste-Hilfe-Kurse machen, die vom Unternehmen finanziert werden. Dafür gibt es Freizeitausgleich.'),
    ('Kommunikationstraining', 'Die Geschäftsleitung möchte, dass die Mitarbeitenden am Wochenende an einem verpflichtenden Kommunikationstraining teilnehmen. Aufgrund der derzeit hohen Arbeitsbelastung wird der Kurs am Wochenende durchgeführt.'),
    ('Homeoffice nur 1 Tag', 'Ab nächstem Monat wird das Homeoffice weitgehend abgeschafft. Alle Mitarbeiterinnen und Mitarbeiter der Firma sollen künftig an vier Tagen pro Woche im Büro arbeiten. Die Arbeit von zu Hause ist nur noch an einem Tag möglich.'),
    ('Weiterbildung „Erfolgreich mit den Kunden kommunizieren“', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrer Firma sollen an der kostenfreien Weiterbildung „Erfolgreich mit den Kunden kommunizieren“ zweimal pro Jahr teilnehmen, die in der Arbeitszeit stattfinden wird.'),
    ('Mehr Stunden im Homeoffice', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrer Firma sollen die Möglichkeit erhalten, mehr Stunden im Homeoffice zu verbringen, um Familie und Beruf besser miteinander vereinbaren zu können.'),
    ('Büromöbel', 'Alle Mitarbeitenden Ihrer Firma sollen ihre Überstunden durch Freizeit ausgleichen. Die dadurch eingesparten Mittel werden für die Anschaffung neuer Büromöbel verwendet.'),
    ('Überstunden durch Freizeit ausgleichen', 'Die Mitarbeiterinnen und Mitarbeiter in Ihrer Firma sollen ihre Überstunden zukünftig in Form von Freizeit ausgleichen. Die Absprache mit der Abteilungsleitung ist erforderlich. Eine Auszahlung ist nicht mehr möglich.'),
    ('Firmenchat', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrer Firma werden nach der Kündigung aus dem Firmenchat entfernt, damit sie nicht auf die aktuellen Informationen der Firma zugreifen können.'),
    ('An Samstagen arbeiten', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrer Firma sollen aufgrund der guten Auftragslage auch an Samstagen arbeiten. Diese Arbeitszeiten werden mit einem Zuschlag in Höhe von 120 Prozent vergütet.'),
    ('Unternehmen vorstellen', 'Alle Mitarbeiterinnen und Mitarbeiter Ihrer Firma sollen künftig in den Schulen der Region das Unternehmen vorstellen. Ziel dieser Maßnahme ist es, für das Ausbildungsangebot des Betriebs zu werben und neue Auszubildende zu gewinnen. Nicht alle im Team sind von dieser Idee begeistert.'),
    ('Zigarettenpause', 'In jedem Firmengebäude soll ein Raucherraum eingerichtet werden, damit Raucher ihre 5-Minuten-Zigarettenpause schneller machen können, ohne vor das Gebäude zu gehen. Raucher sollen jedoch 15 Minuten länger arbeiten.'),
    ('Dresscode', 'Alle Mitarbeitenden Ihrer Firma sollen einen Dresscode einhalten und formelle Kleidung statt Jeans und Sportschuhe tragen.'),
    ('Arbeitsplätze selbst aufräumen', 'Alle Mitarbeitenden Ihrer Firma sollen ihre Arbeitsplätze selbst aufräumen. Als Vergütung bekommt man dann Snacks, Obst und Gemüse.'),
    ('Firmenräume', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrer Firma dürfen Räume, Küche und Garten für private Veranstaltungen kostenlos nutzen.'),
    ('4-Tage-Woche – 10 Stunden pro Tag', 'Alle Mitarbeitenden sollen künftig vier Tage pro Woche arbeiten. Dafür wird der Arbeitstag von acht auf zehn Stunden erhöht. Aber sie bekommen einen zusätzlichen freien Tag.'),
    ('Essverbot am Arbeitsplatz', 'Allen Mitarbeiterinnen und Mitarbeitern in Ihrer Firma ist es aus hygienischen Gründen verboten, am Arbeitsplatz zu essen.'),
    ('Verpflichtende Konfliktmanagementseminare', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrem Unternehmen sollen an einem Seminar teilnehmen, um die Kommunikation und das Arbeitsklima im Unternehmen zu verbessern.'),
    ('Kurze Kleidung ist verboten', 'Allen Mitarbeiterinnen und Mitarbeitern in Ihrer Firma ist es im Sommer nicht erlaubt, unangemessen kurze Kleidung bei der Arbeit zu tragen. Außerdem sollen kurze Hosen, Miniröcke und ärmellose Oberteile nicht getragen werden.'),
    ('Mehr Fortbildungen', 'Alle Mitarbeiterinnen und Mitarbeiter sollen mehr Fortbildungen besuchen. Für jede absolvierte Fortbildung erhalten sie Punkte, die später gegen Gutscheine (z. B. für Freizeitangebote oder Einkaufsgutscheine) eingetauscht werden können.'),
    ('Gleitzeit wird abgeschafft', 'Alle Mitarbeiterinnen und Mitarbeiter sollen von 8:30 bis 17 Uhr arbeiten. Die Gleitzeit wird abgeschafft.'),
    ('Kurze Dienstreisen nur online', 'Alle Mitarbeiterinnen und Mitarbeiter Ihrer Firma sollen kurze Dienstreisen zwischen Mitarbeitern und Kunden aus anderen Städten nur noch virtuell durchführen.'),
    ('Weiterbildungen ausschließlich online', 'Die Geschäftsleitung Ihrer Firma hat beschlossen, dass alle Mitarbeiterinnen und Mitarbeiter im nächsten Jahr an einer Weiterbildung teilnehmen sollen. Dabei werden ausschließlich Online-Kurse berücksichtigt.'),
    ('Einsatz für die Umwelt', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrer Firma sollen nach Möglichkeit am kommenden Wochenende an einer Baumpflanz-Aktion im Stadtwald teilnehmen, um das Umweltengagement der Firma zu unterstützen.'),
    ('Kurzarbeit', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrer Firma sollen aufgrund der schlechten Auftragslage ab sofort in Kurzarbeit gehen. Die Arbeitszeit wird für die gesamte Belegschaft um 50 % verringert.'),
    ('Abdeckung zwischen Weihnachten und Neujahr', 'Alle Mitarbeitenden Ihrer Firma sollen auf zwei Tage ihres Urlaubs verzichten, damit alle Betriebsferien zwischen Weihnachten und Neujahr abgedeckt sind.'),
    ('Ein Urlaubstag für Fortbildungen', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrer Firma sollen ab dem kommenden Jahr für Fortbildungen einen Urlaubstag nehmen. Bezahlt werden die Fortbildungen aber weiterhin von der Firma.'),
    ('Geschäftsreisen mit der Bahn', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrer Firma sind angehalten, für Geschäftsreisen vermehrt Verkehrsmittel wie die Bahn anstelle des eigenen Autos zu nutzen.'),
    ('Getränke nicht mehr bereitgestellt', 'Alle Mitarbeiterinnen und Mitarbeiter in Ihrer Firma sollen Kaffee und andere Getränke ab sofort von zu Hause mitbringen, da die Firma diese nicht mehr bereitstellt.'),
    ('Team-Bildung-Event', 'Alle Mitarbeiterinnen und Mitarbeiter sollen an einem Teambildungs-Event in einer anderen Stadt am Wochenende teilnehmen.'),
]


def forum_topics(D):
    have = {re.sub(r'\W', '', f['title'].lower()) for f in D['F']}
    for t, d in FORUM_NEW:
        if re.sub(r'\W', '', t.lower()) in have:
            continue
        D['F'].append({'n': len(D['F']) + 1, 'title': t, 'desc': d, 'new': True, 'src': 'pdf2'})


add_before_ft = add


def add(D):  # noqa: F811
    add_before_ft(D)
    forum_topics(D)
