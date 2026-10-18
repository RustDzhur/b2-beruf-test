from hoeren import *

def T(t): return {'text': t}

H2V6 = [
 {'segs': [
  {'who': 'Frau', 't': 'Habt ihr schon gehört? Nach dem Umbau sollen wir alle zusammen in ein Großraumbüro ziehen.'},
  {'who': 'Herr', 't': 'Ja, ich finde das eigentlich gar nicht schlecht. Dann können wir uns viel schneller austauschen und Ideen direkt miteinander besprechen.'},
  {'who': 'Frau', 't': 'Das stimmt schon. Aber in so einem großen Raum ist es oft ziemlich laut. Wenn ständig jemand telefoniert, kann ich mich kaum konzentrieren.'},
  {'who': 'Herr', 't': 'Dafür gibt es ja kleine Besprechungsräume. Und ich glaube, die Zusammenarbeit im Team wird wirklich besser, wenn wir alle an einem Ort sitzen.'},
  {'who': 'Frau', 't': 'Na gut, wir werden sehen. Vielleicht hast du recht.'}]},
 {'segs': [
  {'who': 'Herr', 't': 'Sag mal, du arbeitest jetzt drei Tage in der Woche von zu Hause aus, oder? Wie klappt das?'},
  {'who': 'Frau', 't': 'Super! Ich bin damit vollkommen zufrieden und möchte das auf keinen Fall mehr aufgeben.'},
  {'who': 'Herr', 't': 'Bei mir ist das genau umgekehrt. Im Homeoffice fällt es mir schwer, Arbeit und Privatleben zu trennen. Ich sitze oft noch abends am Laptop.'},
  {'who': 'Frau', 't': 'Dafür braucht man ein eigenes Arbeitszimmer. Nach Feierabend schließe ich einfach die Tür zu und mache Yoga. Dann ist die Arbeit für mich erledigt.'},
  {'who': 'Herr', 't': 'Das ist eine gute Idee. Vielleicht sollte ich mir auch so eine feste Ecke einrichten.'}]},
 {'segs': [
  {'who': 'Frau', 't': 'Nächsten Monat bekommen wir noch einen neuen Kollegen in unser Büro. Wo soll der denn sitzen? Es ist doch jetzt schon so eng hier.'},
  {'who': 'Herr', 't': 'Das habe ich mich auch gefragt. Der Chef meint, wir sollen den Kopierer in den Flur stellen, dann ist Platz für einen weiteren Schreibtisch.'},
  {'who': 'Frau', 't': 'Dann müssen wir aber jedes Mal auf den Flur laufen, wenn wir etwas ausdrucken wollen. Das ist doch total unpraktisch.'},
  {'who': 'Herr', 't': 'Ja, begeistert bin ich auch nicht. Aber der Neue kommt ja so oder so. Irgendwie müssen wir den Platz eben schaffen.'}]},
 {'segs': [
  {'who': 'Herr', 't': 'Ich habe gelesen, dass immer mehr Firmen ihren Mitarbeitern Plätze in einem Co-Working-Büro anbieten.'},
  {'who': 'Frau', 't': 'Was genau ist das eigentlich?'},
  {'who': 'Herr', 't': 'Das sind Büros, in denen man sich flexibel einen Schreibtisch mietet. Man arbeitet dort neben Leuten aus ganz anderen Firmen.'},
  {'who': 'Frau', 't': 'Und warum machen Unternehmen das?'},
  {'who': 'Herr', 't': 'Weil es oft billiger ist als ein eigenes großes Büro. Außerdem wirkt die Firma dadurch modern und attraktiv, auch für neue Bewerber.'},
  {'who': 'Frau', 't': 'Klingt interessant. Vielleicht wäre das auch etwas für unsere Außenstelle.'}]},
]

