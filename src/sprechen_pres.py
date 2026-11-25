"""Own (unique) model presentations for Sprechen Teil 1, topics 9-16.

The collection's texts (one author's story, marked blue in the PDF) are used by many learners, so they are not copied:
only the structure (intro - body - conclusion) and the exam points follow the PDF; every sentence below is new.
Key = the topic title of the PDF; value = paragraphs (intro, body..., conclusion).
"""
TEXTS = {
    'Arbeitgeber': [
        'Ich möchte heute über meinen früheren Arbeitgeber sprechen, ein mittelständisches Unternehmen aus der Möbelbranche.',
        'Die Firma stellt Büro- und Wohnmöbel her und verkauft sie an Geschäftskunden und Privatpersonen in ganz Deutschland. Neben den Möbeln bietet sie auch Beratung und Montage an.',
        'Das Unternehmen hat mehrere Abteilungen: In der Produktion werden die Möbel gefertigt, der Einkauf besorgt Holz und Beschläge, der Vertrieb betreut die Kunden, und die Buchhaltung kümmert sich um Rechnungen und Zahlungen. Die Aufgaben sind klar verteilt, deshalb läuft der Alltag meist reibungslos.',
        'Besonders war, dass die Firma viel Wert auf Nachhaltigkeit gelegt hat. Das Holz kam aus regionalen Wäldern, und die Verpackungen wurden wiederverwendet. Außerdem gab es regelmäßig Schulungen für alle Mitarbeitenden.',
        'Zusammenfassend kann ich sagen, dass ich dort viel gelernt habe. Die Zeit in diesem Unternehmen hat meine berufliche Entwicklung stark geprägt.',
    ],
    'Arbeitsumfeld': [
        'Ich möchte heute beschreiben, wie für mich ein gutes Arbeitsumfeld aussieht. Dabei spielen mehrere Faktoren eine Rolle.',
        'Am wichtigsten ist mir ein sicherer Arbeitsplatz. Wer weiß, dass sein Vertrag unbefristet ist, kann langfristig planen, zum Beispiel eine Wohnung mieten oder eine Familie gründen. Dazu gehört auch ein faires Gehalt, das pünktlich bezahlt wird und zu den Aufgaben passt.',
        'Ebenso wichtig sind Karrierechancen. In meiner letzten Firma konnte ich nach zwei Jahren die Leitung eines kleinen Teams übernehmen, weil das Unternehmen Weiterbildungen finanziert hat. Das hat mich sehr motiviert.',
        'Schließlich braucht ein gutes Arbeitsumfeld offene Kommunikation. Bei uns gab es jede Woche eine kurze Teambesprechung, in der Probleme direkt angesprochen wurden. So konnten wir Missverständnisse schnell klären und Fehler vermeiden.',
        'Zusammenfassend sind für mich Sicherheit, ein faires Gehalt, Entwicklungsmöglichkeiten und ehrliche Kommunikation die Grundlage für ein gutes Arbeitsumfeld.',
    ],
    'Berufswahl': [
        'Ich möchte heute erzählen, welche Ereignisse und Erfahrungen meine Berufswahl beeinflusst haben.',
        'Nach der Schule war ich unsicher, was ich machen soll. Zuerst habe ich ein Jahr lang in einem Café gejobbt. Dort habe ich gemerkt, dass mir der Kontakt mit Menschen großen Spaß macht und dass ich gut organisieren kann.',
        'Eine wichtige Person war meine Tante, die als Personalleiterin arbeitet. Sie hat mir erklärt, wie vielseitig die Arbeit im Büro sein kann, und mir ein Praktikum in ihrer Firma ermöglicht. Dort habe ich zum ersten Mal Bewerbungen sortiert und Termine koordiniert.',
        'Das Praktikum hat mich so überzeugt, dass ich eine Ausbildung im Bürobereich begonnen habe. Meine Motivation war, einen abwechslungsreichen Beruf mit Verantwortung zu haben. Heute arbeite ich in der Verwaltung eines mittelgroßen Betriebs, bin zufrieden und kann mich weiterentwickeln.',
        'Zusammenfassend haben mein Nebenjob, die Hilfe meiner Tante und das Praktikum meine Berufswahl entscheidend geprägt.',
    ],
    'Vorbild': [
        'Ich möchte heute über eine Person sprechen, die für mich ein berufliches Vorbild ist: meine frühere Abteilungsleiterin.',
        'Ich habe drei Jahre lang direkt mit ihr zusammengearbeitet. Sie war nicht nur meine Chefin, sondern auch eine Art Mentorin, die mir immer mit Rat zur Seite stand.',
        'Besonders beeindruckt hat mich ihre ruhige und strukturierte Art. Auch in stressigen Situationen blieb sie freundlich, hörte allen zu und traf klare Entscheidungen. Außerdem war sie sehr zuverlässig: Was sie versprochen hat, hat sie auch gehalten.',
        'Von ihr habe ich gelernt, Aufgaben zu priorisieren und Kritik sachlich zu äußern. Sie hat mich ermutigt, an Fortbildungen teilzunehmen und mehr Verantwortung zu übernehmen. Ohne ihre Unterstützung hätte ich mir das nicht zugetraut.',
        'Zusammenfassend ist sie für mich ein großes Vorbild, weil sie Fachkompetenz mit Menschlichkeit verbindet. Viele ihrer Methoden wende ich heute in meiner eigenen Arbeit an.',
    ],
    'Arbeitssuche': [
        'Ich möchte heute beschreiben, wie man in Deutschland bei der Arbeitssuche vorgeht.',
        'Zuerst sucht man passende Stellenangebote. Das geht im Internet auf Jobportalen oder auf den Karriereseiten von Unternehmen. Außerdem helfen die Agentur für Arbeit und persönliche Kontakte, denn viele Stellen werden nie öffentlich ausgeschrieben.',
        'Für den Erstkontakt schreibt man meist eine E-Mail an die Personalabteilung oder ruft vorher an, um Fragen zur Stelle zu stellen. Das zeigt Interesse und macht einen guten Eindruck.',
        'Danach schickt man die Bewerbungsunterlagen: ein Anschreiben, einen tabellarischen Lebenslauf, Zeugnisse und Zertifikate. Wichtig ist, dass die Unterlagen vollständig und fehlerfrei sind und zur Stelle passen. Wenn das Unternehmen interessiert ist, lädt es zu einem Vorstellungsgespräch ein.',
        'Zusammenfassend braucht die Arbeitssuche in Deutschland Geduld und gute Vorbereitung, aber mit überzeugenden Unterlagen hat man gute Chancen.',
    ],
    'Bewerbungsgespräch': [
        'Ich möchte heute erklären, worauf es bei einem Bewerbungsgespräch in Deutschland ankommt, zum Beispiel im Bereich Verwaltung.',
        'Zur Vorbereitung informiert man sich gründlich über das Unternehmen, seine Produkte und die ausgeschriebene Stelle. Außerdem überlegt man sich, welche Stärken man hat und wie man sie mit Beispielen belegen kann. Man sollte auch den Weg planen und rechtzeitig, am besten zehn Minuten früher, ankommen.',
        'Bei der Kleidung wählt man einen gepflegten, zur Branche passenden Stil. Im Büro sind das meist ein Hemd oder eine Bluse, dazu eine ordentliche Hose oder ein Rock. Wichtig ist, dass man sich wohlfühlt.',
        'Typische Fragen sind: Erzählen Sie etwas über sich. Warum möchten Sie bei uns arbeiten? Was sind Ihre Stärken und Schwächen? Wo sehen Sie sich in fünf Jahren? Am Ende darf man selbst Fragen stellen, etwa zum Team oder zu Weiterbildungen.',
        'Zusammenfassend gilt: Wer gut vorbereitet, pünktlich und freundlich ist und ehrlich antwortet, hinterlässt einen positiven Eindruck.',
    ],
    'Dienstleistung': [
        'Ich möchte heute eine Dienstleistung vorstellen, die ich gut kenne: einen Lieferservice für frische Lebensmittel.',
        'Die Kunden bestellen online oder per App Obst, Gemüse und Milchprodukte von regionalen Höfen. Die Ware wird in einem festen Zeitfenster direkt an die Haustür geliefert. Typisch für diesen Service sind Frische, Bequemlichkeit und Transparenz über die Herkunft.',
        'Der Nutzen für die Kunden ist groß: Sie sparen Zeit, müssen keine schweren Taschen tragen und können ihren Einkauf flexibel planen. Besonders berufstätige Familien und ältere Menschen profitieren davon.',
        'Es gibt aber auch Nachteile. Die Lieferung kostet oft eine Gebühr, und man muss zu Hause sein, um die Ware anzunehmen. Außerdem ist die Auswahl manchmal kleiner als im Supermarkt. Trotzdem ist der Service sehr erfolgreich: Die Zahl der Kunden wächst jedes Jahr, und viele bestellen regelmäßig.',
        'Zusammenfassend ist der Lieferservice eine praktische Dienstleistung, die trotz kleiner Nachteile vielen Menschen den Alltag erleichtert.',
    ],
    'Geschäftsidee': [
        'Ich möchte heute meine Geschäftsidee vorstellen: Ich würde gern einen mobilen Reparaturservice für Fahrräder gründen.',
        'Mein Angebot ist einfach: Die Kunden rufen an oder buchen online einen Termin, und ich komme mit einem kleinen Transporter zu ihnen nach Hause oder an den Arbeitsplatz. Dort repariere ich Bremsen, Reifen und Ketten und führe auch Wartungen durch.',
        'Das Besondere an meiner Idee ist, dass die Kunden ihr Fahrrad nicht in eine Werkstatt bringen müssen. Außerdem möchte ich faire Festpreise anbieten und alte Teile fachgerecht recyceln.',
        'Meine Zielgruppe sind vor allem Berufstätige, Studierende und Familien in der Stadt, die viel mit dem Rad fahren, aber wenig Zeit haben. Auch Firmen könnten interessiert sein, weil sie ihren Mitarbeitenden einen Fahrradservice anbieten wollen.',
        'Zusammenfassend bin ich überzeugt, dass diese Idee gute Chancen hat, weil sie praktisch ist und einen echten Bedarf deckt.',
    ],
}
