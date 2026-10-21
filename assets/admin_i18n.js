/* Admin cabinet UI translations (RU source, default RU). DOM-pass: exact strings + a few dynamic rules. */
const ADM_LANGS = { ru: "RU", en: "EN", de: "DE", fr: "FR", tr: "TR", ar: "AR", it: "IT" };
const ADM_LANG_TITLE = { ru: "Русский", en: "English", de: "Deutsch", fr: "Français", tr: "Türkçe", ar: "العربية", it: "Italiano" };
const ADM_LANG_IDX = { en: 0, de: 1, fr: 2, tr: 3, ar: 4, it: 5 };
let ADM_LANG = (() => { try { return localStorage.getItem("dtb.adminLang") || "de"; } catch { return "de"; } })();
if (!ADM_LANGS[ADM_LANG]) ADM_LANG = "de";

const ADM_I18N = {
  "Кабинет преподавателя": ["Teacher's office", "Lehrerkabinett", "Espace enseignant", "Öğretmen paneli", "مكتب المعلم", "Area docente"],
  "Прогресс учеников DTB B2 Beruf: дни занятий, решённые задания, ошибки и достижения — в одном месте.": ["Student progress for DTB B2 Beruf: study days, solved tasks, mistakes and achievements — all in one place.", "Schülerfortschritt DTB B2 Beruf: Lerntage, gelöste Aufgaben, Fehler und Erfolge — alles an einem Ort.", "Progression DTB B2 Beruf : jours d'étude, tâches résolues, erreurs et réussites — au même endroit.", "DTB B2 Beruf öğrenci ilerlemesi: çalışma günleri, çözülen görevler, hatalar ve başarılar — tek yerde.", "تقدم طلاب DTB B2 Beruf: أيام الدراسة والمهام المحلولة والأخطاء والإنجازات — في مكان واحد.", "Progresso studenti DTB B2 Beruf: giorni di studio, attività risolte, errori e successi — in un posto."],
  "Вход · Кабинет преподавателя": ["Login · Teacher's office", "Login · Lehrerkabinett", "Connexion · Espace enseignant", "Giriş · Öğretmen paneli", "الدخول · مكتب المعلم", "Accesso · Area docente"],
  "Кабинет преподавателя · DTB B2 Beruf": ["Teacher's office · DTB B2 Beruf", "Lehrerkabinett · DTB B2 Beruf", "Espace enseignant · DTB B2 Beruf", "Öğretmen paneli · DTB B2 Beruf", "مكتب المعلم · DTB B2 Beruf", "Area docente · DTB B2 Beruf"],
  "DTB B2 Beruf · прогресс учеников": ["DTB B2 Beruf · student progress", "DTB B2 Beruf · Schülerfortschritt", "DTB B2 Beruf · progression", "DTB B2 Beruf · öğrenci ilerlemesi", "DTB B2 Beruf · تقدم الطلاب", "DTB B2 Beruf · progresso"],
  "Пароль": ["Password", "Passwort", "Mot de passe", "Şifre", "كلمة المرور", "Password"],
  "Пароль преподавателя": ["Teacher password", "Lehrerpasswort", "Mot de passe enseignant", "Öğretmen şifresi", "كلمة مرور المعلم", "Password docente"],
  "Проверяем…": ["Checking…", "Prüfe…", "Vérification…", "Kontrol ediliyor…", "جارٍ التحقق…", "Verifica…"],
  "Войти": ["Log in", "Anmelden", "Connexion", "Giriş", "تسجيل الدخول", "Accedi"],
  "Введите пароль.": ["Enter the password.", "Passwort eingeben.", "Saisissez le mot de passe.", "Şifre girin.", "أدخل كلمة المرور.", "Inserisci la password."],
  "Пароль проверяется на сервере, в браузере он не сохраняется. Сессия живёт 8 часов.": ["The password is checked on the server and is not stored in the browser. Session lasts 8 hours.", "Das Passwort wird auf dem Server geprüft und nicht im Browser gespeichert. Sitzung: 8 Stunden.", "Le mot de passe est vérifié sur le serveur et n'est pas stocké dans le navigateur. Session de 8 heures.", "Şifre sunucuda kontrol edilir, tarayıcıda saklanmaz. Oturum 8 saat.", "تُتحقق كلمة المرور على الخادم ولا تُحفظ في المتصفح. الجلسة 8 ساعات.", "La password è verificata sul server e non salvata nel browser. Sessione 8 ore."],
  "Данные читаются из Firebase. Доступ только по паролю.": ["Data is read from Firebase. Password required.", "Daten kommen aus Firebase. Nur mit Passwort.", "Données lues depuis Firebase. Accès par mot de passe.", "Veriler Firebase'den okunur. Şifre gerekli.", "تُقرأ البيانات من Firebase. الوصول بكلمة مرور.", "Dati da Firebase. Accesso con password."],
  "ADMIN_PASSWORD не задан на сервере. На Vercel добавьте переменную окружения": ["ADMIN_PASSWORD is not set on the server. On Vercel add an environment variable", "ADMIN_PASSWORD ist auf dem Server nicht gesetzt. Fügen Sie in Vercel eine Umgebungsvariable hinzu", "ADMIN_PASSWORD n'est pas défini sur le serveur. Ajoutez une variable d'environnement sur Vercel", "ADMIN_PASSWORD sunucuda ayarlı değil. Vercel'de ortam değişkeni ekleyin", "ADMIN_PASSWORD غير معيّن على الخادم. أضف متغير بيئة في Vercel", "ADMIN_PASSWORD non impostata sul server. Aggiungi una variabile su Vercel"],
  "и сделайте Redeploy. При локальном запуске пароль печатается в консоли.": ["and redeploy. On a local run the password is printed in the console.", "und führen Sie ein Redeploy aus. Lokal wird das Passwort in der Konsole ausgegeben.", "et redéployez. En local, le mot de passe est affiché dans la console.", "ve yeniden dağıtın. Yerelde şifre konsola yazılır.", "وأعد النشر. محليًا تُطبع كلمة المرور في الطرفية.", "e ridistribuisci. In locale la password è stampata in console."],
  "На сервере не задан ADMIN_PASSWORD. Добавьте переменную окружения и перезапустите.": ["ADMIN_PASSWORD is not set on the server. Add the environment variable and restart.", "ADMIN_PASSWORD ist auf dem Server nicht gesetzt. Variable hinzufügen und neu starten.", "ADMIN_PASSWORD n'est pas défini. Ajoutez la variable et redémarrez.", "ADMIN_PASSWORD ayarlı değil. Değişkeni ekleyip yeniden başlatın.", "ADMIN_PASSWORD غير معيّن. أضف المتغير وأعد التشغيل.", "ADMIN_PASSWORD non impostata. Aggiungi la variabile e riavvia."],
  "Не удалось войти.": ["Could not log in.", "Anmeldung fehlgeschlagen.", "Connexion impossible.", "Giriş yapılamadı.", "تعذر تسجيل الدخول.", "Accesso non riuscito."],
  "Загружаем прогресс учеников…": ["Loading student progress…", "Schülerfortschritt wird geladen…", "Chargement de la progression…", "Öğrenci ilerlemesi yükleniyor…", "جارٍ تحميل تقدم الطلاب…", "Caricamento progressi…"],
  "Сервер не отвечает. Запущен ли npm start?": ["Server is not responding. Is npm start running?", "Server antwortet nicht. Läuft npm start?", "Le serveur ne répond pas. npm start est-il lancé ?", "Sunucu yanıt vermiyor. npm start çalışıyor mu?", "الخادم لا يستجيب. هل npm start يعمل؟", "Il server non risponde. npm start è attivo?"],
  "Ошибка подключения.": ["Connection error.", "Verbindungsfehler.", "Erreur de connexion.", "Bağlantı hatası.", "خطأ في الاتصال.", "Errore di connessione."],
  "НЕ НАСТРОЕНО": ["NOT CONFIGURED", "NICHT KONFIGURIERT", "NON CONFIGURÉ", "YAPILANDIRILMADI", "غير مُهيأ", "NON CONFIGURATO"],
  "ТЕСТОВЫЕ ДАННЫЕ": ["TEST DATA", "TESTDATEN", "DONNÉES TEST", "TEST VERİSİ", "بيانات اختبار", "DATI TEST"],
  "Обновить данные": ["Refresh data", "Daten aktualisieren", "Actualiser les données", "Verileri yenile", "تحديث البيانات", "Aggiorna dati"],
  "Выйти": ["Log out", "Abmelden", "Déconnexion", "Çıkış", "تسجيل الخروج", "Esci"],
  "обновлено только что": ["updated just now", "gerade aktualisiert", "à l'instant", "az önce güncellendi", "تم التحديث الآن", "appena aggiornato"],
  "обновлено": ["updated", "aktualisiert", "actualisé", "güncellendi", "تم التحديث", "aggiornato"],
  "минуту": ["minute", "Minute", "minute", "dakika", "دقيقة", "minuto"],
  "минуты": ["minutes", "Minuten", "minutes", "dakika", "دقائق", "minuti"],
  "минут": ["minutes", "Minuten", "minutes", "dakika", "دقائق", "minuti"],
  "Прогресс учеников": ["Student progress", "Schülerfortschritt", "Progression des élèves", "Öğrenci ilerlemesi", "تقدم الطلاب", "Progresso studenti"],
  " в облаке · ": [" in the cloud · ", " in der Cloud · ", " dans le cloud · ", " bulutta · ", " في السحابة · ", " nel cloud · "],
  " активны за неделю · ": [" active this week · ", " diese Woche aktiv · ", " actifs cette semaine · ", " bu hafta aktif · ", " نشطون هذا الأسبوع · ", " attivi questa settimana · "],
  " заданий решено": [" tasks solved", " Aufgaben gelöst", " tâches résolues", " görev çözüldü", " مهام تم حلها", " attività risolte"],
  "Здесь появятся ученики, которые сохраняют прогресс в облаке.": ["Students who save progress in the cloud will appear here.", "Hier erscheinen Schüler, die ihren Fortschritt in der Cloud speichern.", "Les élèves qui enregistrent leur progression dans le cloud apparaîtront ici.", "İlerlemesini buluta kaydeden öğrenciler burada görünecek.", "سيظهر هنا الطلاب الذين يحفظون تقدمهم في السحابة.", "Qui appariranno gli studenti che salvano i progressi nel cloud."],
  "Обновить": ["Refresh", "Aktualisieren", "Actualiser", "Yenile", "تحديث", "Aggiorna"],
  "Не удалось обновить": ["Could not update", "Aktualisierung fehlgeschlagen", "Échec de la mise à jour", "Güncellenemedi", "تعذر التحديث", "Aggiornamento non riuscito"],
  "Повторить": ["Retry", "Wiederholen", "Réessayer", "Tekrar dene", "إعادة المحاولة", "Riprova"],
  "Ученики": ["Students", "Schüler", "Élèves", "Öğrenciler", "الطلاب", "Studenti"],
  " с прогрессом": [" with progress", " mit Fortschritt", " avec progression", " ilerlemeli", " لديهم تقدم", " con progresso"],
  "Активны 7 дней": ["Active 7 days", "Aktiv 7 Tage", "Actifs 7 jours", "7 gün aktif", "نشطون 7 أيام", "Attivi 7 giorni"],
  " за 30 дней": [" in 30 days", " in 30 Tagen", " sur 30 jours", " 30 günde", " خلال 30 يومًا", " in 30 giorni"],
  "Дней занятий": ["Days studied", "Lerntage", "Jours d'étude", "Çalışma günleri", "أيام الدراسة", "Giorni di studio"],
  "в среднем": ["on average", "im Durchschnitt", "en moyenne", "ortalama", "بمتوسط", "in media"],
  " на ученика": [" per student", " pro Schüler", " par élève", " öğrenci başına", " لكل طالب", " per studente"],
  "пока нет данных": ["no data yet", "noch keine Daten", "pas encore de données", "henüz veri yok", "لا بيانات بعد", "nessun dato"],
  "Попыток решения": ["Attempts", "Versuche", "Tentatives", "Denemeler", "المحاولات", "Tentativi"],
  " заданий · ": [" tasks · ", " Aufgaben · ", " tâches · ", " görev · ", " مهام · ", " attività · "],
  " успешных": [" successful", " erfolgreich", " réussies", " başarılı", " ناجحة", " riuscite"],
  "Средний успех": ["Average success", "Durchschnitt", "Réussite moyenne", "Ortalama başarı", "متوسط النجاح", "Successo medio"],
  "лучший результат": ["best result", "bestes Ergebnis", "meilleur résultat", "en iyi sonuç", "أفضل نتيجة", "miglior risultato"],
  "Ошибки к повтору": ["Mistakes to review", "Fehler zum Wiederholen", "Erreurs à revoir", "Tekrar hataları", "أخطاء للمراجعة", "Errori da ripassare"],
  "слабая тема": ["weak topic", "schwaches Thema", "point faible", "zayıf konu", "موضوع ضعيف", "punto debole"],
  "слабых": ["weak", "schwache", "faibles", "zayıf", "ضعيفة", "deboli"],
  "тема": ["topic", "Thema", "thème", "konu", "موضوع", "argomento"],
  "темы": ["topics", "Themen", "thèmes", "konular", "مواضيع", "argomenti"],
  "тем": ["topics", "Themen", "thèmes", "konular", "مواضيع", "argomenti"],
  "Как только первый ученик сохранит прогресс в облаке, здесь появятся графики и таблица.": ["As soon as the first student saves progress in the cloud, charts and the table will appear here.", "Sobald der erste Schüler Fortschritt in der Cloud speichert, erscheinen hier Diagramme und Tabelle.", "Dès que le premier élève enregistre sa progression, les graphiques et le tableau apparaîtront.", "İlk öğrenci ilerlemesini buluta kaydedince grafikler ve tablo burada görünecek.", "عندما يحفظ أول طالب تقدمه في السحابة، ستظهر الرسوم والجدول هنا.", "Quando il primo studente salva i progressi, qui appariranno grafici e tabella."],
  "Активность": ["Activity", "Aktivität", "Activité", "Etkinlik", "النشاط", "Attività"],
  "Сколько заданий решают ученики каждый день": ["Tasks solved per day", "Aufgaben pro Tag", "Tâches par jour", "Günlük görev", "المهام يوميًا", "Attività al giorno"],
  "Период": ["Period", "Zeitraum", "Période", "Dönem", "الفترة", "Periodo"],
  " дн.": [" d", " T", " j", " g", " ي", " g"],
  "ученики": ["students", "Schüler", "élèves", "öğrenciler", "طلاب", "studenti"],
  "Уровни учеников": ["Student levels", "Schülerniveaus", "Niveaux des élèves", "Öğrenci seviyeleri", "مستويات الطلاب", "Livelli studenti"],
  "По среднему результату": ["By average result", "Nach Durchschnitt", "Selon la moyenne", "Ortalamaya göre", "حسب المتوسط", "Per media"],
  "средний успех": ["average success", "Durchschnitt", "réussite moyenne", "ortalama başarı", "متوسط النجاح", "successo medio"],
  "Задания по результату": ["Tasks by result", "Aufgaben nach Ergebnis", "Tâches par résultat", "Sonuca göre görevler", "المهام حسب النتيجة", "Attività per risultato"],
  "заданий": ["tasks", "Aufgaben", "tâches", "görev", "مهام", "attività"],
  "успешно 80%+ · ": ["successful 80%+ · ", "erfolgreich 80 %+ · ", "réussi 80 %+ · ", "başarılı %80+ · ", "ناجح 80%+ · ", "riuscito 80%+ · "],
  "средне · ": ["medium · ", "mittel · ", "moyen · ", "orta · ", "متوسط · ", "medio · "],
  "слабо <50% · ": ["weak <50% · ", "schwach <50 % · ", "faible <50 % · ", "zayıf <%50 · ", "ضعيف <50% · ", "debole <50% · "],
  "нет данных": ["no data", "keine Daten", "pas de données", "veri yok", "لا بيانات", "nessun dato"],
  "По частям экзамена": ["By exam part", "Nach Prüfungsteilen", "Par partie d'examen", "Sınav bölümlerine göre", "حسب أجزاء الامتحان", "Per parte d'esame"],
  "Средний результат по всем ученикам": ["Average across all students", "Durchschnitt aller Schüler", "Moyenne de tous les élèves", "Tüm öğrencilerin ortalaması", "متوسط جميع الطلاب", "Media di tutti gli studenti"],
  "Слабые места": ["Weak spots", "Schwache Stellen", "Points faibles", "Zayıf noktalar", "نقاط الضعف", "Punti deboli"],
  "Части с наибольшим числом ошибок": ["Parts with most mistakes", "Teile mit den meisten Fehlern", "Parties avec le plus d'erreurs", "En çok hatalı bölümler", "الأجزاء الأكثر أخطاء", "Parti con più errori"],
  "Лидеры": ["Leaders", "Spitzenreiter", "Leaders", "Liderler", "المتصدرون", "Leader"],
  "Лучший средний результат": ["Best average result", "Bester Durchschnitt", "Meilleure moyenne", "En iyi ortalama", "أفضل متوسط", "Migliore media"],
  "нажмите на строку, чтобы открыть профиль": ["click a row to open the profile", "Zeile anklicken, um das Profil zu öffnen", "cliquez sur une ligne pour ouvrir le profil", "profili açmak için satıra tıklayın", "انقر على صف لفتح الملف", "clicca una riga per aprire il profilo"],
  "Имя, фамилия или UID": ["Name, surname or UID", "Name, Nachname oder UID", "Nom, prénom ou UID", "Ad, soyad veya UID", "الاسم أو اللقب أو UID", "Nome, cognome o UID"],
  "Поиск ученика": ["Search student", "Schüler suchen", "Rechercher un élève", "Öğrenci ara", "ابحث عن طالب", "Cerca studente"],
  "Фильтр": ["Filter", "Filter", "Filtre", "Filtre", "فلتر", "Filtro"],
  "Все": ["All", "Alle", "Tous", "Tümü", "الكل", "Tutti"],
  "Активные": ["Active", "Aktiv", "Actifs", "Aktif", "النشطون", "Attivi"],
  "Нужна помощь": ["Need help", "Hilfe nötig", "Besoin d'aide", "Yardım gerekli", "يحتاج مساعدة", "Serve aiuto"],
  "Не заходили": ["Inactive", "Inaktiv", "Inactifs", "Girmeyenler", "غير نشطين", "Inattivi"],
  "Сортировка": ["Sort", "Sortierung", "Tri", "Sıralama", "الترتيب", "Ordina"],
  "Сначала сильные": ["Strongest first", "Stärkste zuerst", "Les plus forts d'abord", "En güçlü önce", "الأقوى أولاً", "Prima i più forti"],
  "Недавно активные": ["Recently active", "Zuletzt aktiv", "Récents", "Son aktif", "النشطون حديثًا", "Recenti"],
  "Больше ошибок": ["Most mistakes", "Meiste Fehler", "Plus d'erreurs", "En çok hata", "الأكثر أخطاء", "Più errori"],
  "Больше дней": ["Most days", "Meiste Tage", "Plus de jours", "En çok gün", "الأكثر أيامًا", "Più giorni"],
  "Больше заданий": ["Most tasks", "Meiste Aufgaben", "Plus de tâches", "En çok görev", "الأكثر مهامًا", "Più attività"],
  "По имени": ["By name", "Nach Name", "Par nom", "Ada göre", "حسب الاسم", "Per nome"],
  "Показаны только имя, прогресс и активность. Дата рождения, адрес и другие поля анкеты не читаются.": ["Only name, progress and activity are shown. Date of birth, address and other profile fields are not read.", "Nur Name, Fortschritt und Aktivität. Geburtsdatum, Adresse und andere Felder werden nicht gelesen.", "Seuls le nom, la progression et l'activité sont affichés. Les autres champs ne sont pas lus.", "Yalnızca ad, ilerleme ve etkinlik gösterilir. Diğer alanlar okunmaz.", "يُعرض الاسم والتقدم والنشاط فقط. لا تُقرأ الحقول الأخرى.", "Solo nome, progresso e attività. Gli altri campi non vengono letti."],
  "Пока нет учеников в облаке": ["No students in the cloud yet", "Noch keine Schüler in der Cloud", "Aucun élève dans le cloud", "Bulutta henüz öğrenci yok", "لا طلاب في السحابة بعد", "Nessuno studente nel cloud"],
  "Ученик появляется здесь после того, как заполнит анкету и придумает пароль — тогда его прогресс сохраняется в Firebase и виден преподавателю.": ["A student appears here after filling in the profile and setting a password — then progress is saved in Firebase and visible to the teacher.", "Ein Schüler erscheint hier, nachdem er das Profil ausgefüllt und ein Passwort gesetzt hat — dann wird der Fortschritt in Firebase gespeichert.", "Un élève apparaît ici après avoir rempli le profil et choisi un mot de passe — sa progression est alors enregistrée dans Firebase.", "Öğrenci profili doldurup şifre belirledikten sonra burada görünür — ilerleme Firebase'e kaydedilir.", "يظهر الطالب هنا بعد ملء الملف وتعيين كلمة مرور — ثم يُحفظ التقدم في Firebase.", "Uno studente appare qui dopo aver compilato il profilo e scelto una password — il progresso viene salvato in Firebase."],
  "Попросите учеников открыть «Данные участника» (иконка 👤 в шапке тренажёра) и указать пароль от 6 символов. Без пароля прогресс остаётся только в браузере ученика.": ["Ask students to open “Participant data” (👤 icon in the trainer header) and set a password of 6+ characters. Without a password progress stays only in the student's browser.", "Bitten Sie die Schüler, „Teilnehmerdaten“ (👤 im Kopf des Trainers) zu öffnen und ein Passwort ab 6 Zeichen zu setzen. Ohne Passwort bleibt der Fortschritt nur im Browser.", "Demandez aux élèves d'ouvrir « Données du participant » (icône 👤) et de définir un mot de passe de 6 caractères. Sans mot de passe, la progression reste dans le navigateur.", "Öğrencilerden “Katılımcı bilgileri” (👤) bölümünü açıp 6+ karakterlik şifre belirlemesini isteyin. Şifresiz ilerleme tarayıcıda kalır.", "اطلب من الطلاب فتح «بيانات المشارك» (أيقونة 👤) وتعيين كلمة مرور من 6 أحرف. بدونها يبقى التقدم في المتصفح.", "Chiedi agli studenti di aprire «Dati partecipante» (icona 👤) e impostare una password di 6+ caratteri. Senza password i progressi restano nel browser."],
  "Проверить снова": ["Check again", "Erneut prüfen", "Vérifier à nouveau", "Tekrar kontrol et", "تحقق مرة أخرى", "Controlla di nuovo"],
  "Никого не нашли. Измените запрос или фильтр.": ["No matches. Change the query or filter.", "Keine Treffer. Suche oder Filter ändern.", "Aucun résultat. Modifiez la recherche ou le filtre.", "Eşleşme yok. Aramayı veya filtreyi değiştirin.", "لا نتائج. غيّر البحث أو الفلتر.", "Nessun risultato. Cambia ricerca o filtro."],
  "Пока нет учеников.": ["No students yet.", "Noch keine Schüler.", "Aucun élève.", "Henüz öğrenci yok.", "لا طلاب بعد.", "Nessuno studente."],
  "Ученик": ["Student", "Schüler", "Élève", "Öğrenci", "طالب", "Studente"],
  "Дней": ["Days", "Tage", "Jours", "Gün", "أيام", "Giorni"],
  "Попыток / заданий": ["Attempts / tasks", "Versuche / Aufgaben", "Tentatives / tâches", "Denemeler / görevler", "المحاولات / المهام", "Tentativi / attività"],
  "Успех": ["Success", "Erfolg", "Réussite", "Başarı", "النجاح", "Successo"],
  "Ошибки": ["Mistakes", "Fehler", "Erreurs", "Hatalar", "الأخطاء", "Errori"],
  "Был(а)": ["Last seen", "Zuletzt", "Vu(e)", "Son görülme", "آخر ظهور", "Ultimo accesso"],
  "Открыть профиль": ["Open profile", "Profil öffnen", "Ouvrir le profil", "Profili aç", "افتح الملف", "Apri profilo"],
  "дней:": ["days:", "Tage:", "jours :", "gün:", "أيام:", "giorni:"],
  "попыток:": ["attempts:", "Versuche:", "tentatives :", "deneme:", "محاولات:", "tentativi:"],
  "ошибок:": ["mistakes:", "Fehler:", "erreurs :", "hata:", "أخطاء:", "errori:"],
  "Пока нет результатов.": ["No results yet.", "Noch keine Ergebnisse.", "Pas encore de résultats.", "Henüz sonuç yok.", "لا نتائج بعد.", "Nessun risultato."],
  "Осталось подключить Firebase": ["Firebase setup remaining", "Firebase einrichten", "Configurer Firebase", "Firebase kurulumu", "إعداد Firebase", "Configura Firebase"],
  "Кабинет уже работает, но серверу нужен ключ доступа к Firestore. Это делается один раз.": ["The cabinet works, but the server needs a Firestore key. This is done once.", "Das Kabinett läuft, aber der Server braucht einen Firestore-Schlüssel. Einmalig.", "L'espace fonctionne, mais le serveur a besoin d'une clé Firestore. Une fois.", "Panel çalışıyor, ancak sunucu Firestore anahtarı istiyor. Bir kez.", "اللوحة تعمل، لكن الخادم يحتاج مفتاح Firestore. مرة واحدة.", "Funziona, ma il server richiede una chiave Firestore. Una volta."],
  "Не удалось загрузить данные": ["Could not load data", "Daten konnten nicht geladen werden", "Impossible de charger les données", "Veriler yüklenemedi", "تعذر تحميل البيانات", "Impossibile caricare i dati"],
  "Неизвестная ошибка": ["Unknown error", "Unbekannter Fehler", "Erreur inconnue", "Bilinmeyen hata", "خطأ غير معروف", "Errore sconosciuto"],
  "Что нужно сделать": ["What to do", "Was zu tun ist", "À faire", "Yapılacaklar", "ما يجب فعله", "Cosa fare"],
  "Профиль ученика": ["Student profile", "Schülerprofil", "Profil élève", "Öğrenci profili", "ملف الطالب", "Profilo studente"],
  "Закрыть": ["Close", "Schließen", "Fermer", "Kapat", "إغلاق", "Chiudi"],
  "Закрыть профиль": ["Close profile", "Profil schließen", "Fermer le profil", "Profili kapat", "إغلاق الملف", "Chiudi profilo"],
  "был(а)": ["last seen", "zuletzt", "vu(e)", "son görülme", "آخر ظهور", "ultimo accesso"],
  "нет активности": ["no activity", "keine Aktivität", "aucune activité", "etkinlik yok", "لا نشاط", "nessuna attività"],
  "дней занятий": ["days studied", "Lerntage", "jours d'étude", "çalışma günleri", "أيام الدراسة", "giorni di studio"],
  "попыток": ["attempts", "Versuche", "tentatives", "deneme", "محاولات", "tentativi"],
  "ошибок": ["mistakes", "Fehler", "erreurs", "hata", "أخطاء", "errori"],
  "лучшая серия": ["best streak", "beste Serie", "meilleure série", "en iyi seri", "أفضل سلسلة", "migliore serie"],
  "Лучший средний результат:": ["Best average result:", "Bester Durchschnitt:", "Meilleure moyenne :", "En iyi ortalama:", "أفضل متوسط:", "Migliore media:"],
  " · успешных заданий: ": [" · successful tasks: ", " · erfolgreiche Aufgaben: ", " · tâches réussies : ", " · başarılı görev: ", " · مهام ناجحة: ", " · attività riuscite: "],
  " · ошибок к повтору: ": [" · mistakes to review: ", " · Fehler zum Wiederholen: ", " · erreurs à revoir : ", " · tekrar hataları: ", " · أخطاء للمراجعة: ", " · errori da ripassare: "],
  "Достижения ·": ["Achievements ·", "Erfolge ·", "Réussites ·", "Başarılar ·", "الإنجازات ·", "Successi ·"],
  " из 10": [" of 10", " von 10", " sur 10", " / 10", " من 10", " di 10"],
  "Пока нет результатов по частям.": ["No results by part yet.", "Noch keine Ergebnisse nach Teilen.", "Pas encore de résultats par partie.", "Bölümlere göre henüz sonuç yok.", "لا نتائج حسب الأجزاء بعد.", "Nessun risultato per parte."],
  "Активность · 30 дней": ["Activity · 30 days", "Aktivität · 30 Tage", "Activité · 30 jours", "Etkinlik · 30 gün", "النشاط · 30 يومًا", "Attività · 30 giorni"],
  "Динамика результатов": ["Result trend", "Ergebnistrend", "Évolution des résultats", "Sonuç eğilimi", "اتجاه النتائج", "Andamento risultati"],
  "последние": ["latest", "letzte", "derniers", "son", "آخر", "ultimi"],
  " результатов": [" results", " Ergebnisse", " résultats", " sonuç", " نتائج", " risultati"],
  "Что повторить": ["What to review", "Was wiederholen", "À revoir", "Neyi tekrar etmeli", "ما يجب مراجعته", "Cosa ripassare"],
  "Последние ошибки": ["Recent mistakes", "Letzte Fehler", "Dernières erreurs", "Son hatalar", "الأخطاء الأخيرة", "Ultimi errori"],
  "Ошибок не зафиксировано.": ["No mistakes recorded.", "Keine Fehler erfasst.", "Aucune erreur enregistrée.", "Hata kaydedilmedi.", "لم تُسجل أخطاء.", "Nessun errore registrato."],
  "Ошибок нет — отличная работа!": ["No mistakes — great job!", "Keine Fehler — super!", "Aucune erreur — bravo !", "Hata yok — harika!", "لا أخطاء — عمل رائع!", "Nessun errore — ottimo!"],
  "Нет данных за этот период.": ["No data for this period.", "Keine Daten für diesen Zeitraum.", "Pas de données pour cette période.", "Bu dönem için veri yok.", "لا بيانات لهذه الفترة.", "Nessun dato per questo periodo."],
  "Нужно хотя бы два результата, чтобы увидеть динамику.": ["At least two results are needed to see a trend.", "Mindestens zwei Ergebnisse nötig, um einen Trend zu sehen.", "Il faut au moins deux résultats pour voir une tendance.", "Eğilim için en az iki sonuç gerekli.", "يلزم نتيجتان على الأقل لرؤية الاتجاه.", "Servono almeno due risultati per vedere l'andamento."],
  "сегодня": ["today", "heute", "aujourd'hui", "bugün", "اليوم", "oggi"],
  "вчера": ["yesterday", "gestern", "hier", "dün", "أمس", "ieri"],
  "Светлая тема": ["Light theme", "Helles Design", "Thème clair", "Açık tema", "المظهر الفاتح", "Tema chiaro"],
  "Тёмная тема": ["Dark theme", "Dunkles Design", "Thème sombre", "Koyu tema", "المظهر الداكن", "Tema scuro"],
  "Язык": ["Language", "Sprache", "Langue", "Dil", "اللغة", "Lingua"],
  "Фамилия": ["Surname", "Nachname", "Nom", "Soyad", "اللقب", "Cognome"],
  "Имя": ["First name", "Vorname", "Prénom", "Ad", "الاسم", "Nome"],
  "Заданий": ["Tasks", "Aufgaben", "Tâches", "Görevler", "المهام", "Attività"],
  "Попыток": ["Attempts", "Versuche", "Tentatives", "Denemeler", "المحاولات", "Tentativi"],
  "Средний %": ["Average %", "Durchschnitt %", "Moyenne %", "Ortalama %", "المتوسط %", "Media %"],
  "Лучший %": ["Best %", "Bestes %", "Meilleur %", "En iyi %", "الأفضل %", "Migliore %"],
  "Успешных": ["Successful", "Erfolgreich", "Réussies", "Başarılı", "ناجحة", "Riuscite"],
  "Серия": ["Streak", "Serie", "Série", "Seri", "سلسلة", "Serie"],
  "Последняя активность": ["Last activity", "Letzte Aktivität", "Dernière activité", "Son etkinlik", "آخر نشاط", "Ultima attività"],
  "Достижения": ["Achievements", "Erfolge", "Réussites", "Başarılar", "الإنجازات", "Successi"],
  "задания": ["tasks", "Aufgaben", "tâches", "görevler", "مهام", "attività"],
  "Без имени": ["Unnamed", "Ohne Namen", "Sans nom", "İsimsiz", "بدون اسم", "Senza nome"],
  "не заполнил(а) анкету": ["profile not filled in", "Profil nicht ausgefüllt", "profil non rempli", "profil doldurulmadı", "لم يُملأ الملف", "profilo non compilato"],
  "Показаны только имя, прогресс и активность. Дата рождения, адрес и другие поля анкеты не читаются. Данные обновляются, когда ученик сохраняет прогресс в облаке.": ["Only name, progress and activity are shown. Date of birth, address and other profile fields are not read. Data updates when a student saves progress in the cloud.", "Nur Name, Fortschritt und Aktivität. Geburtsdatum, Adresse und andere Felder werden nicht gelesen. Daten werden aktualisiert, wenn ein Schüler Fortschritt in der Cloud speichert.", "Seuls le nom, la progression et l'activité sont affichés. Les autres champs ne sont pas lus. Mise à jour quand l'élève enregistre sa progression.", "Yalnızca ad, ilerleme ve etkinlik gösterilir. Diğer alanlar okunmaz. Veriler öğrenci buluta kaydettiğinde güncellenir.", "يُعرض الاسم والتقدم والنشاط فقط. لا تُقرأ الحقول الأخرى. تُحدّث البيانات عند حفظ الطالب لتقدمه في السحابة.", "Solo nome, progresso e attività. Gli altri campi non vengono letti. I dati si aggiornano quando lo studente salva i progressi nel cloud."],
  "Для кабинета нужен JavaScript.": ["JavaScript is required for the cabinet.", "Für das Kabinett ist JavaScript erforderlich.", "JavaScript est nécessaire pour l'espace.", "Panel için JavaScript gerekli.", "مطلوب JavaScript للوحة.", "JavaScript è necessario per l'area."],

  "Неверный пароль.": ["Wrong password.", "Falsches Passwort.", "Mot de passe incorrect.", "Yanlış şifre.", "كلمة مرور خاطئة.", "Password errata."],
  "Слишком много попыток. Попробуйте через 10 минут.": ["Too many attempts. Try again in 10 minutes.", "Zu viele Versuche. Versuchen Sie es in 10 Minuten erneut.", "Trop de tentatives. Réessayez dans 10 minutes.", "Çok fazla deneme. 10 dakika sonra tekrar deneyin.", "محاولات كثيرة. حاول بعد 10 دقائق.", "Troppi tentativi. Riprova tra 10 minuti."],
  "Войдите в кабинет.": ["Please log in.", "Bitte melden Sie sich an.", "Veuillez vous connecter.", "Lütfen giriş yapın.", "يرجى تسجيل الدخول.", "Accedi."],
  "Нет связи с сервером.": ["No connection to the server.", "Keine Verbindung zum Server.", "Pas de connexion au serveur.", "Sunucuya bağlantı yok.", "لا اتصال بالخادم.", "Nessuna connessione al server."],

  "Первый шаг": ["First step", "Erster Schritt", "Premier pas", "İlk adım", "الخطوة الأولى", "Primo passo"],
  "7 дней подряд": ["7-day streak", "7 Tage in Folge", "7 jours d'affilée", "7 gün üst üste", "7 أيام متتالية", "7 giorni di fila"],
  "30 дней занятий": ["30 study days", "30 Lerntage", "30 jours d'étude", "30 çalışma günü", "30 يوم دراسة", "30 giorni di studio"],
  "Без ошибок": ["No mistakes", "Ohne Fehler", "Sans erreur", "Hatasız", "بدون أخطاء", "Senza errori"],
  "Отличник": ["Top student", "Einser-Schüler", "Excellent", "Başarılı öğrenci", "طالب متفوق", "Eccellente"],
  "Письмо · Beschwerde": ["Letter · Beschwerde", "Brief · Beschwerde", "Lettre · Beschwerde", "Mektup · Beschwerde", "رسالة · Beschwerde", "Lettera · Beschwerde"],
  "из 10": ["of 10", "von 10", "sur 10", " / 10", "من 10", "di 10"],
  "Показаны только имя, прогресс и активность. Остальные поля анкеты не читаются.": ["Only name, progress and activity are shown. Other profile fields are not read.", "Nur Name, Fortschritt und Aktivität. Andere Felder werden nicht gelesen.", "Seuls nom, progression et activité. Les autres champs ne sont pas lus.", "Yalnızca ad, ilerleme ve etkinlik. Diğer alanlar okunmaz.", "يُعرض الاسم والتقدم والنشاط فقط. لا تُقرأ الحقول الأخرى.", "Solo nome, progresso e attività. Gli altri campi non vengono letti."],
  "облачный прогресс": ["cloud progress", "Cloud-Fortschritt", "progression cloud", "bulut ilerlemesi", "تقدم سحابي", "progresso cloud"],

};