def build():
    H1 = [
      hoeren1((4093,4184), 1, list('RcRaFb')),
      hoeren1((4185,4293), 2, list('RbFcFc'), {22: T('Die Kundin lässt sich beraten.'), 24: T('Die Vorbereitung des Fests ist schon abgeschlossen.'),
            25: {'opts': ['wird eine neue Cateringfirma gesucht.', 'wird eine neue Band gefunden.', 'werden die Aufgaben verteilt.']},
            26: T('Die Frau und Herr Klein arbeiten zusammen in einem Lager.'), 27: T('Die Frau')}),
      hoeren1((4294,4399), 3, list('FaFcFa'), {26: T('Ignacio spricht mit Amira über den Dienstplan.'), 27: T('Die Erzieherin Amira Herbst')}),
      hoeren1((4400,4495), 4, list('FcRbFb'), {24: T('Frau Leipold vereinbart telefonisch einen Liefertermin.'), 25: T('Die Firma „Spedition Fix“')}),
      hoeren1((4496,4596), 5, list('FcRcRa'), {26: T('Eine Frau möchte eine neue Kaffeemaschine kaufen.')}),
      hoeren1((4597,4692), 6, list('RaFcRb')),
      hoeren1((4693,4788), 7, list('RbRcFc'), {23: T('Frau Blume'), 26: T('Frau Leutner bestellt telefonisch neue Möbel.')}),
    ]
    H2 = (hoeren2((4789,4871), 1, sets=[1]) + hoeren2((4872,4968), 2) + hoeren2((4969,5040), 3) +
          hoeren2((5041,5116), 4) + hoeren2((5117,5180), 5))
    h6 = hoeren2((5181,5185), 6, synth=H2V6) if False else None
    H2.append({'id': 'H2V6', 'v': 6, 'dialogs': H2V6, 'ans': list('bcae'), 'src': 'recon', 'opts': [
      'Es ist nicht immer einfach, Platz für neue Kolleg*innen zu schaffen.',
      'Im Großraumbüro kann man mit den Kolleg*innen besser zusammenarbeiten.',
      'Manche Mitarbeiter*innen arbeiten gerne regelmäßig von zu Hause aus.',
      'Manchmal tut der räumliche Abstand zu Kolleg*innen gut.',
      'Neue Arbeitsplatzmodelle können für Unternehmen attraktiv sein.',
      'Über die Neugestaltung des Arbeitsplatzes muss nachgedacht werden.']})
    H3 = [
      hoeren3((5207,5255), 1, list('bacc'), [(5256,5269),(5289,5292)]),
      hoeren3((5295,5370), 2, list('acbb')),
      hoeren3((5371,5439), 3, list('bcab')),
      hoeren3((5440,5509), 4, list('cacb')),
      hoeren3((5510,5563), 5, list('ccac'), [(5564,5577),(5587,5591)]),
      hoeren3((5593,5659), 6, list('acaa')),
      hoeren3((5660,5733), 7, list('acab')),
    ]
    H4 = [
      hoeren4((5753,5810), 1, list('bbaca'), 'fmfmf', {38: {'opts': ['bittet um heutige Abholung der Ware.', 'braucht die Lieferung dringend.', 'hat den Eilzuschlag bezahlt.']}}),
      hoeren4((5811,5853), 2, list('abcab'), 'mfmfm', {
        36: {'opts': ['denkt an die Interessen der Vegetarier.', 'möchte wieder zum Griechen gehen.', 'hat schon ein Restaurant reserviert.'], 'recon': True},
        37: {'opts': ['hat schon ein Geschenk gekauft.', 'sucht eine Anregung für ein Geschenk.', 'sammelt von jedem Kollegen 70 €.'], 'recon': True},
        38: {'text': 'Stefan Karner bittet darum,', 'opts': ['die Brandmelder selbst auszutauschen.', 'die nächste Wartung abzusagen.', 'einen Termin zu vereinbaren.'], 'recon': True},
        39: {'opts': ['kümmert sich um die Verpflegung für die Gäste.', 'hat den Raum schon gebucht.', 'plant eine Reise nach Frankreich.'], 'recon': True},
        40: {'opts': ['einen neuen Vertrag abschließen.', 'dass die Heizung repariert wird.', 'die Hausverwaltung wechseln.'], 'recon': True}}),
      hoeren4((5854,5912), 3, list('cccab'), 'mfffm', {36: {'opts': ['trifft die Partner an der Produktionshalle.', 'geht es nicht so gut.', 'muss seine Tochter abholen.']}}),
      hoeren4((5913,5969), 4, list('acaba'), 'fmfmf', {37: T('Konstantinos Pagonis ruft an, um'), 40: T('Clara Günther')}),
      hoeren4((5970,6025), 5, list('aaacb'), 'fmfmf', {36: T('Katia')}),
      hoeren4((6026,6090), 6, list('ccbba'), 'mfmfm'),
    ]
    for m in H4[4]['msgs'][:1]: m['text'] = m['text'].replace('Jana / Katia', 'Katia').replace('Jana/ Katia', 'Katia')
    return {'H1': H1, 'H2': H2, 'H3': H3, 'H4': H4}

if __name__ == '__main__':
    d = build()
    names = set()
    for x in d['H1']:
        for dg in x['dialogs']: names |= {g['who'] for g in dg['segs']}
    for x in d['H2']:
        for dg in x['dialogs']: names |= {g['who'] for g in dg['segs']}
    for x in d['H3']: names |= {g['who'] for g in x['segs']}
    print({k: len(v) for k, v in d.items()})
    print(sorted(map(str, names)))
