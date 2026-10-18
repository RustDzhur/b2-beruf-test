import re
from core import *

def tr(a, b): return ' '.join(paras(lines(a, b), 9999))

def N(id, typ, who, g, name, phone, info, todo, transcript=None, rng=None, src='file'):
    t = transcript or tr(*rng)
    return {'id': id, 'type': typ, 'who': who, 'g': g, 'name': name, 'phone': phone,
            'info': [{'t': t_, 'kw': kw} for t_, kw in info], 'todo': todo[0], 'todo_kw': todo[1], 'text': t, 'src': src}

def notiz():
    return [
     N('N1', 'Angebot', 'Roman Schmitz', 'm', 'Schmitz', '0173 916 94 42', [
        ('55 € pro Tag, nur ein kleiner Wagen', ['55', 'klein']),
        ('Auto vollgetankt zurückgeben', ['vollgetankt|voll getankt|volltank']),
        ('oder sie tanken kostenpflichtig für uns', ['kostenpflichtig|kosten']),
        ('Versicherung muss mit ihnen geregelt werden', ['versicherung'])],
        ('Zurückrufen und sagen, ob wir das Angebot annehmen', ['zurück|rückruf', 'angebot']), rng=(3768, 3775)),
     N('N2', 'Beschwerde', 'Herr Meier', 'm', 'Meier', '0512 37 285 618', [
        ('Maler sind heute nicht gekommen, Geschäft sollte gestrichen werden', ['maler', 'nicht']),
        ('weiße und blaue Farbe mitbringen', ['weiß', 'blau']),
        ('Wände bis morgen Mittag fertig streichen', ['morgen', 'mittag'])],
        ('Umgehend zurückrufen', ['zurück|rückruf']), rng=(3817, 3823)),
     N('N3', 'Beschwerde', 'Paul Becker', 'm', 'Becker', '0175 933 797 6', [
        ('letzte Woche 200 Prospekthüllen bestellt', ['200']),
        ('im Paket nur 150 Prospekthüllen', ['150']),
        ('fehlende Hüllen unbedingt übermorgen nötig', ['übermorgen']),
        ('spätestens morgen abschicken', ['morgen', 'schick|send|liefer'])],
        ('Zurückrufen', ['zurück|rückruf']), rng=(3861, 3867)),
     N('N4', 'Beschwerde', 'Eno Hofmann', 'm', 'Hofmann', '0173 715 720 3', [
        ('Anfang der Woche 200 Prospekthüllen bestellt', ['200']),
        ('im Paket nur 80 Prospekthüllen', ['80']),
        ('fehlende Hüllen unbedingt morgen nötig', ['morgen']),
        ('sofort losschicken', ['sofort'])],
        ('Zurückrufen', ['zurück|rückruf']), rng=(3881, 3890)),
     N('N5', 'Angebot', 'Herr Kienzle', 'm', 'Kienzle', '0179 335 36 37', [
        ('Visitenkarten: Premium-Papier im Angebot', ['premium']),
        ('100 Stück für 60,99 €', ['100', '60,99|60.99']),
        ('Lieferung in zwei Tagen per Expressversand', ['zwei|2', 'express'])],
        ('Zurückrufen und Papiersorte bestätigen', ['zurück|rückruf', 'papier']), rng=(3903, 3908)),
     N('N6', 'Angebot', 'Herr Walther', 'm', 'Walther', '0173 417 4737', [
        ('Kopierpapier aus Premium-Papier', ['premium|kopierpapier']),
        ('ab 7,89 € für 500 Blatt', ['7,89|7.89', '500']),
        ('Expressversand bis morgen, wenn man bis 15:00 Uhr bestellt', ['express', '15'])],
        ('Zurückrufen und Papiersorte bestätigen', ['zurück|rückruf', 'papier']), rng=(3919, 3925)),
     N('N7', 'Buchung', 'Herr Möller', 'm', 'Möller', '0151 130 686 4', [
        ('Tisch für 2 Personen reservieren', ['2|zwei']),
        ('am Freitag um 12:30 Uhr', ['freitag', '12']),
        ('Gibt es Parkplätze für Gäste?', ['park']),
        ('Menü Nr. 4 vorbereiten', ['4|vier'])],
        ('Zurückrufen, Reservierung und Parkplatz bestätigen', ['zurück|rückruf', 'bestätig']),
        transcript='Guten Tag, hier spricht Herr Möller, buchstabiert M-Ö-L-L-E-R. Ich möchte für kommenden Freitag um 12:30 Uhr einen Tisch für zwei Personen reservieren. Es geht um ein Geschäftsessen mit einem wichtigen Kunden. Bitte bereiten Sie für uns das Menü Nummer 4 vor. Außerdem würde ich gerne wissen, ob Sie Parkplätze für Gäste haben. Bitte rufen Sie mich zurück und bestätigen Sie mir die Reservierung und den Parkplatz. Meine Telefonnummer ist 0151 130 686 4. Vielen Dank und auf Wiederhören.', src='recon'),
     N('N8', 'Beschwerde', 'Stefan Wolff', 'm', 'Wolff', '0162 744 642 8', [
        ('Getränke für eine Veranstaltung mit über 200 Personen für heute bestellt', ['200']),
        ('Lieferung um 11 Uhr noch nicht da', ['11']),
        ('warten auf 50 Kästen Wasser und 15 gemischte Saftkisten', ['50', '15']),
        ('Ware muss bis spätestens 14:30 Uhr da sein', ['14']),
        ('sonst bestellt er bei einem anderen Getränkemarkt', ['ander'])],
        ('So schnell wie möglich liefern oder bis 12 Uhr Bescheid sagen', ['12']), rng=(3992, 3998)),
     N('N9', 'Angebot', 'Anna Schulze', 'f', 'Schulze', '0160 335 101 8', [
        ('Kopierer: großes Problem mit der Elektronik', ['elektronik']),
        ('Reparatur nur in der Werkstatt möglich', ['werkstatt']),
        ('Austausch dauert ca. 4 Wochen (Lieferprobleme)', ['4|vier', 'austausch|neu']),
        ('Reparatur: Ersatzteil nötig, ca. 2 Werktage', ['2|zwei', 'ersatzteil|reparatur']),
        ('zurzeit kein Leihgerät', ['leih|kein gerät'])],
        ('Bis morgen zurückrufen: Reparatur oder Austausch?', ['zurück|rückruf']), rng=(4011, 4020)),
     N('N10', 'Angebot', 'Frau Scholtz', 'f', 'Scholtz', '0174 025 4831', [
        ('Kopierer: großes Problem mit der Elektronik', ['elektronik']),
        ('kann nur in der Werkstatt behoben werden', ['werkstatt']),
        ('Austausch dauert 3 Wochen wegen Lieferschwierigkeiten', ['3|drei', 'austausch|neu']),
        ('Reparatur: Ersatzteile bestellen, dauert 5 Tage', ['5|fünf']),
        ('momentan keine Leihgeräte', ['leih|kein gerät|keine gerät'])],
        ('Zurückrufen und entscheiden: Reparatur oder Austausch', ['zurück|rückruf']),
        transcript='Guten Tag, hier spricht Frau Scholtz von der Firma Bürotechnik Nord. Ich habe mir Ihren defekten Kopierer angesehen. Es gibt ein größeres Problem mit der Elektronik, das man nur in unserer Werkstatt beheben kann. Vor Ort konnte ich das Gerät leider nicht reparieren. Ein Austausch gegen ein neues Gerät würde ungefähr drei Wochen dauern, weil wir im Moment Lieferschwierigkeiten haben. Wenn Sie sich für eine Reparatur entscheiden, müssen wir Ersatzteile bestellen. Das dauert etwa fünf Tage. Leider können wir Ihnen zurzeit kein Leihgerät zur Verfügung stellen. Bitte rufen Sie mich zurück und sagen Sie mir, ob Sie eine Reparatur oder einen Austausch möchten. Mein Name ist Scholtz, S-C-H-O-L-T-Z. Meine Nummer ist 0174 025 4831. Vielen Dank.', src='recon'),
     N('N11', 'Beschwerde', 'Herr Günther', 'm', 'Günther', '0176 482 913 5', [
        ('30 Kisten Weißwein bestellt, aber nur 20 erhalten', ['30', '20']),
        ('50 Flaschen Rotwein statt 30 geliefert', ['50', 'rot']),
        ('2 Flaschen sind zerbrochen', ['2|zwei', 'zerbroch|kaputt|beschädig']),
        ('fehlenden Weißwein bis morgen nachliefern', ['morgen']),
        ('neue Rechnung erstellen', ['rechnung'])],
        ('Zurückrufen und eine neue Rechnung schicken', ['zurück|rückruf']),
        transcript='Guten Tag, hier spricht Herr Günther vom Restaurant Lindenhof, buchstabiert G-Ü-N-T-H-E-R. Ich rufe wegen Ihrer Weinlieferung von heute Morgen an. Wir hatten 30 Kisten Weißwein bestellt, bekommen haben wir aber nur 20. Außerdem haben Sie uns 50 Flaschen Rotwein geliefert, bestellt waren aber nur 30. Und zwei Flaschen sind beim Transport zerbrochen. Bitte liefern Sie den fehlenden Weißwein bis morgen nach und erstellen Sie uns eine neue Rechnung. Rufen Sie mich bitte zurück unter 0176 482 913 5. Danke und auf Wiederhören.', src='recon'),
     N('N12', 'Beschwerde', 'Frau Schweizer', 'f', 'Schweizer', '0157 384 220 6', [
        ('ein Karton mit Tellern kam zerbrochen an', ['karton|teller']),
        ('7 Teller sind zerbrochen', ['7|sieben']),
        ('nächste Woche Familienfeier mit über 20 Personen', ['20']),
        ('Ersatz so schnell wie möglich', ['ersatz|nachliefer'])],
        ('Zurückrufen, schnelle Nachlieferung', ['zurück|rückruf']),
        transcript='Guten Tag, hier ist Frau Schweizer, buchstabiert S-C-H-W-E-I-Z-E-R. Ich wollte mich für die Lieferung der Geschirrsets bedanken. Leider ist bei der Lieferung ein Karton mit Tellern zerbrochen angekommen. Es sind sieben Teller kaputt. Da wir nächste Woche eine große Familienfeier mit über 20 Personen haben, wäre es wichtig, so schnell wie möglich Ersatz zu bekommen. Bitte rufen Sie mich unter der Nummer 0157 384 220 6 zurück. Vielen Dank.', src='recon'),
    ]