const ADM_RULES = [
  [/^(\d+) учеников в облаке · (\d+) активны за неделю · (\d+) заданий решено$/, ["{0} students in the cloud · {1} active this week · {2} tasks solved", "{0} Schüler in der Cloud · {1} diese Woche aktiv · {2} Aufgaben gelöst", "{0} élèves dans le cloud · {1} actifs cette semaine · {2} tâches résolues", "{0} öğrenci bulutta · {1} bu hafta aktif · {2} görev çözüldü", "{0} طالب في السحابة · {1} نشطون هذا الأسبوع · {2} مهمة محلولة", "{0} studenti nel cloud · {1} attivi questa settimana · {2} attività risolte"]],
  [/^(\d+) с прогрессом$/, ["{0} with progress", "{0} mit Fortschritt", "{0} avec progression", "{0} ilerlemeli", "{0} لديهم تقدم", "{0} con progresso"]],
  [/^(\d+) за 30 дней$/, ["{0} in 30 days", "{0} in 30 Tagen", "{0} sur 30 jours", "{0} 30 günde", "{0} خلال 30 يومًا", "{0} in 30 giorni"]],
  [/^в среднем (.+) на ученика$/, ["on average {0} per student", "im Durchschnitt {0} pro Schüler", "en moyenne {0} par élève", "ortalama öğrenci başına {0}", "بمتوسط {0} لكل طالب", "in media {0} per studente"]],
  [/^(\d+) заданий · (\d+) успешных$/, ["{0} tasks · {1} successful", "{0} Aufgaben · {1} erfolgreich", "{0} tâches · {1} réussies", "{0} görev · {1} başarılı", "{0} مهام · {1} ناجحة", "{0} attività · {1} riuscite"]],
  [/^лучший результат (.+)$/, ["best result {0}", "bestes Ergebnis {0}", "meilleur résultat {0}", "en iyi sonuç {0}", "أفضل نتيجة {0}", "miglior risultato {0}"]],
  [/^обновлено (.+) назад$/, ["updated {0} ago", "aktualisiert vor {0}", "actualisé il y a {0}", "{0} önce güncellendi", "تم التحديث قبل {0}", "aggiornato {0} fa"]],
  [/^(\d+) дн\.$/, ["{0} d", "{0} T", "{0} j", "{0} g", "{0} ي", "{0} g"]],
  [/^(\d+) попыток$/, ["{0} attempts", "{0} Versuche", "{0} tentatives", "{0} deneme", "{0} محاولات", "{0} tentativi"]],
  [/^(\d+) заданий$/, ["{0} tasks", "{0} Aufgaben", "{0} tâches", "{0} görev", "{0} مهام", "{0} attività"]],
  [/^(\d+) учеников$/, ["{0} students", "{0} Schüler", "{0} élèves", "{0} öğrenci", "{0} طلاب", "{0} studenti"]],
  [/^(\d+) дней назад$/, ["{0} days ago", "vor {0} Tagen", "il y a {0} jours", "{0} gün önce", "قبل {0} أيام", "{0} giorni fa"]],
  [/^(\d+) из 10$/, ["{0} of 10", "{0} von 10", "{0} sur 10", "{0} / 10", "{0} من 10", "{0} di 10"]],
  [/^успешно 80%\+ · (\d+)%$/, ["successful 80%+ · {0}%", "erfolgreich 80 %+ · {0} %", "réussi 80 %+ · {0} %", "başarılı %80+ · {0}%", "ناجح 80%+ · {0}%", "riuscito 80%+ · {0}%"]],
  [/^средне · (\d+)%$/, ["medium · {0}%", "mittel · {0} %", "moyen · {0} %", "orta · {0}%", "متوسط · {0}%", "medio · {0}%"]],
  [/^слабо <50% · (\d+)%$/, ["weak <50% · {0}%", "schwach <50 % · {0} %", "faible <50 % · {0} %", "zayıf <%50 · {0}%", "ضعيف <50% · {0}%", "debole <50% · {0}%"]],
  [/^(.+)% · (\d+) (попытки|попытка|попыток)$/, ["{0}% · {1} attempts", "{0} % · {1} Versuche", "{0} % · {1} tentatives", "{0}% · {1} deneme", "{0}% · {1} محاولات", "{0}% · {1} tentativi"]],
  [/^(\d+) слабых (тем|темы)$/, ["{0} weak topics", "{0} schwache Themen", "{0} points faibles", "{0} zayıf konu", "{0} مواضيع ضعيفة", "{0} argomenti deboli"]],
  [/^с нами с (.+)$/, ["since {0}", "seit {0}", "depuis {0}", "{0} beri", "منذ {0}", "dal {0}"]],
  [/^(\d+) (день|дня|дней) назад$/, ["{0} days ago", "vor {0} Tagen", "il y a {0} jours", "{0} gün önce", "قبل {0} أيام", "{0} giorni fa"]],
  [/^(\d+) заданий · (\d+) дн\.$/, ["{0} tasks · {1} d", "{0} Aufgaben · {1} T", "{0} tâches · {1} j", "{0} görev · {1} g", "{0} مهام · {1} ي", "{0} attività · {1} g"]],

  [/^UID (.+) · был\(а\) (.+)$/, ["UID {0} · last seen {1}", "UID {0} · zuletzt {1}", "UID {0} · vu(e) {1}", "UID {0} · son görülme {1}", "UID {0} · آخر ظهور {1}", "UID {0} · ultimo accesso {1}"]],
  [/^Лучший средний результат: (.+) · успешных заданий: (.+) из (.+) · ошибок к повтору: (.+)$/, ["Best average: {0} · successful tasks: {1} of {2} · mistakes to review: {3}", "Bester Durchschnitt: {0} · erfolgreiche Aufgaben: {1} von {2} · Fehler zum Wiederholen: {3}", "Meilleure moyenne : {0} · tâches réussies : {1} sur {2} · erreurs à revoir : {3}", "En iyi ortalama: {0} · başarılı görev: {1} / {2} · tekrar hataları: {3}", "أفضل متوسط: {0} · مهام ناجحة: {1} من {2} · أخطاء للمراجعة: {3}", "Migliore media: {0} · attività riuscite: {1} di {2} · errori da ripassare: {3}"]],
  [/^Достижения · (\d+) из 10$/, ["Achievements · {0} of 10", "Erfolge · {0} von 10", "Réussites · {0} sur 10", "Başarılar · {0} / 10", "الإنجازات · {0} من 10", "Successi · {0} di 10"]],
  [/^последние (\d+) результатов$/, ["latest {0} results", "letzte {0} Ergebnisse", "{0} derniers résultats", "son {0} sonuç", "آخر {0} نتائج", "ultimi {0} risultati"]],
  [/^(\d+) (неделю|недели|недель) назад$/, ["{0} weeks ago", "vor {0} Wochen", "il y a {0} semaines", "{0} hafta önce", "قبل {0} أسابيع", "{0} settimane fa"]],

];

