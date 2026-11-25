"""Translations of the Redemittel (DB.RM, see extra_build.py) shown on the learning page.

HEAD: Russian header -> (en, fr, tr, ar, it); the German interface language gets the German group name itself.
ITEMS: Russian phrase -> (en, fr, tr, ar, it); the German interface language gets the German phrase itself.
python3 src/i18n_rm.py appends the missing rows to i18n_meta.json / i18n_src.txt / i18n_fr.txt / i18n_trk.txt / i18n_ar.txt / i18n_it.txt
(a newline inside a text is written as the two characters \\n, build_i18n.py turns it back)."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))

HEAD = {
    'Приветствие': ('Greeting', 'Salutation', 'Hitap', 'التحية', 'Saluto'),
    'Введение': ('Introduction', 'Introduction', 'Giriş', 'المقدمة', 'Introduzione'),
    'Собственное мнение': ('Own opinion', 'Opinion personnelle', 'Kendi görüşünüz', 'الرأي الشخصي', 'Opinione personale'),
    'Аргумент 1 (преимущество)': ('Argument 1 (advantage)', 'Argument 1 (avantage)', 'Argüman 1 (avantaj)', 'الحجة 1 (ميزة)', 'Argomento 1 (vantaggio)'),
    'Аргумент 2 (недостаток)': ('Argument 2 (disadvantage)', 'Argument 2 (inconvénient)', 'Argüman 2 (dezavantaj)', 'الحجة 2 (عيب)', 'Argomento 2 (svantaggio)'),
    'Предложение / компромисс': ('Proposal / compromise', 'Proposition / compromis', 'Öneri / uzlaşma', 'اقتراح / حل وسط', 'Proposta / compromesso'),
    'Заключение': ('Conclusion', 'Conclusion', 'Sonuç', 'الخاتمة', 'Conclusione'),
    'Вежливое завершение письма': ('Polite closing of the letter', 'Formule de politesse finale', 'Mektubun nazik kapanışı', 'الخاتمة المهذبة للرسالة', 'Chiusura cortese della lettera'),
    'Обращение': ('Salutation', "Formule d'appel", 'Hitap', 'المخاطبة', 'Formula di apertura'),
    'Благодарность и указание темы': ('Thanks and reference to the topic', 'Remerciements et rappel du sujet', 'Teşekkür ve konuya atıf', 'الشكر والإشارة إلى الموضوع', "Ringraziamento e riferimento all'argomento"),
    'Извинения': ('Apology', 'Excuses', 'Özür', 'الاعتذار', 'Scuse'),
    'Объяснение причины': ('Explanation of the cause', 'Explication de la cause', 'Nedenin açıklanması', 'شرح السبب', 'Spiegazione della causa'),
    'Понимание важности решения': ('Showing understanding', 'Montrer sa compréhension', 'Anlayış gösterme', 'إظهار التفهّم', 'Mostrare comprensione'),
    'Решение': ('Solution', 'Solution', 'Çözüm', 'الحل', 'Soluzione'),
    'Компенсация (только если скидка упомянута в письме руководителя)': (
        "Goodwill gesture (only if a discount is mentioned in the manager's letter)",
        'Geste commercial (uniquement si une remise est mentionnée dans la lettre du supérieur)',
        'İyi niyet jesti (yalnızca yönetici mektubunda indirim geçiyorsa)',
        'لفتة تعويضية (فقط إذا ذُكر خصم في رسالة المدير)',
        'Gesto di cortesia (solo se nella lettera del superiore è citato uno sconto)'),
    'Благодарность и сохранение сотрудничества': ('Thanks and continued cooperation', 'Remerciements et poursuite de la collaboration', 'Teşekkür ve işbirliğinin sürmesi', 'الشكر واستمرار التعاون', 'Ringraziamento e proseguimento della collaborazione'),
    'Готовность к обратной связи': ('Willingness to answer questions', 'Disponibilité pour les questions', 'Sorulara hazır olma', 'الاستعداد للإجابة عن الأسئلة', 'Disponibilità per eventuali domande'),
}

# the label above the lists: (en, de, fr, tr, ar, it)
LABEL = ('Redemittel · немецкий + перевод', ('Redemittel · German + translation', 'Redemittel · Deutsch + Übersetzung', 'Redemittel · allemand + traduction', 'Redemittel · Almanca + çeviri', 'Redemittel · الألمانية + الترجمة', 'Redemittel · tedesco + traduzione'))

ITEMS = {
    'Привет всем,': ('Hi everyone,', 'Salut à tous,', 'Herkese merhaba,', 'مرحباً بالجميع،', 'Ciao a tutti,'),
    'Привет, народ,': ('Hi folks,', 'Salut, les amis,', 'Selam millet,', 'أهلاً يا جماعة،', 'Ciao ragazzi,'),
    'Дорогие коллеги,': ('Dear colleagues,', 'Chers collègues,', 'Sevgili meslektaşlarım,', 'زملائي الأعزاء،', 'Cari colleghi,'),
    'Уважаемые дамы и господа,': ('Ladies and gentlemen,', 'Mesdames et Messieurs,', 'Sayın hanımlar ve beyler,', 'السيدات والسادة المحترمين،', 'Gentili signore e signori,'),
    'Я слышал(а) / читал(а), что […]. По этому поводу хочу высказать своё мнение.': (
        'I have heard / read that […]. I would like to share my opinion on this.', "J'ai entendu dire / lu que […]. Je voudrais donner mon avis à ce sujet.",
        '[…] olduğunu duydum / okudum. Bu konuda görüşümü belirtmek istiyorum.', 'سمعتُ / قرأتُ أن […]. أودّ أن أعبّر عن رأيي في هذا الشأن.', 'Ho sentito / letto che […]. Vorrei esprimere la mia opinione al riguardo.'),
    'До меня дошли сведения, что […]. Я тоже хочу написать об этом.': (
        'It has come to my attention that […]. I would also like to write something about it.', "Il m'est revenu que […]. Je voudrais moi aussi écrire quelque chose à ce sujet.",
        '[…] haberi kulağıma geldi. Ben de bu konuda bir şeyler yazmak istiyorum.', 'وصلني أن […]. وأودّ أنا أيضاً أن أكتب شيئاً عن ذلك.', "Mi è giunta voce che […]. Anch'io vorrei scrivere qualcosa in merito."),
    'Я недавно узнал(а), что […]. Я нахожу это предложение (не очень) хорошим.': (
        'I recently learned that […]. I find this proposal (not) good.', "J'ai appris récemment que […]. Je trouve cette proposition (pas) bonne.",
        'Kısa süre önce […] olduğunu öğrendim. Bu öneriyi iyi buluyorum / bulmuyorum.', 'علمتُ مؤخراً أن […]. أرى أن هذا الاقتراح جيد (غير جيد).', 'Ho saputo di recente che […]. Trovo questa proposta (non) buona.'),
    'Я тоже хочу сегодня написать кое-что на нашем форуме по теме […].': (
        'I would also like to write something in our forum today on the topic […].', 'Je voudrais moi aussi écrire aujourd’hui quelques mots sur notre forum au sujet de […].',
        'Ben de bugün forumumuzda […] konusunda bir şeyler yazmak istiyorum.', 'أودّ أنا أيضاً أن أكتب اليوم شيئاً في منتدانا حول موضوع […].', 'Anch’io oggi vorrei scrivere qualcosa nel nostro forum sul tema […].'),
    'До меня дошла информация о том, что наша компания планирует […].': (
        'The information has reached me that our company is planning […].', "L’information m’est parvenue que notre entreprise prévoit […].",
        'Şirketimizin […] planladığı bilgisi bana ulaştı.', 'وصلتني معلومة بأن شركتنا تخطط […].', 'Mi è arrivata la notizia che la nostra azienda sta pianificando […].'),
    'Вы уже слышали? Наша компания планирует […].': (
        'Have you heard? Our company is planning […].', 'Vous avez entendu ? Notre entreprise prévoit […].',
        'Duydunuz mu? Şirketimiz […] planlıyor.', 'هل سمعتم؟ شركتنا تخطط […].', 'Avete sentito? La nostra azienda sta pianificando […].'),
    'Я узнал(а), что наша компания планирует […]. Я хотел бы прокомментировать это.': (
        'I have learned that our company is planning […]. I would like to comment on this.', "J’ai appris que notre entreprise prévoit […]. Je voudrais commenter cela.",
        'Şirketimizin […] planladığını öğrendim. Bu konuda görüş bildirmek istiyorum.', 'علمتُ أن شركتنا تخطط […]. وأودّ التعليق على ذلك.', 'Ho saputo che la nostra azienda sta pianificando […]. Vorrei commentare la cosa.'),
    'Как вам всем известно, наше руководство планирует […]. Честно говоря, я удивлён(а).': (
        'As we all know, our management wants […]. Frankly, I am surprised.', 'Comme nous le savons tous, notre direction souhaite […]. Franchement, cela me surprend.',
        'Hepimizin bildiği gibi yönetimimiz […] istiyor. Açıkçası şaşırdım.', 'كما نعلم جميعاً، تريد إدارتنا […]. بصراحة، أنا متفاجئ.', 'Come tutti sappiamo, la direzione vuole […]. Francamente, sono sorpreso/a.'),
    'Я [за / против], потому что…': ('I am [for / against] it because…', 'Je suis [pour / contre] parce que…', 'Ben [lehinde / aleyhinde]yim, çünkü…', 'أنا [مع / ضد] لأنّ…', 'Sono [a favore / contrario/a] perché…'),
    'Лично я считаю, что […].': ('Personally, I think that […].', 'Personnellement, je pense que […].', 'Kişisel olarak […] diye düşünüyorum.', 'أنا شخصياً أرى أن […].', 'Personalmente penso che […].'),
    'По моему мнению, […].': ('In my opinion, […].', 'À mon avis, […].', 'Bence […].', 'في رأيي، […].', 'Secondo me, […].'),
    'Я нахожу это предложение хорошим, [потому что / так как]…': (
        'I think the proposal is good, [because / since]…', 'Je trouve la proposition bonne, [parce que / car]…', 'Öneriyi iyi buluyorum, [çünkü]…', 'أرى الاقتراح جيداً، [لأنّ / بما أنّ]…', 'Trovo buona la proposta, [perché / poiché]…'),
    'Что касается меня, я за / против, потому что…': (
        'As for me, I am for / against it because…', 'En ce qui me concerne, je suis pour / contre parce que…', 'Bana gelince, lehinde / aleyhindeyim, çünkü…', 'أما أنا فأنا مع / ضد لأنّ…', 'Per quanto mi riguarda, sono a favore / contrario/a perché…'),
    'В целом я поддерживаю это предложение, потому что…': (
        'Generally, I support the proposal because…', 'Dans l’ensemble, je soutiens la proposition parce que…', 'Genel olarak öneriyi destekliyorum, çünkü…', 'بشكل عام أؤيّد الاقتراح لأنّ…', 'In linea di massima appoggio la proposta perché…'),
    'Я (не) согласен(а) с этим предложением, потому что…': (
        'I (do not) agree with the proposal because…', 'Je (ne) suis (pas) d’accord avec la proposition parce que…', 'Öneriye katılıyorum / katılmıyorum, çünkü…', 'أنا (غير) موافق على الاقتراح لأنّ…', '(Non) sono d’accordo con la proposta perché…'),
    'У меня двоякое мнение: с одной стороны… с другой стороны…': (
        'I have mixed feelings: on the one hand… on the other hand…', 'Mon avis est partagé : d’une part… d’autre part…', 'Kararsızım: bir yandan… diğer yandan…', 'رأيي منقسم: من جهة… ومن جهة أخرى…', 'Sono di due opinioni: da un lato… dall’altro…'),
    'Что касается этого предложения, я считаю, что…': (
        'Regarding this proposal, I am of the opinion that…', 'En ce qui concerne cette proposition, je pense que…', 'Bu öneri konusunda şu görüşteyim:…', 'بخصوص هذا الاقتراح، أرى أن…', 'Riguardo a questa proposta, sono dell’opinione che…'),
    'Что касается меня, мне трудно занять чёткую позицию, так как у меня двоякое мнение.': (
        'As for me, it is hard to take a clear position because I have mixed feelings.', 'Pour ma part, il m’est difficile de prendre une position claire, car mon avis est partagé.',
        'Bana gelince, net bir tavır almak zor, çünkü kararsızım.', 'أما أنا فيصعب عليّ اتخاذ موقف واضح لأن رأيي منقسم.', 'Per quanto mi riguarda, mi è difficile prendere una posizione chiara perché ho opinioni contrastanti.'),
    'С одной стороны, у этой идеи есть преимущества.': ('On the one hand, this idea has some advantages.', 'D’une part, cette idée présente plusieurs avantages.', 'Bir yandan, bu fikrin bazı avantajları var.', 'من جهة، لهذه الفكرة بعض المزايا.', 'Da un lato, questa idea ha alcuni vantaggi.'),
    'Например, […].': ('For example, […].', 'Par exemple, […].', 'Örneğin, […].', 'على سبيل المثال، […].', 'Ad esempio, […].'),
    'Ещё одно преимущество состоит в том, что […].': ('Another advantage is that […].', 'Un autre avantage est que […].', 'Bir diğer avantajı, […].', 'ميزة أخرى هي أن […].', 'Un altro vantaggio è che […].'),
    'Кроме того, это может быть удобно или полезно для многих.': (
        'In addition, it could be convenient or useful for many people.', 'De plus, cela pourrait être pratique ou utile pour beaucoup de gens.', 'Ayrıca birçok kişi için pratik veya faydalı olabilir.', 'بالإضافة إلى ذلك قد يكون ذلك عملياً أو مفيداً لكثيرين.', 'Inoltre potrebbe essere comodo o utile per molte persone.'),
    'Лично я сталкивался(ась) с тем, что…': ('I have personally experienced that…', 'J’ai moi-même constaté que…', 'Şahsen şunu yaşadım:…', 'لقد اختبرتُ شخصياً أن…', 'Personalmente ho vissuto che…'),
    'На моей прежней работе было так, что…': ('In my previous job it was the case that…', 'Dans mon ancien emploi, c’était ainsi que…', 'Önceki işimde şöyleydi:…', 'في عملي السابق كان الأمر على النحو التالي:…', 'Nella mia precedente azienda succedeva che…'),
    'С другой стороны, есть и недостатки.': ('On the other hand, there are also disadvantages.', 'D’autre part, il y a aussi des inconvénients.', 'Öte yandan dezavantajları da var.', 'ومن جهة أخرى، هناك أيضاً عيوب.', 'D’altra parte ci sono anche degli svantaggi.'),
    'Многие считают, что […].': ('Many people think that […].', 'Beaucoup de gens pensent que […].', 'Birçok kişi […] düşünüyor.', 'يرى كثيرون أن […].', 'Molte persone pensano che […].'),
    'Особенно проблематично то, что […].': ('It is particularly problematic that […].', 'Il est particulièrement problématique que […].', 'Özellikle sorunlu olan, […].', 'المشكلة الكبرى هي أن […].', 'È particolarmente problematico che […].'),
    'Это может привести к […].': ('This could lead to […].', 'Cela pourrait conduire à […].', 'Bu, […] sonucuna yol açabilir.', 'قد يؤدي ذلك إلى […].', 'Questo potrebbe portare a […].'),
    'С другой стороны, я знаю по опыту, что…': ('On the other hand, I know from experience that…', 'D’autre part, je sais par expérience que…', 'Öte yandan, deneyimlerimden biliyorum ki…', 'ومن جهة أخرى، أعرف من تجربتي أن…', 'D’altra parte, so per esperienza che…'),
    'Из личного опыта я знаю, что…': ('From my own experience I know that…', 'Par ma propre expérience, je sais que…', 'Kendi deneyimimden biliyorum ki…', 'من خلال تجربتي الشخصية أعرف أن…', 'Per esperienza personale so che…'),
    'Поэтому я предлагаю, чтобы…': ('That is why I suggest that…', 'C’est pourquoi je propose que…', 'Bu yüzden şunu öneriyorum:…', 'لذلك أقترح أن…', 'Perciò propongo che…'),
    'Я предлагаю вместе найти решение, справедливое для всех.': (
        'I suggest that we find a solution together that is fair to everyone.', 'Je propose que nous trouvions ensemble une solution équitable pour tous.', 'Birlikte herkes için adil bir çözüm bulmayı öneriyorum.', 'أقترح أن نجد معاً حلاً عادلاً للجميع.', 'Propongo di trovare insieme una soluzione equa per tutti.'),
    'Было бы разумно сначала узнать мнение всех сотрудников.': (
        'It would be sensible to ask all employees for their opinion first.', 'Il serait judicieux de demander d’abord l’avis de tous les employés.', 'Önce tüm çalışanların görüşünü almak mantıklı olur.', 'من المعقول أن نستطلع رأي جميع الموظفين أولاً.', 'Sarebbe sensato chiedere prima il parere di tutti i dipendenti.'),
    'Можно ввести пробный период и потом решить вместе.': (
        'A trial period could be introduced and then we could decide together.', 'On pourrait introduire une période d’essai, puis décider ensemble.', 'Bir deneme süreci başlatılıp ardından birlikte karar verilebilir.', 'يمكن تطبيق فترة تجريبية ثم نقرّر معاً.', 'Si potrebbe introdurre un periodo di prova e poi decidere insieme.'),
    'Важно, чтобы все сотрудники могли сами принимать решение.': (
        'It is important that all employees can decide for themselves.', 'Il est important que tous les employés puissent décider eux-mêmes.', 'Tüm çalışanların kendi kararlarını verebilmesi önemlidir.', 'من المهم أن يتمكن جميع الموظفين من اتخاذ القرار بأنفسهم.', 'È importante che tutti i dipendenti possano decidere da soli.'),
    'Важно, чтобы все заинтересованные стороны были включены в решение.': (
        'It is important that everyone involved is included in the decision.', 'Il est important que toutes les parties concernées soient associées à la décision.', 'İlgili tüm tarafların karara dahil edilmesi önemlidir.', 'من المهم إشراك جميع الأطراف المعنية في القرار.', 'È importante che tutte le parti coinvolte partecipino alla decisione.'),
    'Хорошим решением было бы, если бы предложили […].': ('A good solution would be to offer […].', 'Une bonne solution serait de proposer […].', 'İyi bir çözüm, […] sunmak olurdu.', 'سيكون الحل الجيد أن يُقدَّم […].', 'Una buona soluzione sarebbe offrire […].'),
    'Важно учитывать интересы всех участников.': (
        'It is important to take the interests of all participants into account.', 'Il est important de tenir compte des intérêts de tous les participants.', 'Tüm katılımcıların çıkarlarını göz önünde bulundurmak önemlidir.', 'من المهم مراعاة مصالح جميع المشاركين.', 'È importante tenere conto degli interessi di tutti i partecipanti.'),
    'Было бы лучше, если бы участие оставалось добровольным.': ('It would be best if participation remained voluntary.', 'Le mieux serait que la participation reste facultative.', 'Katılımın gönüllü kalması en iyisi olurdu.', 'الأفضل أن تبقى المشاركة طوعية.', 'Sarebbe meglio se la partecipazione restasse volontaria.'),
    'Что вы об этом думаете?': ('What do you think about it?', 'Qu’en pensez-vous ?', 'Bu konuda ne düşünüyorsunuz?', 'ما رأيكم في ذلك؟', 'Che ne pensate?'),
    'Как вы к этому относитесь?': ('How do you feel about it?', 'Que pensez-vous de cela ?', 'Buna nasıl bakıyorsunuz?', 'ما موقفكم من ذلك؟', 'Come la vedete?'),
    'Как вы оцениваете эту идею?': ('How do you rate this idea?', 'Comment trouvez-vous cette idée ?', 'Bu fikri nasıl buluyorsunuz?', 'كيف تقيّمون هذه الفكرة؟', 'Come valutate questa idea?'),
    'В целом, таково моё мнение по этой теме.': ('All in all, that is how I see this topic.', 'Dans l’ensemble, voilà ce que je pense de ce sujet.', 'Genel olarak bu konudaki görüşüm bu.', 'عموماً، هذا هو موقفي من هذا الموضوع.', 'Nel complesso, questa è la mia posizione su questo tema.'),
    'Вы со мной согласны?': ('Do you agree with me?', 'Êtes-vous d’accord avec moi ?', 'Bana katılıyor musunuz?', 'هل توافقونني الرأي؟', 'Siete d’accordo con me?'),
    'Мне интересно, что вы об этом думаете.': ('I am curious what you think about it.', 'Je suis curieux de savoir ce que vous en pensez.', 'Bu konuda ne düşündüğünüzü merak ediyorum.', 'يهمّني أن أعرف رأيكم في ذلك.', 'Sono curioso/a di sapere che cosa ne pensate.'),
    'Я с интересом жду ваших комментариев к этой дискуссии на форуме.': (
        'I look forward to reading your contributions to this forum discussion.', 'J’ai hâte de lire vos contributions à cette discussion du forum.', 'Bu forum tartışmasına yapacağınız katkıları okumak için sabırsızlanıyorum.', 'أتطلع إلى قراءة مساهماتكم في هذا النقاش على المنتدى.', 'Non vedo l’ora di leggere i vostri contributi a questa discussione del forum.'),
    'Что вы скажете по этому поводу? Я буду рад(а) вашему мнению.': (
        'What do you say to that? I look forward to your opinion.', 'Qu’en dites-vous ? J’attends votre avis avec plaisir.', 'Buna ne dersiniz? Görüşünüzü bekliyorum.', 'ما رأيكم في ذلك؟ يسعدني سماع رأيكم.', 'Che ne dite? Attendo con piacere la vostra opinione.'),
    'Мне интересно прочитать ваши мнения по этой теме!': ('I am eager to read your opinions on this topic!', 'Je suis impatient de lire vos avis sur ce sujet !', 'Bu konudaki görüşlerinizi okumak için sabırsızlanıyorum!', 'أتطلع إلى قراءة آرائكم حول هذا الموضوع!', 'Sono curioso/a di leggere le vostre opinioni su questo tema!'),
    'Я буду рад(а) прочитать ваши мнения по этому поводу.': ('I would be glad to read your opinions on this.', 'Je serai ravi de lire vos avis à ce sujet.', 'Bu konudaki görüşlerinizi okumaktan memnun olurum.', 'سأكون سعيداً بقراءة آرائكم في هذا الشأن.', 'Leggerò volentieri le vostre opinioni in merito.'),
    'Я буду рад(а) вашей обратной связи!': ('I would appreciate your feedback!', 'Vos retours me feraient plaisir !', 'Geri bildiriminizi bekliyorum!', 'يسعدني تلقي ملاحظاتكم!', 'Mi farebbero piacere i vostri riscontri!'),
    'С наилучшими пожеланиями,': ('Best wishes,', 'Meilleurs vœux,', 'En iyi dileklerimle,', 'مع أطيب التمنيات،', 'I migliori auguri,'),
    'Всего хорошего,': ('All the best,', 'Bonne continuation,', 'Her şey gönlünüzce olsun,', 'كل التوفيق،', 'Tutto il meglio,'),
    'С уважением,': ('Kind regards,', 'Cordialement,', 'Saygılarımla,', 'مع خالص الاحترام،', 'Distinti saluti,'),
    'Уважаемая г-жа [Фамилия], / Уважаемый г-н [Фамилия],': (
        'Dear Ms [surname], / Dear Mr [surname],', 'Madame [nom], / Monsieur [nom],', 'Sayın [Soyadı] Hanım, / Sayın [Soyadı] Bey,', 'السيدة [اللقب] المحترمة، / السيد [اللقب] المحترم،', 'Gentile signora [cognome], / Gentile signor [cognome],'),
    'Благодарим вас за сообщение, в котором вы информируете нас о проблемах с нашим сервисом.': (
        'Thank you for your message informing us of problems with our service.', 'Nous vous remercions de votre message dans lequel vous nous informez de problèmes avec notre service.',
        'Hizmetimizle ilgili sorunları bildirdiğiniz mesajınız için teşekkür ederiz.', 'نشكركم على رسالتكم التي أبلغتمونا فيها بمشاكل مع خدماتنا.', 'La ringraziamo per il suo messaggio con cui ci segnala dei problemi con il nostro servizio.'),
    'Благодарим вас за сообщение, в котором вы информируете нас о проблемах с устройством.': (
        'Thank you for your message informing us of problems with the device.', 'Nous vous remercions de votre message dans lequel vous nous informez de problèmes avec l’appareil.',
        'Cihazla ilgili sorunları bildirdiğiniz mesajınız için teşekkür ederiz.', 'نشكركم على رسالتكم التي أبلغتمونا فيها بمشاكل مع الجهاز.', 'La ringraziamo per il suo messaggio con cui ci segnala dei problemi con l’apparecchio.'),
    'Благодарим вас за сообщение, в котором вы информируете нас о проблемах со счётом.': (
        'Thank you for your message informing us of problems with the invoice.', 'Nous vous remercions de votre message dans lequel vous nous informez de problèmes avec la facture.',
        'Faturayla ilgili sorunları bildirdiğiniz mesajınız için teşekkür ederiz.', 'نشكركم على رسالتكم التي أبلغتمونا فيها بمشاكل في الفاتورة.', 'La ringraziamo per il suo messaggio con cui ci segnala dei problemi con la fattura.'),
    'Благодарим вас за сообщение, в котором вы информируете нас о проблемах с доставкой.': (
        'Thank you for your message informing us of problems with the delivery.', 'Nous vous remercions de votre message dans lequel vous nous informez de problèmes avec la livraison.',
        'Teslimatla ilgili sorunları bildirdiğiniz mesajınız için teşekkür ederiz.', 'نشكركم على رسالتكم التي أبلغتمونا فيها بمشاكل في التسليم.', 'La ringraziamo per il suo messaggio con cui ci segnala dei problemi con la consegna.'),
    'Благодарим вас за сообщение, в котором вы информируете нас о проблемах с заказом.': (
        'Thank you for your message informing us of problems with the order.', 'Nous vous remercions de votre message dans lequel vous nous informez de problèmes avec la commande.',
        'Siparişle ilgili sorunları bildirdiğiniz mesajınız için teşekkür ederiz.', 'نشكركم على رسالتكم التي أبلغتمونا فيها بمشاكل في الطلب.', 'La ringraziamo per il suo messaggio con cui ci segnala dei problemi con l’ordine.'),
    'Мы глубоко сожалеем о причинённых неудобствах и приносим свои извинения.': (
        'We sincerely regret the inconvenience caused and apologise.', 'Nous regrettons vivement les désagréments occasionnés et vous prions de nous en excuser.', 'Yaşanan sıkıntılar için çok üzgünüz ve özür dileriz.', 'نأسف بشدة للإزعاج الذي حدث ونعتذر عنه.', 'Ci rammarichiamo molto per i disagi causati e ci scusiamo.'),
    'Мы сожалеем, что сложилась такая ситуация.': ('We regret that this situation has arisen.', 'Nous regrettons que cette situation se soit produite.', 'Bu durumun ortaya çıkmasından dolayı üzgünüz.', 'نأسف لأن هذا الوضع قد نشأ.', 'Ci dispiace che si sia creata questa situazione.'),
    'По результатам внутренней проверки было установлено, что из-за внутренних организационных проблем возникла данная ситуация.': (
        'An internal review found that this situation arose because of internal organisational problems.', 'Après vérification interne, il a été établi que cette situation est due à des problèmes d’organisation interne.',
        'Yapılan iç incelemede, bu durumun iç organizasyon sorunlarından kaynaklandığı tespit edildi.', 'تبيّن من التحقق الداخلي أن هذا الوضع نشأ بسبب مشاكل تنظيمية داخلية.', 'Da una verifica interna è emerso che la situazione è dovuta a problemi organizzativi interni.'),
    'По результатам внутренней проверки было установлено, что из-за нехватки персонала возникла данная ситуация.': (
        'An internal review found that this situation arose because of staff shortages.', 'Après vérification interne, il a été établi que cette situation est due à un manque de personnel.',
        'Yapılan iç incelemede, bu durumun personel yetersizliğinden kaynaklandığı tespit edildi.', 'تبيّن من التحقق الداخلي أن هذا الوضع نشأ بسبب نقص الموظفين.', 'Da una verifica interna è emerso che la situazione è dovuta a carenza di personale.'),
    'По результатам внутренней проверки было установлено, что из-за технической неисправности устройства возникла данная ситуация.': (
        'An internal review found that this situation arose because of a technical defect in the device.', 'Après vérification interne, il a été établi que cette situation est due à une panne technique de l’appareil.',
        'Yapılan iç incelemede, bu durumun cihazdaki teknik bir arızadan kaynaklandığı tespit edildi.', 'تبيّن من التحقق الداخلي أن هذا الوضع نشأ بسبب عطل فني في الجهاز.', 'Da una verifica interna è emerso che la situazione è dovuta a un difetto tecnico dell’apparecchio.'),
    'По результатам внутренней проверки было установлено, что из-за сбоя в компьютерной системе возникла данная ситуация.': (
        'An internal review found that this situation arose because of a computer system problem.', 'Après vérification interne, il a été établi que cette situation est due à un problème informatique.',
        'Yapılan iç incelemede, bu durumun bilgisayar sistemindeki bir sorundan kaynaklandığı tespit edildi.', 'تبيّن من التحقق الداخلي أن هذا الوضع نشأ بسبب خلل في النظام الحاسوبي.', 'Da una verifica interna è emerso che la situazione è dovuta a un problema del sistema informatico.'),
    'По результатам внутренней проверки было установлено, что из-за непредвиденных трудностей с поставкой возникла данная ситуация.': (
        'An internal review found that this situation arose because of unforeseen delivery difficulties.', 'Après vérification interne, il a été établi que cette situation est due à des difficultés de livraison imprévues.',
        'Yapılan iç incelemede, bu durumun öngörülemeyen tedarik sorunlarından kaynaklandığı tespit edildi.', 'تبيّن من التحقق الداخلي أن هذا الوضع نشأ بسبب صعوبات غير متوقعة في التوريد.', 'Da una verifica interna è emerso che la situazione è dovuta a imprevisti difficoltà di consegna.'),
    'По результатам внутренней проверки было установлено, что из-за ошибки при обработке заказа возникла данная ситуация.': (
        'An internal review found that this situation arose because of a mix-up in processing the order.', 'Après vérification interne, il a été établi que cette situation est due à une confusion lors du traitement de la commande.',
        'Yapılan iç incelemede, bu durumun siparişin işlenmesi sırasındaki bir karışıklıktan kaynaklandığı tespit edildi.', 'تبيّن من التحقق الداخلي أن هذا الوضع نشأ بسبب خلط أثناء معالجة الطلب.', 'Da una verifica interna è emerso che la situazione è dovuta a uno scambio nell’elaborazione dell’ordine.'),
    'По результатам внутренней проверки было установлено, что из-за неправильной эксплуатации устройства возникла данная ситуация.': (
        'An internal review found that this situation arose because the device was operated incorrectly.', 'Après vérification interne, il a été établi que cette situation est due à une mauvaise utilisation de l’appareil.',
        'Yapılan iç incelemede, bu durumun cihazın yanlış kullanılmasından kaynaklandığı tespit edildi.', 'تبيّن من التحقق الداخلي أن هذا الوضع نشأ بسبب الاستخدام الخاطئ للجهاز.', 'Da una verifica interna è emerso che la situazione è dovuta a un uso errato dell’apparecchio.'),
    'Мы понимаем, насколько важно для вашей компании скорейшее решение вопроса.': (
        'We understand how important a quick solution is for your company.', 'Nous comprenons à quel point une solution rapide est importante pour votre entreprise.', 'Şirketiniz için hızlı bir çözümün ne kadar önemli olduğunu anlıyoruz.', 'نتفهّم مدى أهمية الحل السريع لشركتكم.', 'Comprendiamo quanto sia importante per la vostra azienda una soluzione rapida.'),
    'Сегодня мы провели беседу с нашими сотрудниками и прояснили ситуацию. Заверяем вас, что подобное не повторится.': (
        'Today we spoke with our employees and clarified the situation. We assure you that this will not happen again.', 'Nous avons parlé aujourd’hui avec nos collaborateurs et clarifié la situation. Nous vous assurons que cela ne se reproduira pas.',
        'Bugün çalışanlarımızla görüştük ve durumu netleştirdik. Bunun tekrarlanmayacağını temin ederiz.', 'تحدثنا اليوم مع موظفينا وأوضحنا الموقف. نؤكد لكم أن ذلك لن يتكرر.', 'Oggi abbiamo parlato con i nostri collaboratori e chiarito la situazione. Le assicuriamo che non si ripeterà.'),
    'Просим вас подождать до следующего понедельника. Если ваш заказ не поступит к этому сроку, мы с удовольствием предложим вам аналогичную модель из нашего складского запаса.': (
        'We ask you to wait until next Monday. If your order has not arrived by then, we will gladly offer you a comparable model from our stock.', 'Nous vous prions d’attendre jusqu’à lundi prochain. Si votre commande n’est pas arrivée d’ici là, nous vous proposerons volontiers un modèle comparable de notre stock.',
        'Gelecek pazartesiye kadar beklemenizi rica ederiz. Siparişiniz o zamana kadar ulaşmazsa, stoğumuzdan benzer bir modeli memnuniyetle sunarız.', 'نرجو منكم الانتظار حتى يوم الإثنين القادم. وإذا لم يصل طلبكم حتى ذلك الحين، يسعدنا أن نعرض عليكم طرازاً مماثلاً من مخزوننا.', 'Le chiediamo di attendere fino a lunedì prossimo. Se entro allora l’ordine non fosse arrivato, le offriremo volentieri un modello analogo dal nostro magazzino.'),
    'Ошибку с именами мы исправим бесплатно до конца этой недели. Обращаем ваше внимание, что цветовая схема была реализована в соответствии с договором. Любые дополнительные правки возможны только за доплату в размере [X €].': (
        'We will correct the error in the names free of charge by the end of this week. Please note that the colour scheme was implemented as agreed in the contract. Any further corrections are only possible for an extra charge of [X €].', 'Nous corrigerons gratuitement l’erreur dans les noms d’ici la fin de la semaine. Veuillez noter que le schéma de couleurs a été réalisé conformément au contrat. Toute autre correction n’est possible que moyennant un supplément de [X €].',
        'İsimlerdeki hatayı bu haftanın sonuna kadar ücretsiz düzelteceğiz. Renk şemasının sözleşmeye uygun olarak uygulandığını belirtmek isteriz. Başka düzeltmeler yalnızca [X €] ek ücretle mümkündür.', 'سنصحّح الخطأ في الأسماء مجاناً قبل نهاية هذا الأسبوع. نلفت انتباهكم إلى أن نظام الألوان نُفّذ وفق العقد. أي تعديلات إضافية ممكنة فقط مقابل رسم إضافي قدره [X €].', 'Correggeremo gratuitamente l’errore nei nomi entro la fine della settimana. Si noti che la combinazione di colori è stata realizzata come previsto dal contratto. Ulteriori correzioni sono possibili solo con un supplemento di [X €].'),
    'Наш технический специалист может приехать к вам [дата] в [время]. Пожалуйста, сообщите нам, подходит ли вам это время. Обращаем ваше внимание, что в случае необходимости заказа запчастей незамедлительный ремонт будет невозможен. В таком случае мы сразу же вас уведомим.': (
        'Our technician can come to you on [date] at [time]. Please let us know whether this appointment suits you. Please note that an immediate repair will not be possible if we have to order spare parts. In that case we will inform you at once.', 'Notre technicien peut passer chez vous le [date] à [heure]. Veuillez nous indiquer si ce rendez-vous vous convient. Veuillez noter qu’une réparation immédiate ne sera pas possible si nous devons commander des pièces détachées. Dans ce cas, nous vous informerons immédiatement.',
        'Teknisyenimiz [tarih] günü saat [saat] gibi size gelip cihazı kontrol edebilir. Bu randevunun size uygun olup olmadığını bildirmenizi rica ederiz. Yedek parça sipariş etmemiz gerekirse hemen onarım yapılamayacağını hatırlatırız. Bu durumda sizi derhal bilgilendireceğiz.', 'يمكن لفنيّنا الحضور إليكم بتاريخ [التاريخ] في الساعة [الوقت]. نرجو إبلاغنا إن كان الموعد مناسباً. نلفت انتباهكم إلى أن الإصلاح الفوري لن يكون ممكناً إذا لزم طلب قطع غيار. وفي هذه الحالة سنبلغكم فوراً.', 'Il nostro tecnico può venire da lei il [data] alle [ora]. Ci faccia sapere se l’appuntamento le va bene. Si noti che una riparazione immediata non sarà possibile se dovremo ordinare dei pezzi di ricambio. In tal caso la informeremo subito.'),
    'В среду утром ровно в назначенное время к вам прибудут двое наших сотрудников и завершат сборку мебели. Расходы на повреждённое имущество мы, разумеется, берём на себя.': (
        'On Wednesday morning, two of our employees will arrive punctually at the agreed time and finish assembling the furniture. We will of course cover the costs for the damaged items.', 'Mercredi matin, deux de nos collaborateurs seront chez vous à l’heure convenue et termineront le montage des meubles. Nous prenons bien sûr en charge les frais pour les objets endommagés.',
        'Çarşamba sabahı iki çalışanımız tam zamanında size gelip mobilya montajını tamamlayacak. Hasar gören eşyaların masraflarını elbette biz karşılıyoruz.', 'صباح الأربعاء سيصل إليكم موظفان من طرفنا في الموعد المحدد تماماً وسيُنهيان تركيب الأثاث. وبالطبع نتحمّل تكاليف الأغراض التالفة.', 'Mercoledì mattina due nostri collaboratori saranno puntuali da lei e completeranno il montaggio dei mobili. Naturalmente ci assumiamo i costi degli oggetti danneggiati.'),
    'По результатам консультации с нашим техническим специалистом было установлено, что неполадки вызваны неправильной эксплуатацией устройства. Мы хотели бы вежливо указать вам, что решение данной проблемы не входит в нашу зону ответственности. Наш специалист готов повторно посетить вашу компанию и бесплатно провести обучение сотрудников. Обращаем ваше внимание, что расходы за [предыдущие визиты технического специалиста] / [диагностику устройства] остаются на вашей стороне.': (
        'After consulting our technician we found that the faults were caused by incorrect operation of the device. We would like to politely point out that solving this problem is not within our area of responsibility. Our technician will gladly visit you again and train your employees in how to use the device free of charge. Please note that the costs for [the previous technician visits] / [checking the device] remain with you.', 'Après consultation de notre technicien, il a été établi que les défauts proviennent d’une mauvaise utilisation de l’appareil. Nous nous permettons de vous signaler poliment que la résolution de ce problème ne relève pas de notre responsabilité. Notre technicien se fera un plaisir de revenir et de former gratuitement vos collaborateurs à l’utilisation. Veuillez noter que les frais de [les précédentes interventions du technicien] / [la vérification de l’appareil] restent à votre charge.',
        'Teknisyenimizle görüştükten sonra arızaların cihazın yanlış kullanımından kaynaklandığı tespit edildi. Bu sorunun çözümünün sorumluluk alanımızda olmadığını nazikçe belirtmek isteriz. Teknisyenimiz memnuniyetle tekrar gelip çalışanlarınıza cihazın kullanımını ücretsiz anlatabilir. [Önceki teknisyen ziyaretlerinin] / [cihaz kontrolünün] masraflarının size ait olduğunu lütfen unutmayın.', 'بعد التشاور مع فنيّنا تبيّن أن الأعطال ناتجة عن الاستخدام الخاطئ للجهاز. نود أن ننبّه بلطف إلى أن حل هذه المشكلة لا يقع ضمن نطاق مسؤوليتنا. يسعد فنيّنا أن يزوركم مجدداً ويدرّب موظفيكم على الاستخدام مجاناً. نلفت انتباهكم إلى أن تكاليف [زيارات الفني السابقة] / [فحص الجهاز] تبقى على عاتقكم.', 'Dopo aver sentito il nostro tecnico è emerso che i guasti sono dovuti a un uso errato dell’apparecchio. Desideriamo farle presente con cortesia che la soluzione di questo problema non rientra nella nostra responsabilità. Il nostro tecnico verrà volentieri da lei e istruirà gratuitamente i suoi collaboratori sull’uso. Si noti che i costi per [le precedenti visite del tecnico] / [il controllo dell’apparecchio] restano a suo carico.'),
    'Мы проверили ваш заказ и внесли необходимые исправления. Ваша обычная скидка в размере [X %] была учтена. Исправленный счёт будет выслан вам в ближайшее время.': (
        'We have checked your order and made the necessary corrections. Your usual discount of [X %] has of course been taken into account. You will receive the corrected invoice again shortly.', 'Nous avons vérifié votre commande et apporté les corrections nécessaires. Votre remise habituelle de [X %] a bien entendu été prise en compte. Vous recevrez prochainement la facture corrigée.',
        'Siparişinizi kontrol ettik ve gerekli düzeltmeleri yaptık. Olağan [X %] indiriminiz elbette dikkate alındı. Düzeltilmiş fatura kısa süre içinde size yeniden gönderilecektir.', 'راجعنا طلبكم وأجرينا التصحيحات اللازمة. وقد أُخذ خصمكم المعتاد بنسبة [X %] في الحسبان بالطبع. ستصلكم الفاتورة المصحّحة قريباً.', 'Abbiamo controllato il suo ordine e apportato le correzioni necessarie. Il suo sconto abituale del [X %] è stato naturalmente considerato. Riceverà a breve la fattura corretta.'),
    'За повреждённый товар мы предлагаем вам скидку в размере [X %]. В качестве альтернативы вы можете вернуть нам товар, и мы доставим замену надлежащего качества. Недостающие футболки мы, к сожалению, отправим не ранее [дата] в связи с текущей кадровой ситуацией. Расходы на доставку мы берём на себя.': (
        'For the damaged goods we offer you a price reduction of [X %]. Alternatively, you can send the items back and we will deliver a replacement of flawless quality. Unfortunately, because of our current staffing situation we can only send the missing T-shirts by [date]. We will of course cover the shipping costs.', 'Pour les marchandises endommagées, nous vous proposons une remise de [X %]. Vous pouvez aussi nous renvoyer les articles et nous vous livrerons un remplacement de qualité irréprochable. En raison de notre situation actuelle en personnel, nous ne pourrons malheureusement livrer les T-shirts manquants que d’ici le [date]. Nous prenons bien sûr les frais d’expédition à notre charge.',
        'Hasarlı mallar için [X %] indirim öneriyoruz. Alternatif olarak ürünleri bize geri gönderebilirsiniz, kusursuz kalitede yenisini teslim ederiz. Eksik tişörtleri mevcut personel durumumuz nedeniyle maalesef ancak [tarih] tarihine kadar gönderebiliriz. Kargo masraflarını elbette biz karşılıyoruz.', 'نعرض عليكم خصماً بنسبة [X %] على البضاعة التالفة. وكبديل يمكنكم إعادة القطع إلينا وسنسلّمكم بديلاً بجودة سليمة. أما القمصان الناقصة فلا يمكننا للأسف إرسالها إلا بحلول [التاريخ] بسبب وضع الموظفين الحالي. وبالطبع نتحمّل تكاليف الشحن.', 'Per la merce danneggiata le offriamo uno sconto del [X %]. In alternativa può rimandarci gli articoli e le consegneremo un sostituto di qualità ineccepibile. Le magliette mancanti, purtroppo, a causa dell’attuale situazione del personale potremo inviarle solo entro il [data]. Le spese di spedizione sono naturalmente a nostro carico.'),
    'Дополнительные расходы, возникшие по нашей вине, мы, разумеется, компенсируем в полном объёме. Просим вас направить нам соответствующие подтверждающие документы. Мы будем рады продолжить сотрудничество с вами.': (
        'We will of course reimburse in full the additional costs that arose through our mistake. Please send us the corresponding receipts. We would be glad to continue counting you among our customers.', 'Nous rembourserons bien entendu intégralement les frais supplémentaires dus à notre erreur. Veuillez nous envoyer les justificatifs correspondants. Nous serions heureux de continuer à vous compter parmi nos clients.',
        'Hatamız yüzünden ortaya çıkan ek masrafları elbette tamamen karşılayacağız. Lütfen ilgili belgeleri bize gönderin. Sizi müşterilerimiz arasında saymaya devam etmekten memnuniyet duyarız.', 'سنعوّض بالطبع كامل التكاليف الإضافية الناتجة عن خطئنا. نرجو إرسال المستندات المؤيِّدة. يسعدنا أن نواصل التعاون معكم.', 'Rimborseremo naturalmente per intero i costi aggiuntivi dovuti al nostro errore. Ci invii cortesemente le relative ricevute. Saremmo lieti di continuare a contarla tra i nostri clienti.'),
    'В знак нашей доброй воли мы предлагаем вам скидку в размере [X %] на ваш следующий заказ.': (
        'As a gesture of goodwill we offer you a discount of [X %] on your next order.', 'En signe de bonne volonté, nous vous offrons une remise de [X %] sur votre prochaine commande.', 'İyi niyet göstergesi olarak bir sonraki siparişinizde [X %] indirim sunuyoruz.', 'كلفتة حسن نيّة نقدّم لكم خصماً بنسبة [X %] على طلبكم القادم.', 'Come segno di cortesia le offriamo uno sconto del [X %] sul prossimo ordine.'),
    'В заключение благодарим вас за понимание и надеемся на дальнейшее плодотворное сотрудничество.': (
        'In closing, we thank you for your understanding and hope for continued good cooperation.', 'Pour conclure, nous vous remercions de votre compréhension et espérons poursuivre une bonne collaboration.', 'Son olarak anlayışınız için teşekkür eder, iyi işbirliğimizin sürmesini umarız.', 'في الختام نشكركم على تفهّمكم ونأمل في استمرار التعاون المثمر.', 'In conclusione la ringraziamo per la comprensione e speriamo in una proficua collaborazione futura.'),
    'По всем вопросам вы можете обратиться к нам в любое время.': ('You can contact us at any time with any questions.', 'Pour toute question, vous pouvez nous contacter à tout moment.', 'Sorularınız için bize her zaman başvurabilirsiniz.', 'يمكنكم التواصل معنا في أي وقت لأي استفسار.', 'Per qualsiasi domanda può contattarci in qualsiasi momento.'),
    'С уважением,\n[Ваше имя и фамилия]': ('Kind regards,\n[Your first and last name]', 'Cordialement,\n[Votre prénom et nom]', 'Saygılarımla,\n[Adınız ve soyadınız]', 'مع خالص الاحترام،\n[اسمك الأول واسم العائلة]', 'Distinti saluti,\n[Nome e cognome]'),
}


def load_rm():
    s = open(os.path.join(HERE, '..', 'assets', 'data.js'), encoding='utf-8').read().split('\nconst I18N')[0]
    return json.loads(s[s.index('{'): s.rindex('}') + 1])['RM']


def main():
    rm = load_rm()
    need = []  # (russian key, german, tuple of 5 translations en fr tr ar it)
    miss = []
    for part in ('forum', 'beschwerde'):
        for g in rm[part]:
            hk = g['h'] + ' · ' + g['hr']
            if g['hr'] in HEAD: need.append((hk, g['h'], HEAD[g['hr']], 'H'))
            else: miss.append(hk)
            for x in g['items']:
                if x['ru'] in ITEMS: need.append((x['ru'], x['de'], ITEMS[x['ru']], ''))
                else: miss.append(x['ru'])
    if miss:
        print('NO TRANSLATION for', len(miss))
        for m in miss: print('  ', repr(m))
        sys.exit(1)

    meta_path = os.path.join(HERE, 'i18n_meta.json')
    meta = json.load(open(meta_path, encoding='utf-8'))
    have = set(meta['extra'].values())
    nxt = max(int(k[1:]) for k in meta['extra']) + 1
    esc = lambda t: t.replace('\n', '\\n')
    rows = []  # (id, key, en, de, fr, tr, ar, it)
    # header keys: German group name + translated header for non-German languages that show the Russian part
    seen = set()
    todo = [(LABEL[0], LABEL[1][0], LABEL[1][1], LABEL[1][2], LABEL[1][3], LABEL[1][4], LABEL[1][5])]
    for key, de, tr5, kind in need:
        if key in seen: continue
        seen.add(key)
        if kind == 'H':  # header "GERMAN NAME · Russian": the German name stays, the Russian part is translated
            en, fr, tr, ar, it = (de + ' · ' + t for t in tr5)
            todo.append((key, en, de, fr, tr, ar, it))
        else:
            en, fr, tr, ar, it = tr5
            todo.append((key, en, de, fr, tr, ar, it))
    for key, en, de, fr, tr, ar, it in todo:
        if key in have: continue
        rows.append(('x%d' % nxt, key, en, de, fr, tr, ar, it)); nxt += 1
    for i, key, *_ in rows: meta['extra'][i] = key
    json.dump(meta, open(meta_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=None)
    with open(os.path.join(HERE, 'i18n_src.txt'), 'a', encoding='utf-8') as f:
        for i, key, en, de, *_ in rows: f.write('%s|%s|%s\n' % (i, esc(en), esc(de)))
    for n, fn in enumerate(('i18n_fr.txt', 'i18n_trk.txt', 'i18n_ar.txt', 'i18n_it.txt')):
        with open(os.path.join(HERE, fn), 'a', encoding='utf-8') as f:
            for r in rows: f.write('%s|%s\n' % (r[0], esc(r[4 + n])))
    print('added', len(rows), 'rows')


main()