def forum():
    ls = lines(3439, 3626); out = []; cur = None
    for s in ls:
        m = re.match(r'^(\d{1,2})\.\s*(.+)$', s)
        if m and int(m.group(1)) == len(out) + 1:
            t = m.group(2).strip()
            title, _, rest = t.partition(':')
            cur = {'n': int(m.group(1)), 'title': title.strip(' .'), 'desc': rest.strip()}; out.append(cur); continue
        if cur: cur['desc'] = (cur['desc'] + ' ' + s).strip()
    extra = [
      ('Homeoffice mit privatem Laptop', 'Alle Mitarbeitenden in Ihrer Firma dürfen künftig zwei Tage pro Woche im Homeoffice arbeiten. Dafür müssen sie aber ihren privaten Laptop benutzen.'),
      ('Betriebsausflug am Samstag', 'Der diesjährige Betriebsausflug findet an einem Samstag statt. Wer teilnimmt, bekommt dafür einen anderen Tag frei.'),
      ('Urlaubssperre im Sommer', 'In Ihrer Firma gilt im August und September eine Urlaubssperre. Wer in dieser Zeit keinen Urlaub nimmt, erhält eine Prämie von 500 Euro.'),
      ('Kamerapflicht bei Online-Konferenzen', 'Bei allen Online-Konferenzen sollen die Mitarbeitenden ab sofort ihre Kamera einschalten. Das ist Pflicht.'),
    ]
    for t, d in extra: out.append({'n': len(out) + 1, 'title': t, 'desc': d, 'new': True})
    for x in out:
        x['desc'] = re.sub(r'\s+', ' ', x['desc']).strip()
    return out

def sprechen():
    ls = lines(7210, 7360); out = []; cur = None
    for s in ls:
        m = re.match(r'^(\d{1,2})\.\s*Situation:\s*(.*)$', s)
        if m: cur = {'n': int(m.group(1)), 'text': m.group(2), 'points': [], 'inpts': False}; out.append(cur); continue
        if cur is None: continue
        if s.startswith('Diese Stichpunkte'): cur['inpts'] = True; continue
        if s.startswith('•'): cur['points'].append(s.lstrip('• ').strip()); continue
        if s.startswith('-'): break
        if not cur['inpts']: cur['text'] += ' ' + s
    for x in out: del x['inpts']; x['points'] = [p.replace('Wa stun', 'Was tun') for p in x['points']]
    return out

if __name__ == '__main__':
    import json
    f = forum(); print(len(f)); print(f[0], f[-5], f[12], sep='\n')
    s = sprechen(); print(len(s), s[12])
    n = notiz(); print(len(n)); print(n[3]['text'])
