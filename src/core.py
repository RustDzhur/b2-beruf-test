import re
import os; SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 't.txt')
L = [''] + open(SRC, encoding='utf-8').read().split('\n')   # 1-based

HOMO = str.maketrans({'а':'a','с':'c','е':'e','о':'o','р':'p','х':'x','у':'y','А':'A','В':'B','С':'C','Е':'E','Н':'H','К':'K','М':'M','О':'O','Р':'P','Т':'T','Х':'X','Η':'H','Μ':'M','Α':'A','Ο':'O'})
CYR = re.compile(r'[А-Яа-яЁёІіЇїЄє]{3,}')

def clean_line(s):
    s = s.replace(' ', ' ').replace('\t', ' ').replace(' или ', ' / ').rstrip()
    s = re.sub(r'[\x00-\x08\x0b-\x1f]', '-', s)
    if re.fullmatch(r'\s*\d{1,3}\s*', s): return None
    if re.search(r'Ссылка на запись|звуковая дорожка', s): return None
    m = CYR.search(s)
    if m:
        head = s[:m.start()]
        head = re.sub(r'[\s(\[–\-—,:;/]+$', '', head)
        if len(re.sub(r'[^A-Za-zÄÖÜäöüß]', '', head)) < 3: return None
        s = head
    s = s.translate(HOMO)
    s = re.sub(r'\s*[-–—]\s*\d{2,3}\s*%\s*$', '', s)
    s = re.sub(r'\s*\(?\d{2,3}\s*%\)?\s*$', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s if s else None

def lines(a, b):
    out = []
    for i in range(a, b + 1):
        c = clean_line(L[i])
        if c is None or DROP.match(c): continue
        out.append(c)
    return out

def pieces(spec):
    if isinstance(spec, tuple): spec = [spec]
    out = []
    for a, b in spec: out += lines(a, b)
    return out

def paras(ls, wrap=78):
    """join PDF-wrapped lines into paragraphs"""
    out = []; cur = ''
    for s in ls:
        if cur:
            if re.search(r'[A-Za-zäöüß]-$', cur) and re.match(r'[a-zäöüß]', s): cur = cur[:-1] + s
            else: cur += ' ' + s
        else: cur = s
        if len(s) < wrap or s.endswith(':') and len(s) < 95:
            out.append(cur); cur = ''
    if cur: out.append(cur)
    return [re.sub(r'\s*mehr\s*\.\.\.?\s*$', '', p).strip() for p in out]

def first_alt(s):
    return re.split(r'\s+/\s+', s)[0].strip()

DROP = re.compile(r'^(Lesen|Hören|Schreiben|Sprachbausteine)\s*Teil|^Text \d\b|^Forum:')
QRE = re.compile(r'^(\d{1,2})\s*\.?\s+(\S.*)$')
ORE = re.compile(r'^([a-cA-C])\)\s*(.*)$')

def questions(ls, nums):
    """parse numbered questions with R/F or a)-c) options"""
    qs = []; cur = None
    for s in ls:
        m = QRE.match(s)
        if m and int(m.group(1)) in nums:
            cur = {'n': int(m.group(1)), 'text': m.group(2), 'type': 'mc', 'opts': []}
            qs.append(cur); continue
        if cur is None: continue
        if re.match(r'^Richtig\s*/\s*[Ff]alsch', s): cur['type'] = 'rf'; continue
        m = ORE.match(s)
        if m: cur['opts'].append(m.group(2)); continue
        if cur['opts']: cur['opts'][-1] += ' ' + s
        else: cur['text'] += ' ' + s
    for q in qs:
        q['text'] = first_alt(q['text'])
        q['opts'] = [first_alt(o).rstrip(',') for o in q['opts']]
        if q['type'] == 'rf': del q['opts']
    return qs

def split_text_q(ls, first):
    for i, s in enumerate(ls):
        m = QRE.match(s)
        if m and int(m.group(1)) == first: return ls[:i], ls[i:]
    raise ValueError('no question %d' % first)
