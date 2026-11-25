"""Parser for the updated collection "Alle Information" (text saved in t2.txt, one line per PDF line, "\\f<page>" page markers).

Used only to ADD variants that the site does not have yet and to cross-check the answers of the existing ones.
Existing variant ids are never changed (students' progress is stored under them), see extra_build.py.
"""
import os, re

HOMO = str.maketrans({'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'х': 'x', 'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H', 'К': 'K', 'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T', 'Х': 'X'})
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 't2.txt')


def load():
    L = open(SRC, encoding='utf-8').read().split('\n')
    pages, page = [], 0
    for l in L:
        if l.startswith('\f'):
            page = int(l[1:])
        pages.append(page)
    return L, pages


L, PAGE = load()

# a heading line starts a new block of the collection
HEAD = re.compile(r"^(Lesen Teil ?[134]\s*\(|Lesen Teil 2$|Text \d+ ?\(|Lesen und Schreiben|Sprachbausteine|Telefonnotiz \(|Hören (Teil|und)|TEIL \d|Sprechen|Aufgabe|Schreiben (Forumbeitrag|Beschwerde|Redemittel))", re.I)


def blocks(pattern):
    """[(heading, page, lines)] for every heading matching `pattern`; a block ends at the next heading of any kind."""
    idx = [i for i, l in enumerate(L) if HEAD.match(l)]
    out = []
    for k, i in enumerate(idx):
        if re.match(pattern, L[i], re.I):
            j = idx[k + 1] if k + 1 < len(idx) else len(L)
            out.append((L[i], PAGE[i], [x for x in L[i + 1:j] if not x.startswith('\f')]))
    return out


def letter(s):
    return s.strip().translate(HOMO).lower()


def variant_no(heading):
    m = re.search(r"[№#]\s*(\d+)", heading)
    return int(m.group(1)) if m else None


def note_of(heading):
    """what follows the variant number: version / test number hints, without the 100% marks"""
    t = re.sub(r"^.*?[№#]\s*\d+\s*\)?", "", heading)
    t = re.sub(r"[–-]\s*100\s*%", "", t).strip(" ()-–")
    return t


def join(lines):
    """re-join PDF-wrapped lines (hyphenated line ends are glued)"""
    out = ''
    for s in lines:
        if out.endswith('-') and not out.endswith(' -') and s[:1].islower():
            out = out[:-1] + s
        else:
            out = (out + ' ' + s).strip()
    return re.sub(r'\s+', ' ', out)


def lesen1(h, page, ls):
    persons, ads, cur = [], [], None
    for s in ls:
        m = re.match(r"^(\d)\s*[.)]?\s*\.?\s*(.+?)\s+([a-hxA-HXаеесх])\s*(\(.*\))?\s*$", s)
        if m and not ads:
            persons.append({'n': int(m.group(1)), 'text': m.group(2).strip(' .'), 'ans': letter(m.group(3))})
            continue
        m = re.match(r"^([a-h])\)\s*(.*)$", s)
        if m:
            cur = {'l': m.group(1), 'title': m.group(2).strip(), 'lines': []}
            ads.append(cur)
            continue
        if cur:
            cur['lines'].append(s)
    for a in ads:
        a['text'] = join(a.pop('lines'))
    return {'no': variant_no(h), 'note': note_of(h), 'page': page, 'persons': persons, 'ads': ads}


def lesen3(h, page, ls):
    persons, posts, cur = [], [], None
    for s in ls:
        m = re.match(r"^(\d{2})\s*[.)]?\s*(.+?)\s*[-–—]\s*([a-fxA-FXаеесх])\s*(\(.*\))?\s*$", s)
        if m and not posts:
            cur = {'n': int(m.group(1)), 'name': m.group(2).strip(), 'ans': letter(m.group(3)), 'lines': []}
            persons.append(cur)
            continue
        m = re.match(r"^([a-f])\)\s*(.*)$", s)
        if m:
            cur = {'l': m.group(1), 'name': m.group(2).strip(), 'lines': []}
            posts.append(cur)
            continue
        if cur is not None:
            cur['lines'].append(s)
    for x in persons + posts:
        x['text'] = join(x.pop('lines'))
    return {'no': variant_no(h), 'note': note_of(h), 'page': page, 'persons': persons, 'posts': posts}


def all_lesen1():
    return [lesen1(*b) for b in blocks(r"Lesen Teil ?1\s*\(")]


def all_lesen3():
    return [lesen3(*b) for b in blocks(r"Lesen Teil ?3\s*\(")]
