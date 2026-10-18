"""Render every Hören / Telefonnotiz recording with Microsoft neural German voices (edge-tts).
Run on your own computer (needs internet):
    python3 -m pip install edge-tts
    python3 src/gen_audio.py
Creates assets/audio/*.mp3 + assets/audio/index.json. The app plays them automatically; without them it uses browser voices."""
import asyncio, json, os, re, sys

try:
    import edge_tts
except ImportError:
    sys.exit("Сначала установите: python3 -m pip install edge-tts")

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets', 'audio')
F_VOICES = ['de-DE-KatjaNeural', 'de-DE-AmalaNeural', 'de-DE-SeraphinaMultilingualNeural']
M_VOICES = ['de-DE-ConradNeural', 'de-DE-KillianNeural', 'de-DE-FlorianMultilingualNeural']
RATE = '-4%'

F_NAMES = re.compile(r'^(frau|kundin|chefin|leiterin|verkäuferin|kollegin|mitarbeiterin|sekretärin|ärztin|lehrerin|teamleiterin|erzieherin|alimi|amira|anita|barthum|ella|emilia|lena|melanie|mia|michaella|sabine|sandra|jana|anna|katia|kathrin|andrea|daniela|barbara|rita|lara|clara|anja|irina|erisia|trixi|julia|gina|miriam|petra|adriane)', re.I)
M_NAMES = re.compile(r'^(herr|chef\b|kunde|leiter\b|verkäufer\b|kollege|mitarbeiter\b|teamleiter\b|sprecher|ignacio|karl|markus|max|michael|murat|mustafa|simmering|timbur|tom|thomas|zarif|juri|mario|taro|felix|daniel|robert|stefan|guido|waldemar|julius|konstantinos|roman|paul|eno|hans|ahmed|achmed)', re.I)

def gender(who, i):
    w = (who or '').strip()
    if F_NAMES.match(w): return 'f'
    if M_NAMES.match(w): return 'm'
    m = re.search(r'(\d)', w)
    if m: return 'f' if int(m.group(1)) % 2 else 'm'
    return 'm' if i % 2 else 'f'

def fnv(s):  # must match fnv() in assets/app.js
    h = 0x811c9dc5
    for b in s.encode('utf-8'):
        h ^= b
        h = (h * 0x01000193) & 0xffffffff
    return format(h, '08x')

DIG = 'null eins zwei drei vier fünf sechs sieben acht neun'.split()
def speakable(t):
    t = t.replace('*innen', 'innen').replace('20XX', 'zwanzig x x')
    t = re.sub(r'\b([A-ZÄÖÜ]{1,3}(?:\s?-\s?[A-ZÄÖÜ]{1,3}){2,})\b', lambda m: ', '.join(re.split(r'\s?-\s?', m.group(1))) + ',', t)
    def phone(m):
        return ', '.join(' '.join(DIG[int(c)] for c in g) for g in re.split(r'[\s\-/]+', m.group(0).strip()) if g) + ','
    return re.sub(r'(?<![\d.,])0\d{2,5}(?:[\s\-/]\d{1,6}){1,5}(?![\d.,])|(?<![\d.,])0\d{7,12}(?![\d.,])', phone, t)

def recordings(DB):
    for v in DB['H1']:
        for d in v['dialogs']: yield d['segs']
    for v in DB['H2']:
        for d in v['dialogs']: yield d['segs']
    for v in DB['H3']: yield v['segs']
    for v in DB['H4']:
        for m in v['msgs']: yield [{'who': 'Anrufer' + ('in' if m['g'] == 'f' else ''), 't': m['text'], 'g': m['g']}]
    for x in DB['N']: yield [{'who': x['who'], 't': x['text'], 'g': x['g']}]
    for k in ('SP1', 'SP2', 'SP3'):
        for x in DB[k]: yield x['model']
    # texts of the "Учить наизусть" page: one single-voice recording each (same flattening as learnText() in the app)
    flat = lambda t: re.sub(r'\s*\n+\s*', ' ', t)
    for b in DB['B']:
        for m in b.get('models') or []: yield [{'who': '', 't': flat('\n'.join(m) if isinstance(m, list) else m), 'g': 'f'}]
    yield [{'who': '', 't': flat(DB['F_MODEL']), 'g': 'f'}]
    for x in DB['SP1']: yield [{'who': '', 't': flat('\n\n'.join(s['t'] for s in x['model'])), 'g': 'f'}]

def jobs(DB):
    out = {}
    for n, segs in enumerate(recordings(DB)):
        speakers = []
        for s in segs:
            if s.get('who') not in speakers: speakers.append(s.get('who'))
        cast, fi, mi = {}, 0, 0
        for i, who in enumerate(speakers):
            g = next(s for s in segs if s.get('who') == who).get('g') or gender(who, i)
            rot = n if len(speakers) == 1 else 0  # single-voice messages: vary the voice between recordings
            if g == 'f': cast[who] = F_VOICES[(fi + rot) % len(F_VOICES)]; fi += 1
            else: cast[who] = M_VOICES[(mi + rot) % len(M_VOICES)]; mi += 1
        for s in segs:
            key = fnv((s.get('who') or '') + '\u0001' + s['t'])
            out.setdefault(key, (cast[s.get('who')], speakable(s['t'])))
    return out

async def main():
    src = open(os.path.join(ROOT, 'assets', 'data.js'), encoding='utf-8').read()
    src = src.split('\nconst I18N')[0]  # data.js also carries the UI translations
    DB = json.loads(src[src.index('{'): src.rindex('}') + 1])
    os.makedirs(OUT, exist_ok=True)
    J = jobs(DB)
    sem = asyncio.Semaphore(4)
    done = {'n': 0}
    async def one(key, voice, text):
        path = os.path.join(OUT, key + '.mp3')
        if os.path.exists(path) and os.path.getsize(path) > 1000: return key
        async with sem:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(text, voice, rate=RATE).save(path + '.part')
                    os.replace(path + '.part', path)
                    done['n'] += 1
                    if done['n'] % 25 == 0: print(f"  {done['n']} / {len(J)}", flush=True)
                    return key
                except Exception as e:
                    if attempt == 3: print('FEHLER', key, voice, repr(e)[:120]); return None
                    await asyncio.sleep(2 * (attempt + 1))
    print(f'Озвучиваю {len(J)} реплик нейроголосами Microsoft…')
    res = await asyncio.gather(*(one(k, v, t) for k, (v, t) in J.items()))
    index = {k: k + '.mp3' for k in res if k}
    json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'))
    print(f'Готово: {len(index)} из {len(J)} реплик. Откройте страницу заново (Cmd+Shift+R).')
    if len(index) < len(J): print('Не все реплики озвучены. Запустите скрипт ещё раз, он дозапишет недостающие.')

asyncio.run(main())