function admFill(tpl, m) { return String(tpl || "").replace(/\{(\d)\}/g, (_, i) => m[+i + 1] ?? ""); }
function admTr(s) {
  if (ADM_LANG === "ru" || !/[\u0400-\u04FF]/.test(s)) return s;
  const li = ADM_LANG_IDX[ADM_LANG];
  const lead = (s.match(/^\s*/) || [""])[0], trail = (s.match(/\s*$/) || [""])[0];
  const core = s.trim();
  if (!core) return s;
  let out = null;
  const hit = ADM_I18N[core];
  if (hit) out = hit[li] || hit[0];
  if (out == null) {
    for (const [rx, tpl] of ADM_RULES) {
      const m = core.match(rx);
      if (m) {
        const mm = m.map((x, i) => (i ? admTr(String(x)) : x));
        out = admFill(tpl[li] || tpl[0], mm);
        break;
      }
    }
  }
  if (out == null && core.includes(" · ")) {
    const parts = core.split(" · ");
    const tr = parts.map(x => { const h = ADM_I18N[x.trim()]; return h ? (h[li] || h[0]) : x; });
    if (tr.some((x, i) => x !== parts[i])) out = tr.join(" · ");
  }
  return out == null ? s : lead + out + trail;
}

const ADM_T_REC = new WeakMap(), ADM_A_REC = new WeakMap();
const ADM_ATTRS = ["placeholder", "title", "aria-label"];
function admLangNode(node) {
  if (node.nodeType === 3) {
    let r = ADM_T_REC.get(node);
    if (r && node.nodeValue !== r.t) r = null;
    if (!r) {
      if (!/[\u0400-\u04FF]/.test(node.nodeValue)) { ADM_T_REC.delete(node); return; }
      r = { o: node.nodeValue, t: node.nodeValue };
      ADM_T_REC.set(node, r);
    }
    const v = admTr(r.o);
    r.t = v;
    if (node.nodeValue !== v) node.nodeValue = v;
    return;
  }
  if (node.nodeType !== 1) return;
  const tag = node.tagName;
  if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || node.classList.contains("adm-lang")) return;
  for (const a of ADM_ATTRS) {
    if (!node.hasAttribute(a)) continue;
    const cur = node.getAttribute(a);
    let rec = ADM_A_REC.get(node); if (!rec) { rec = {}; ADM_A_REC.set(node, rec); }
    let r = rec[a];
    if (r && cur !== r.t) r = null;
    if (!r) {
      if (!/[\u0400-\u04FF]/.test(cur)) { delete rec[a]; continue; }
      r = rec[a] = { o: cur, t: cur };
    }
    const v = admTr(r.o);
    r.t = v;
    if (cur !== v) node.setAttribute(a, v);
  }
  for (let c = node.firstChild; c; c = c.nextSibling) admLangNode(c);
}
let admLangObs = null;
function applyAdminLang(root) {
  document.documentElement.lang = ADM_LANG;
  document.documentElement.dir = ADM_LANG === "ar" ? "rtl" : "ltr";
  admLangNode(root || document.body);
}
function initAdminLangObserver() {
  if (admLangObs) return;
  admLangObs = new MutationObserver(muts => {
    admLangObs.disconnect();
    for (const m of muts) {
      if (m.type === "childList") m.addedNodes.forEach(admLangNode);
      else if (m.type === "characterData") admLangNode(m.target);
    }
    admLangObs.takeRecords();
    admLangObs.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  admLangObs.observe(document.body, { childList: true, subtree: true, characterData: true });
}
function setAdminLang(lang) {
  ADM_LANG = ADM_LANGS[lang] ? lang : "de";
  try { localStorage.setItem("dtb.adminLang", ADM_LANG); } catch {}
  document.querySelectorAll(".adm-lang").forEach(s => { s.value = ADM_LANG; });
  applyAdminLang(document.body);
}
applyAdminLang(document.body);
initAdminLangObserver();
