/* Admin cabinet UI translations (RU source, default RU). DOM-pass: exact strings + a few dynamic rules. */
const ADM_LANGS = { ru: "RU", en: "EN", de: "DE", fr: "FR", tr: "TR", ar: "AR", it: "IT", uk: "UK" };
const ADM_LANG_TITLE = { ru: "Русский", en: "English", de: "Deutsch", fr: "Français", tr: "Türkçe", ar: "العربية", it: "Italiano", uk: "Українська" };
const ADM_LANG_IDX = { en: 0, de: 1, fr: 2, tr: 3, ar: 4, it: 5, uk: 6 };
let ADM_LANG = (() => { try { return localStorage.getItem("dtb.adminLang") || "de"; } catch { return "de"; } })();
if (!ADM_LANGS[ADM_LANG]) ADM_LANG = "de";

const ADM_I18N = {
  "Пробный закончился": ["Trial ended", "Testphase vorbei", "Essai terminé", "Deneme bitti", "انتهت التجربة", "Prova terminata", "Пробний закінчився"],
  "Тренажёр закрыт до оплаты": ["Trainer closed until payment", "Trainer bis zur Zahlung gesperrt", "Entraîneur fermé jusqu'au paiement", "Ödemeye kadar kapalı", "المدرب مغلق حتى الدفع", "Trainer chiuso fino al pagamento", "Тренажер закритий до оплати"],
  "Срок истёк": ["Expired", "Abgelaufen", "Expiré", "Süresi doldu", "انتهت المدة", "Scaduto", "Термін минув"],
  "Пробный": ["Trial", "Test", "Essai", "Deneme", "تجربة", "Prova", "Пробний"],
  "до": ["until", "bis", "jusqu'au", "bitiş", "حتى", "fino al", "до"],
  "дн.": ["d.", "T.", "j.", "g.", "يوم", "g.", "дн."],
  "Подписка:": ["Subscription:", "Abo:", "Abonnement :", "Abonelik:", "الاشتراك:", "Abbonamento:", "Підписка:"],
  "бессрочно": ["unlimited", "unbefristet", "illimité", "süresiz", "غير محدود", "illimitato", "безстроково"],
  "Пробный период закончился": ["Trial period ended", "Testphase vorbei", "Période d'essai terminée", "Deneme süresi bitti", "انتهت الفترة التجريبية", "Periodo di prova terminato", "Пробний період закінчився"],
  "Подписка закончилась": ["Subscription ended", "Abo abgelaufen", "Abonnement terminé", "Abonelik bitti", "انتهى الاشتراك", "Abbonamento scaduto", "Підписка закінчилася"],
  "Пробный период до": ["Trial until", "Testphase bis", "Essai jusqu'au", "Deneme bitişi", "الفترة التجريبية حتى", "Prova fino al", "Пробний період до"],
  "Оплачено до": ["Paid until", "Bezahlt bis", "Payé jusqu'au", "Ödeme bitişi", "مدفوع حتى", "Pagato fino al", "Оплачено до"],
  "Тренажёр + ИИ": ["Trainer + AI", "Trainer + KI", "Entraîneur + IA", "Alıştırma + yapay zekâ", "المدرّب + الذكاء الاصطناعي", "Trainer + IA", "Тренажер + ШІ"],
  "Тренажёр": ["Trainer", "Trainer", "Entraîneur", "Alıştırma", "المدرّب", "Trainer", "Тренажер"],
  "осталось дней:": ["days left:", "Tage übrig:", "jours restants :", "kalan gün:", "الأيام المتبقية:", "giorni rimasti:", "залишилося днів:"],
  "+1 месяц · 5 €": ["+1 month · €5", "+1 Monat · 5 €", "+1 mois · 5 €", "+1 ay · 5 €", "+1 شهر · 5 €", "+1 mese · 5 €", "+1 місяць · 5 €"],
  "+1 месяц с ИИ · 10 €": ["+1 month with AI · €10", "+1 Monat mit KI · 10 €", "+1 mois avec IA · 10 €", "+1 ay yapay zekâlı · 10 €", "+1 شهر مع الذكاء الاصطناعي · 10 €", "+1 mese con IA · 10 €", "+1 місяць із ШІ · 10 €"],
  "Пробный 2 дня": ["2-day trial", "Test 2 Tage", "Essai 2 jours", "2 günlük deneme", "تجربة يومين", "Prova 2 giorni", "Пробний 2 дні"],
  "Пробный 3 дня": ["3-day trial", "Test 3 Tage", "Essai 3 jours", "3 günlük deneme", "تجربة 3 أيام", "Prova 3 giorni", "Пробний 3 дні"],
  "Бессрочно": ["Unlimited", "Unbefristet", "Illimité", "Süresiz", "غير محدود", "Illimitato", "Безстроково"],
  "Оплата месяца включает доступ сразу. Когда срок кончится, доступ закроется сам, а ученику придёт письмо.": ["A paid month opens access at once. When it ends, access closes by itself and the student gets an e-mail.", "Ein bezahlter Monat schaltet sofort frei. Danach wird der Zugang automatisch gesperrt und der Schüler bekommt eine E-Mail.", "Un mois payé ouvre l'accès tout de suite. À la fin, l'accès se ferme seul et l'élève reçoit un e-mail.", "Ödenen ay erişimi hemen açar. Süre bitince erişim kendiliğinden kapanır ve öğrenciye e-posta gider.", "الشهر المدفوع يفتح الوصول فورًا. عند انتهائه يُغلق الوصول تلقائيًا ويتلقى الطالب رسالة.", "Un mese pagato apre subito l'accesso. Alla scadenza l'accesso si chiude da solo e lo studente riceve un'e-mail.", "Оплата місяця вмикає доступ одразу. Коли термін закінчиться, доступ закриється сам, а учневі прийде лист."],
  "E-mail и пароль для входа": ["Sign-in e-mail and password", "Anmelde-E-Mail und Kennwort", "E-mail et mot de passe de connexion", "Giriş e-postası ve şifresi", "بريد وكلمة مرور الدخول", "E-mail e password di accesso", "E-mail і пароль для входу"],
  "Если ученик (или вы сами) не может войти: укажите e-mail и новый пароль, письмо не нужно.": ["If a student (or you) cannot sign in: set the e-mail and a new password, no letter needed.", "Wenn sich jemand (auch Sie selbst) nicht anmelden kann: E-Mail und neues Kennwort festlegen, keine E-Mail nötig.", "Si un élève (ou vous) ne peut pas se connecter : indiquez l'e-mail et un nouveau mot de passe, aucun courriel nécessaire.", "Bir öğrenci (veya siz) giriş yapamıyorsa: e-postayı ve yeni şifreyi girin, e-posta gerekmez.", "إذا لم يستطع طالب (أو أنت) الدخول: حدّد البريد وكلمة مرور جديدة، دون حاجة لرسالة.", "Se uno studente (o tu) non riesce ad accedere: imposta e-mail e nuova password, nessuna e-mail necessaria.", "Якщо учень (або ви самі) не може увійти: вкажіть e-mail і новий пароль, лист не потрібен."],
  "Привязать e-mail для входа": ["Attach sign-in e-mail", "Anmelde-E-Mail verknüpfen", "Associer l'e-mail de connexion", "Giriş e-postası bağla", "ربط بريد الدخول", "Collega e-mail di accesso", "Прив'язати e-mail для входу"],
  "Если ученик (или вы сами) не может войти по e-mail: привяжите адрес, потом на сайте «Забыли пароль?».": ["If a student (or you) cannot sign in by e-mail: attach the address, then use “Forgot password?” on the site.", "Wenn sich jemand (auch Sie selbst) nicht per E-Mail anmelden kann: Adresse verknüpfen, dann auf der Seite „Kennwort vergessen?“.", "Si un élève (ou vous) ne peut pas se connecter par e-mail : associez l'adresse, puis « Mot de passe oublié ? » sur le site.", "Bir öğrenci (veya siz) e-postayla giremiyorsa: adresi bağlayın, sonra sitede “Şifreyi mi unuttunuz?”.", "إذا لم يستطع طالب (أو أنت) الدخول بالبريد: اربط العنوان ثم استخدم «نسيت كلمة المرور؟» في الموقع.", "Se uno studente (o tu) non riesce ad accedere via e-mail: collega l'indirizzo, poi «Password dimenticata?» sul sito.", "Якщо учень (або ви самі) не може увійти за e-mail: прив'яжіть адресу, потім на сайті «Забули пароль?»."],
  "Общая группа": ["Open group", "Offene Gruppe", "Groupe ouvert", "Açık grup", "المجموعة العامة", "Gruppo aperto", "Загальна група"],
  "без учителя": ["no teacher", "ohne Lehrkraft", "sans enseignant", "öğretmensiz", "بدون معلم", "senza insegnante", "без викладача"],
  "Кабинет администратора": ["Administrator's office", "Administratorbereich", "Espace administrateur", "Yönetici paneli", "مكتب المسؤول", "Area amministratore", "Кабінет адміністратора"],
  "Вход · Кабинет администратора": ["Login · Administrator's office", "Login · Administratorbereich", "Connexion · Espace administrateur", "Giriş · Yönetici paneli", "الدخول · مكتب المسؤول", "Accesso · Area amministratore", "Вхід · Кабінет адміністратора"],
  "Кабинет администратора · DTB B2 Beruf": ["Administrator's office · DTB B2 Beruf", "Administratorbereich · DTB B2 Beruf", "Espace administrateur · DTB B2 Beruf", "Yönetici paneli · DTB B2 Beruf", "مكتب المسؤول · DTB B2 Beruf", "Area amministratore · DTB B2 Beruf", "Кабінет адміністратора · DTB B2 Beruf"],
  "Пароль администратора": ["Administrator password", "Administratorpasswort", "Mot de passe administrateur", "Yönetici şifresi", "كلمة مرور المسؤول", "Password amministratore", "Пароль адміністратора"],
  "Нет доступа": ["No access", "Kein Zugang", "Pas d'accès", "Erişim yok", "لا وصول", "Nessun accesso", "Немає доступу"],
  "Заблокировать": ["Block", "Sperren", "Bloquer", "Engelle", "حظر", "Blocca", "Заблокувати"],
  "Перенести в группу…": ["Move to group…", "In Gruppe verschieben…", "Déplacer vers le groupe…", "Gruba taşı…", "نقل إلى مجموعة…", "Sposta nel gruppo…", "Перенести в групу…"],
  "Перенести в группу": ["Move to group", "In Gruppe verschieben", "Déplacer vers le groupe", "Gruba taşı", "نقل إلى مجموعة", "Sposta nel gruppo", "Перенести в групу"],
  "Кабинет преподавателя": ["Teacher's office", "Lehrerkabinett", "Espace enseignant", "Öğretmen paneli", "مكتب المعلم", "Area docente", "Кабінет викладача"],
  "Прогресс учеников DTB B2 Beruf: дни занятий, решённые задания, ошибки и достижения — в одном месте.": ["Student progress for DTB B2 Beruf: study days, solved tasks, mistakes and achievements — all in one place.", "Schülerfortschritt DTB B2 Beruf: Lerntage, gelöste Aufgaben, Fehler und Erfolge — alles an einem Ort.", "Progression DTB B2 Beruf : jours d'étude, tâches résolues, erreurs et réussites — au même endroit.", "DTB B2 Beruf öğrenci ilerlemesi: çalışma günleri, çözülen görevler, hatalar ve başarılar — tek yerde.", "تقدم طلاب DTB B2 Beruf: أيام الدراسة والمهام المحلولة والأخطاء والإنجازات — في مكان واحد.", "Progresso studenti DTB B2 Beruf: giorni di studio, attività risolte, errori e successi — in un posto.", "Прогрес учнів DTB B2 Beruf: дні занять, розв'язані завдання, помилки й досягнення — в одному місці."],
  "Вход · Кабинет преподавателя": ["Login · Teacher's office", "Login · Lehrerkabinett", "Connexion · Espace enseignant", "Giriş · Öğretmen paneli", "الدخول · مكتب المعلم", "Accesso · Area docente", "Вхід · Кабінет викладача"],
  "Кабинет преподавателя · DTB B2 Beruf": ["Teacher's office · DTB B2 Beruf", "Lehrerkabinett · DTB B2 Beruf", "Espace enseignant · DTB B2 Beruf", "Öğretmen paneli · DTB B2 Beruf", "مكتب المعلم · DTB B2 Beruf", "Area docente · DTB B2 Beruf", "Кабінет викладача · DTB B2 Beruf"],
  "DTB B2 Beruf · прогресс учеников": ["DTB B2 Beruf · student progress", "DTB B2 Beruf · Schülerfortschritt", "DTB B2 Beruf · progression", "DTB B2 Beruf · öğrenci ilerlemesi", "DTB B2 Beruf · تقدم الطلاب", "DTB B2 Beruf · progresso", "DTB B2 Beruf · прогрес учнів"],
  "Пароль": ["Password", "Passwort", "Mot de passe", "Şifre", "كلمة المرور", "Password", "Пароль"],
  "Пароль преподавателя": ["Teacher password", "Lehrerpasswort", "Mot de passe enseignant", "Öğretmen şifresi", "كلمة مرور المعلم", "Password docente", "Пароль викладача"],
  "Проверяем…": ["Checking…", "Prüfe…", "Vérification…", "Kontrol ediliyor…", "جارٍ التحقق…", "Verifica…", "Перевіряємо…"],
  "Войти": ["Log in", "Anmelden", "Connexion", "Giriş", "تسجيل الدخول", "Accedi", "Увійти"],
  "Введите пароль.": ["Enter the password.", "Passwort eingeben.", "Saisissez le mot de passe.", "Şifre girin.", "أدخل كلمة المرور.", "Inserisci la password.", "Введіть пароль."],
  "Пароль проверяется на сервере, в браузере он не сохраняется. Сессия живёт 8 часов.": ["The password is checked on the server and is not stored in the browser. Session lasts 8 hours.", "Das Passwort wird auf dem Server geprüft und nicht im Browser gespeichert. Sitzung: 8 Stunden.", "Le mot de passe est vérifié sur le serveur et n'est pas stocké dans le navigateur. Session de 8 heures.", "Şifre sunucuda kontrol edilir, tarayıcıda saklanmaz. Oturum 8 saat.", "تُتحقق كلمة المرور على الخادم ولا تُحفظ في المتصفح. الجلسة 8 ساعات.", "La password è verificata sul server e non salvata nel browser. Sessione 8 ore.", "Пароль перевіряється на сервері, у браузері він не зберігається. Сесія триває 8 годин."],
  "Данные читаются из Firebase. Доступ только по паролю.": ["Data is read from Firebase. Password required.", "Daten kommen aus Firebase. Nur mit Passwort.", "Données lues depuis Firebase. Accès par mot de passe.", "Veriler Firebase'den okunur. Şifre gerekli.", "تُقرأ البيانات من Firebase. الوصول بكلمة مرور.", "Dati da Firebase. Accesso con password.", "Дані читаються з Firebase. Доступ лише за паролем."],
  "ADMIN_PASSWORD не задан на сервере. На Vercel добавьте переменную окружения": ["ADMIN_PASSWORD is not set on the server. On Vercel add an environment variable", "ADMIN_PASSWORD ist auf dem Server nicht gesetzt. Fügen Sie in Vercel eine Umgebungsvariable hinzu", "ADMIN_PASSWORD n'est pas défini sur le serveur. Ajoutez une variable d'environnement sur Vercel", "ADMIN_PASSWORD sunucuda ayarlı değil. Vercel'de ortam değişkeni ekleyin", "ADMIN_PASSWORD غير معيّن على الخادم. أضف متغير بيئة في Vercel", "ADMIN_PASSWORD non impostata sul server. Aggiungi una variabile su Vercel", "ADMIN_PASSWORD не задано на сервері. На Vercel додайте змінну оточення"],
  "и сделайте Redeploy. При локальном запуске пароль печатается в консоли.": ["and redeploy. On a local run the password is printed in the console.", "und führen Sie ein Redeploy aus. Lokal wird das Passwort in der Konsole ausgegeben.", "et redéployez. En local, le mot de passe est affiché dans la console.", "ve yeniden dağıtın. Yerelde şifre konsola yazılır.", "وأعد النشر. محليًا تُطبع كلمة المرور في الطرفية.", "e ridistribuisci. In locale la password è stampata in console.", "і зробіть Redeploy. Під час локального запуску пароль друкується в консолі."],
  "На сервере не задан ADMIN_PASSWORD. Добавьте переменную окружения и перезапустите.": ["ADMIN_PASSWORD is not set on the server. Add the environment variable and restart.", "ADMIN_PASSWORD ist auf dem Server nicht gesetzt. Variable hinzufügen und neu starten.", "ADMIN_PASSWORD n'est pas défini. Ajoutez la variable et redémarrez.", "ADMIN_PASSWORD ayarlı değil. Değişkeni ekleyip yeniden başlatın.", "ADMIN_PASSWORD غير معيّن. أضف المتغير وأعد التشغيل.", "ADMIN_PASSWORD non impostata. Aggiungi la variabile e riavvia.", "На сервері не задано ADMIN_PASSWORD. Додайте змінну оточення й перезапустіть."],
  "Не удалось войти.": ["Could not log in.", "Anmeldung fehlgeschlagen.", "Connexion impossible.", "Giriş yapılamadı.", "تعذر تسجيل الدخول.", "Accesso non riuscito.", "Не вдалося увійти."],
  "Загружаем прогресс учеников…": ["Loading student progress…", "Schülerfortschritt wird geladen…", "Chargement de la progression…", "Öğrenci ilerlemesi yükleniyor…", "جارٍ تحميل تقدم الطلاب…", "Caricamento progressi…", "Завантажуємо прогрес учнів…"],
  "Сервер не отвечает. Запущен ли npm start?": ["Server is not responding. Is npm start running?", "Server antwortet nicht. Läuft npm start?", "Le serveur ne répond pas. npm start est-il lancé ?", "Sunucu yanıt vermiyor. npm start çalışıyor mu?", "الخادم لا يستجيب. هل npm start يعمل؟", "Il server non risponde. npm start è attivo?", "Сервер не відповідає. Чи запущено npm start?"],
  "Ошибка подключения.": ["Connection error.", "Verbindungsfehler.", "Erreur de connexion.", "Bağlantı hatası.", "خطأ في الاتصال.", "Errore di connessione.", "Помилка підключення."],
  "НЕ НАСТРОЕНО": ["NOT CONFIGURED", "NICHT KONFIGURIERT", "NON CONFIGURÉ", "YAPILANDIRILMADI", "غير مُهيأ", "NON CONFIGURATO", "НЕ НАЛАШТОВАНО"],
  "ТЕСТОВЫЕ ДАННЫЕ": ["TEST DATA", "TESTDATEN", "DONNÉES TEST", "TEST VERİSİ", "بيانات اختبار", "DATI TEST", "ТЕСТОВІ ДАНІ"],
  "Обновить данные": ["Refresh data", "Daten aktualisieren", "Actualiser les données", "Verileri yenile", "تحديث البيانات", "Aggiorna dati", "Оновити дані"],
  "Выйти": ["Log out", "Abmelden", "Déconnexion", "Çıkış", "تسجيل الخروج", "Esci", "Вийти"],
  "обновлено только что": ["updated just now", "gerade aktualisiert", "à l'instant", "az önce güncellendi", "تم التحديث الآن", "appena aggiornato", "оновлено щойно"],
  "обновлено": ["updated", "aktualisiert", "actualisé", "güncellendi", "تم التحديث", "aggiornato", "оновлено"],
  "минуту": ["minute", "Minute", "minute", "dakika", "دقيقة", "minuto", "хвилину"],
  "минуты": ["minutes", "Minuten", "minutes", "dakika", "دقائق", "minuti", "хвилини"],
  "минут": ["minutes", "Minuten", "minutes", "dakika", "دقائق", "minuti", "хвилин"],
  "Прогресс учеников": ["Student progress", "Schülerfortschritt", "Progression des élèves", "Öğrenci ilerlemesi", "تقدم الطلاب", "Progresso studenti", "Прогрес учнів"],
  " в облаке · ": [" in the cloud · ", " in der Cloud · ", " dans le cloud · ", " bulutta · ", " في السحابة · ", " nel cloud · ", " у хмарі · "],
  " активны за неделю · ": [" active this week · ", " diese Woche aktiv · ", " actifs cette semaine · ", " bu hafta aktif · ", " نشطون هذا الأسبوع · ", " attivi questa settimana · ", " активні за тиждень · "],
  " заданий решено": [" tasks solved", " Aufgaben gelöst", " tâches résolues", " görev çözüldü", " مهام تم حلها", " attività risolte", " завдань розв'язано"],
  "Здесь появятся ученики, которые сохраняют прогресс в облаке.": ["Students who save progress in the cloud will appear here.", "Hier erscheinen Schüler, die ihren Fortschritt in der Cloud speichern.", "Les élèves qui enregistrent leur progression dans le cloud apparaîtront ici.", "İlerlemesini buluta kaydeden öğrenciler burada görünecek.", "سيظهر هنا الطلاب الذين يحفظون تقدمهم في السحابة.", "Qui appariranno gli studenti che salvano i progressi nel cloud.", "Тут з'являться учні, які зберігають прогрес у хмарі."],
  "Обновить": ["Refresh", "Aktualisieren", "Actualiser", "Yenile", "تحديث", "Aggiorna", "Оновити"],
  "Не удалось обновить": ["Could not update", "Aktualisierung fehlgeschlagen", "Échec de la mise à jour", "Güncellenemedi", "تعذر التحديث", "Aggiornamento non riuscito", "Не вдалося оновити"],
  "Повторить": ["Retry", "Wiederholen", "Réessayer", "Tekrar dene", "إعادة المحاولة", "Riprova", "Повторити"],
  "Ученики": ["Students", "Schüler", "Élèves", "Öğrenciler", "الطلاب", "Studenti", "Учні"],
  " с прогрессом": [" with progress", " mit Fortschritt", " avec progression", " ilerlemeli", " لديهم تقدم", " con progresso", " з прогресом"],
  "Активны 7 дней": ["Active 7 days", "Aktiv 7 Tage", "Actifs 7 jours", "7 gün aktif", "نشطون 7 أيام", "Attivi 7 giorni", "Активні 7 днів"],
  " за 30 дней": [" in 30 days", " in 30 Tagen", " sur 30 jours", " 30 günde", " خلال 30 يومًا", " in 30 giorni", " за 30 днів"],
  "Дней занятий": ["Days studied", "Lerntage", "Jours d'étude", "Çalışma günleri", "أيام الدراسة", "Giorni di studio", "Днів занять"],
  "в среднем": ["on average", "im Durchschnitt", "en moyenne", "ortalama", "بمتوسط", "in media", "у середньому"],
  " на ученика": [" per student", " pro Schüler", " par élève", " öğrenci başına", " لكل طالب", " per studente", " на учня"],
  "пока нет данных": ["no data yet", "noch keine Daten", "pas encore de données", "henüz veri yok", "لا بيانات بعد", "nessun dato", "поки немає даних"],
  "Попыток решения": ["Attempts", "Versuche", "Tentatives", "Denemeler", "المحاولات", "Tentativi", "Спроб розв'язання"],
  " заданий · ": [" tasks · ", " Aufgaben · ", " tâches · ", " görev · ", " مهام · ", " attività · ", " завдань · "],
  " успешных": [" successful", " erfolgreich", " réussies", " başarılı", " ناجحة", " riuscite", " успішних"],
  "Средний успех": ["Average success", "Durchschnitt", "Réussite moyenne", "Ortalama başarı", "متوسط النجاح", "Successo medio", "Середній успіх"],
  "лучший результат": ["best result", "bestes Ergebnis", "meilleur résultat", "en iyi sonuç", "أفضل نتيجة", "miglior risultato", "найкращий результат"],
  "Ошибки к повтору": ["Mistakes to review", "Fehler zum Wiederholen", "Erreurs à revoir", "Tekrar hataları", "أخطاء للمراجعة", "Errori da ripassare", "Помилки до повторення"],
  "слабая тема": ["weak topic", "schwaches Thema", "point faible", "zayıf konu", "موضوع ضعيف", "punto debole", "слабка тема"],
  "слабых": ["weak", "schwache", "faibles", "zayıf", "ضعيفة", "deboli", "слабких"],
  "тема": ["topic", "Thema", "thème", "konu", "موضوع", "argomento", "тема"],
  "темы": ["topics", "Themen", "thèmes", "konular", "مواضيع", "argomenti", "теми"],
  "тем": ["topics", "Themen", "thèmes", "konular", "مواضيع", "argomenti", "тем"],
  "Как только первый ученик сохранит прогресс в облаке, здесь появятся графики и таблица.": ["As soon as the first student saves progress in the cloud, charts and the table will appear here.", "Sobald der erste Schüler Fortschritt in der Cloud speichert, erscheinen hier Diagramme und Tabelle.", "Dès que le premier élève enregistre sa progression, les graphiques et le tableau apparaîtront.", "İlk öğrenci ilerlemesini buluta kaydedince grafikler ve tablo burada görünecek.", "عندما يحفظ أول طالب تقدمه في السحابة، ستظهر الرسوم والجدول هنا.", "Quando il primo studente salva i progressi, qui appariranno grafici e tabella.", "Щойно перший учень збереже прогрес у хмарі, тут з'являться графіки й таблиця."],
  "Активность": ["Activity", "Aktivität", "Activité", "Etkinlik", "النشاط", "Attività", "Активність"],
  "Сколько заданий решают ученики каждый день": ["Tasks solved per day", "Aufgaben pro Tag", "Tâches par jour", "Günlük görev", "المهام يوميًا", "Attività al giorno", "Скільки завдань розв'язують учні щодня"],
  "Период": ["Period", "Zeitraum", "Période", "Dönem", "الفترة", "Periodo", "Період"],
  " дн.": [" d", " T", " j", " g", " ي", " g", " дн."],
  "ученики": ["students", "Schüler", "élèves", "öğrenciler", "طلاب", "studenti", "учні"],
  "Уровни учеников": ["Student levels", "Schülerniveaus", "Niveaux des élèves", "Öğrenci seviyeleri", "مستويات الطلاب", "Livelli studenti", "Рівні учнів"],
  "По среднему результату": ["By average result", "Nach Durchschnitt", "Selon la moyenne", "Ortalamaya göre", "حسب المتوسط", "Per media", "За середнім результатом"],
  "средний успех": ["average success", "Durchschnitt", "réussite moyenne", "ortalama başarı", "متوسط النجاح", "successo medio", "середній успіх"],
  "Задания по результату": ["Tasks by result", "Aufgaben nach Ergebnis", "Tâches par résultat", "Sonuca göre görevler", "المهام حسب النتيجة", "Attività per risultato", "Завдання за результатом"],
  "заданий": ["tasks", "Aufgaben", "tâches", "görev", "مهام", "attività", "завдань"],
  "успешно 80%+ · ": ["successful 80%+ · ", "erfolgreich 80 %+ · ", "réussi 80 %+ · ", "başarılı %80+ · ", "ناجح 80%+ · ", "riuscito 80%+ · ", "успішно 80%+ · "],
  "средне · ": ["medium · ", "mittel · ", "moyen · ", "orta · ", "متوسط · ", "medio · ", "середньо · "],
  "слабо <50% · ": ["weak <50% · ", "schwach <50 % · ", "faible <50 % · ", "zayıf <%50 · ", "ضعيف <50% · ", "debole <50% · ", "слабко <50% · "],
  "нет данных": ["no data", "keine Daten", "pas de données", "veri yok", "لا بيانات", "nessun dato", "немає даних"],
  "По частям экзамена": ["By exam part", "Nach Prüfungsteilen", "Par partie d'examen", "Sınav bölümlerine göre", "حسب أجزاء الامتحان", "Per parte d'esame", "За частинами іспиту"],
  "Средний результат по всем ученикам": ["Average across all students", "Durchschnitt aller Schüler", "Moyenne de tous les élèves", "Tüm öğrencilerin ortalaması", "متوسط جميع الطلاب", "Media di tutti gli studenti", "Середній результат по всіх учнях"],
  "Слабые места": ["Weak spots", "Schwache Stellen", "Points faibles", "Zayıf noktalar", "نقاط الضعف", "Punti deboli", "Слабкі місця"],
  "Части с наибольшим числом ошибок": ["Parts with most mistakes", "Teile mit den meisten Fehlern", "Parties avec le plus d'erreurs", "En çok hatalı bölümler", "الأجزاء الأكثر أخطاء", "Parti con più errori", "Частини з найбільшою кількістю помилок"],
  "Лидеры": ["Leaders", "Spitzenreiter", "Leaders", "Liderler", "المتصدرون", "Leader", "Лідери"],
  "Лучший средний результат": ["Best average result", "Bester Durchschnitt", "Meilleure moyenne", "En iyi ortalama", "أفضل متوسط", "Migliore media", "Найкращий середній результат"],
  "нажмите на строку, чтобы открыть профиль": ["click a row to open the profile", "Zeile anklicken, um das Profil zu öffnen", "cliquez sur une ligne pour ouvrir le profil", "profili açmak için satıra tıklayın", "انقر على صف لفتح الملف", "clicca una riga per aprire il profilo", "натисніть на рядок, щоб відкрити профіль"],
  "Имя, фамилия или UID": ["Name, surname or UID", "Name, Nachname oder UID", "Nom, prénom ou UID", "Ad, soyad veya UID", "الاسم أو اللقب أو UID", "Nome, cognome o UID", "Ім'я, прізвище або UID"],
  "Поиск ученика": ["Search student", "Schüler suchen", "Rechercher un élève", "Öğrenci ara", "ابحث عن طالب", "Cerca studente", "Пошук учня"],
  "Фильтр": ["Filter", "Filter", "Filtre", "Filtre", "فلتر", "Filtro", "Фільтр"],
  "Все": ["All", "Alle", "Tous", "Tümü", "الكل", "Tutti", "Усі"],
  "Активные": ["Active", "Aktiv", "Actifs", "Aktif", "النشطون", "Attivi", "Активні"],
  "Нужна помощь": ["Need help", "Hilfe nötig", "Besoin d'aide", "Yardım gerekli", "يحتاج مساعدة", "Serve aiuto", "Потрібна допомога"],
  "Не заходили": ["Inactive", "Inaktiv", "Inactifs", "Girmeyenler", "غير نشطين", "Inattivi", "Не заходили"],
  "Сортировка": ["Sort", "Sortierung", "Tri", "Sıralama", "الترتيب", "Ordina", "Сортування"],
  "Сначала сильные": ["Strongest first", "Stärkste zuerst", "Les plus forts d'abord", "En güçlü önce", "الأقوى أولاً", "Prima i più forti", "Спочатку сильні"],
  "Недавно активные": ["Recently active", "Zuletzt aktiv", "Récents", "Son aktif", "النشطون حديثًا", "Recenti", "Нещодавно активні"],
  "Больше ошибок": ["Most mistakes", "Meiste Fehler", "Plus d'erreurs", "En çok hata", "الأكثر أخطاء", "Più errori", "Більше помилок"],
  "Больше дней": ["Most days", "Meiste Tage", "Plus de jours", "En çok gün", "الأكثر أيامًا", "Più giorni", "Більше днів"],
  "Больше заданий": ["Most tasks", "Meiste Aufgaben", "Plus de tâches", "En çok görev", "الأكثر مهامًا", "Più attività", "Більше завдань"],
  "По имени": ["By name", "Nach Name", "Par nom", "Ada göre", "حسب الاسم", "Per nome", "За ім'ям"],
  "Показаны только имя, прогресс и активность. Дата рождения, адрес и другие поля анкеты не читаются.": ["Only name, progress and activity are shown. Date of birth, address and other profile fields are not read.", "Nur Name, Fortschritt und Aktivität. Geburtsdatum, Adresse und andere Felder werden nicht gelesen.", "Seuls le nom, la progression et l'activité sont affichés. Les autres champs ne sont pas lus.", "Yalnızca ad, ilerleme ve etkinlik gösterilir. Diğer alanlar okunmaz.", "يُعرض الاسم والتقدم والنشاط فقط. لا تُقرأ الحقول الأخرى.", "Solo nome, progresso e attività. Gli altri campi non vengono letti.", "Показано лише ім'я, прогрес і активність. Дата народження, адреса й інші поля анкети не читаються."],
  "Пока нет учеников в облаке": ["No students in the cloud yet", "Noch keine Schüler in der Cloud", "Aucun élève dans le cloud", "Bulutta henüz öğrenci yok", "لا طلاب في السحابة بعد", "Nessuno studente nel cloud", "Поки немає учнів у хмарі"],
  "Ученик появляется здесь после того, как заполнит анкету и придумает пароль — тогда его прогресс сохраняется в Firebase и виден преподавателю.": ["A student appears here after filling in the profile and setting a password — then progress is saved in Firebase and visible to the teacher.", "Ein Schüler erscheint hier, nachdem er das Profil ausgefüllt und ein Passwort gesetzt hat — dann wird der Fortschritt in Firebase gespeichert.", "Un élève apparaît ici après avoir rempli le profil et choisi un mot de passe — sa progression est alors enregistrée dans Firebase.", "Öğrenci profili doldurup şifre belirledikten sonra burada görünür — ilerleme Firebase'e kaydedilir.", "يظهر الطالب هنا بعد ملء الملف وتعيين كلمة مرور — ثم يُحفظ التقدم في Firebase.", "Uno studente appare qui dopo aver compilato il profilo e scelto una password — il progresso viene salvato in Firebase.", "Учень з'являється тут після того, як заповнить анкету й придумає пароль — тоді його прогрес зберігається у Firebase і видимий викладачеві."],
  "Попросите учеников открыть «Данные участника» (иконка 👤 в шапке тренажёра) и указать пароль от 6 символов. Без пароля прогресс остаётся только в браузере ученика.": ["Ask students to open “Participant data” (👤 icon in the trainer header) and set a password of 6+ characters. Without a password progress stays only in the student's browser.", "Bitten Sie die Schüler, „Teilnehmerdaten“ (👤 im Kopf des Trainers) zu öffnen und ein Passwort ab 6 Zeichen zu setzen. Ohne Passwort bleibt der Fortschritt nur im Browser.", "Demandez aux élèves d'ouvrir « Données du participant » (icône 👤) et de définir un mot de passe de 6 caractères. Sans mot de passe, la progression reste dans le navigateur.", "Öğrencilerden “Katılımcı bilgileri” (👤) bölümünü açıp 6+ karakterlik şifre belirlemesini isteyin. Şifresiz ilerleme tarayıcıda kalır.", "اطلب من الطلاب فتح «بيانات المشارك» (أيقونة 👤) وتعيين كلمة مرور من 6 أحرف. بدونها يبقى التقدم في المتصفح.", "Chiedi agli studenti di aprire «Dati partecipante» (icona 👤) e impostare una password di 6+ caratteri. Senza password i progressi restano nel browser.", "Попросіть учнів відкрити «Дані учасника» (іконка 👤 у шапці тренажера) і вказати пароль від 6 символів. Без пароля прогрес залишається лише в браузері учня."],
  "Проверить снова": ["Check again", "Erneut prüfen", "Vérifier à nouveau", "Tekrar kontrol et", "تحقق مرة أخرى", "Controlla di nuovo", "Перевірити знову"],
  "Никого не нашли. Измените запрос или фильтр.": ["No matches. Change the query or filter.", "Keine Treffer. Suche oder Filter ändern.", "Aucun résultat. Modifiez la recherche ou le filtre.", "Eşleşme yok. Aramayı veya filtreyi değiştirin.", "لا نتائج. غيّر البحث أو الفلتر.", "Nessun risultato. Cambia ricerca o filtro.", "Нікого не знайшли. Змініть запит або фільтр."],
  "Пока нет учеников.": ["No students yet.", "Noch keine Schüler.", "Aucun élève.", "Henüz öğrenci yok.", "لا طلاب بعد.", "Nessuno studente.", "Поки немає учнів."],
  "Ученик": ["Student", "Schüler", "Élève", "Öğrenci", "طالب", "Studente", "Учень"],
  "Дней": ["Days", "Tage", "Jours", "Gün", "أيام", "Giorni", "Днів"],
  "Попыток / заданий": ["Attempts / tasks", "Versuche / Aufgaben", "Tentatives / tâches", "Denemeler / görevler", "المحاولات / المهام", "Tentativi / attività", "Спроб / завдань"],
  "Успех": ["Success", "Erfolg", "Réussite", "Başarı", "النجاح", "Successo", "Успіх"],
  "Ошибки": ["Mistakes", "Fehler", "Erreurs", "Hatalar", "الأخطاء", "Errori", "Помилки"],
  "Был(а)": ["Last seen", "Zuletzt", "Vu(e)", "Son görülme", "آخر ظهور", "Ultimo accesso", "Був(ла)"],
  "Открыть профиль": ["Open profile", "Profil öffnen", "Ouvrir le profil", "Profili aç", "افتح الملف", "Apri profilo", "Відкрити профіль"],
  "дней:": ["days:", "Tage:", "jours :", "gün:", "أيام:", "giorni:", "днів:"],
  "попыток:": ["attempts:", "Versuche:", "tentatives :", "deneme:", "محاولات:", "tentativi:", "спроб:"],
  "ошибок:": ["mistakes:", "Fehler:", "erreurs :", "hata:", "أخطاء:", "errori:", "помилок:"],
  "Пока нет результатов.": ["No results yet.", "Noch keine Ergebnisse.", "Pas encore de résultats.", "Henüz sonuç yok.", "لا نتائج بعد.", "Nessun risultato.", "Поки немає результатів."],
  "Осталось подключить Firebase": ["Firebase setup remaining", "Firebase einrichten", "Configurer Firebase", "Firebase kurulumu", "إعداد Firebase", "Configura Firebase", "Залишилося підключити Firebase"],
  "Кабинет уже работает, но серверу нужен ключ доступа к Firestore. Это делается один раз.": ["The cabinet works, but the server needs a Firestore key. This is done once.", "Das Kabinett läuft, aber der Server braucht einen Firestore-Schlüssel. Einmalig.", "L'espace fonctionne, mais le serveur a besoin d'une clé Firestore. Une fois.", "Panel çalışıyor, ancak sunucu Firestore anahtarı istiyor. Bir kez.", "اللوحة تعمل، لكن الخادم يحتاج مفتاح Firestore. مرة واحدة.", "Funziona, ma il server richiede una chiave Firestore. Una volta.", "Кабінет уже працює, але серверу потрібен ключ доступу до Firestore. Це робиться один раз."],
  "Не удалось загрузить данные": ["Could not load data", "Daten konnten nicht geladen werden", "Impossible de charger les données", "Veriler yüklenemedi", "تعذر تحميل البيانات", "Impossibile caricare i dati", "Не вдалося завантажити дані"],
  "Неизвестная ошибка": ["Unknown error", "Unbekannter Fehler", "Erreur inconnue", "Bilinmeyen hata", "خطأ غير معروف", "Errore sconosciuto", "Невідома помилка"],
  "Что нужно сделать": ["What to do", "Was zu tun ist", "À faire", "Yapılacaklar", "ما يجب فعله", "Cosa fare", "Що потрібно зробити"],
  "Профиль ученика": ["Student profile", "Schülerprofil", "Profil élève", "Öğrenci profili", "ملف الطالب", "Profilo studente", "Профіль учня"],
  "Закрыть": ["Close", "Schließen", "Fermer", "Kapat", "إغلاق", "Chiudi", "Закрити"],
  "Закрыть профиль": ["Close profile", "Profil schließen", "Fermer le profil", "Profili kapat", "إغلاق الملف", "Chiudi profilo", "Закрити профіль"],
  "был(а)": ["last seen", "zuletzt", "vu(e)", "son görülme", "آخر ظهور", "ultimo accesso", "був(ла)"],
  "нет активности": ["no activity", "keine Aktivität", "aucune activité", "etkinlik yok", "لا نشاط", "nessuna attività", "немає активності"],
  "дней занятий": ["days studied", "Lerntage", "jours d'étude", "çalışma günleri", "أيام الدراسة", "giorni di studio", "днів занять"],
  "попыток": ["attempts", "Versuche", "tentatives", "deneme", "محاولات", "tentativi", "спроб"],
  "ошибок": ["mistakes", "Fehler", "erreurs", "hata", "أخطاء", "errori", "помилок"],
  "лучшая серия": ["best streak", "beste Serie", "meilleure série", "en iyi seri", "أفضل سلسلة", "migliore serie", "найкраща серія"],
  "Лучший средний результат:": ["Best average result:", "Bester Durchschnitt:", "Meilleure moyenne :", "En iyi ortalama:", "أفضل متوسط:", "Migliore media:", "Найкращий середній результат:"],
  " · успешных заданий: ": [" · successful tasks: ", " · erfolgreiche Aufgaben: ", " · tâches réussies : ", " · başarılı görev: ", " · مهام ناجحة: ", " · attività riuscite: ", " · успішних завдань: "],
  " · ошибок к повтору: ": [" · mistakes to review: ", " · Fehler zum Wiederholen: ", " · erreurs à revoir : ", " · tekrar hataları: ", " · أخطاء للمراجعة: ", " · errori da ripassare: ", " · помилок до повторення: "],
  "Достижения ·": ["Achievements ·", "Erfolge ·", "Réussites ·", "Başarılar ·", "الإنجازات ·", "Successi ·", "Досягнення ·"],
  " из 10": [" of 10", " von 10", " sur 10", " / 10", " من 10", " di 10", " із 10"],
  "Пока нет результатов по частям.": ["No results by part yet.", "Noch keine Ergebnisse nach Teilen.", "Pas encore de résultats par partie.", "Bölümlere göre henüz sonuç yok.", "لا نتائج حسب الأجزاء بعد.", "Nessun risultato per parte.", "Поки немає результатів за частинами."],
  "Активность · 30 дней": ["Activity · 30 days", "Aktivität · 30 Tage", "Activité · 30 jours", "Etkinlik · 30 gün", "النشاط · 30 يومًا", "Attività · 30 giorni", "Активність · 30 днів"],
  "Динамика результатов": ["Result trend", "Ergebnistrend", "Évolution des résultats", "Sonuç eğilimi", "اتجاه النتائج", "Andamento risultati", "Динаміка результатів"],
  "последние": ["latest", "letzte", "derniers", "son", "آخر", "ultimi", "останні"],
  " результатов": [" results", " Ergebnisse", " résultats", " sonuç", " نتائج", " risultati", " результатів"],
  "Что повторить": ["What to review", "Was wiederholen", "À revoir", "Neyi tekrar etmeli", "ما يجب مراجعته", "Cosa ripassare", "Що повторити"],
  "Последние ошибки": ["Recent mistakes", "Letzte Fehler", "Dernières erreurs", "Son hatalar", "الأخطاء الأخيرة", "Ultimi errori", "Останні помилки"],
  "Ошибок не зафиксировано.": ["No mistakes recorded.", "Keine Fehler erfasst.", "Aucune erreur enregistrée.", "Hata kaydedilmedi.", "لم تُسجل أخطاء.", "Nessun errore registrato.", "Помилок не зафіксовано."],
  "Ошибок нет — отличная работа!": ["No mistakes — great job!", "Keine Fehler — super!", "Aucune erreur — bravo !", "Hata yok — harika!", "لا أخطاء — عمل رائع!", "Nessun errore — ottimo!", "Помилок немає — чудова робота!"],
  "Нет данных за этот период.": ["No data for this period.", "Keine Daten für diesen Zeitraum.", "Pas de données pour cette période.", "Bu dönem için veri yok.", "لا بيانات لهذه الفترة.", "Nessun dato per questo periodo.", "Немає даних за цей період."],
  "Нужно хотя бы два результата, чтобы увидеть динамику.": ["At least two results are needed to see a trend.", "Mindestens zwei Ergebnisse nötig, um einen Trend zu sehen.", "Il faut au moins deux résultats pour voir une tendance.", "Eğilim için en az iki sonuç gerekli.", "يلزم نتيجتان على الأقل لرؤية الاتجاه.", "Servono almeno due risultati per vedere l'andamento.", "Потрібно хоча б два результати, щоб побачити динаміку."],
  "сегодня": ["today", "heute", "aujourd'hui", "bugün", "اليوم", "oggi", "сьогодні"],
  "вчера": ["yesterday", "gestern", "hier", "dün", "أمس", "ieri", "учора"],
  "Светлая тема": ["Light theme", "Helles Design", "Thème clair", "Açık tema", "المظهر الفاتح", "Tema chiaro", "Світла тема"],
  "Тёмная тема": ["Dark theme", "Dunkles Design", "Thème sombre", "Koyu tema", "المظهر الداكن", "Tema scuro", "Темна тема"],
  "Язык": ["Language", "Sprache", "Langue", "Dil", "اللغة", "Lingua", "Мова"],
  "Фамилия": ["Surname", "Nachname", "Nom", "Soyad", "اللقب", "Cognome", "Прізвище"],
  "Имя": ["First name", "Vorname", "Prénom", "Ad", "الاسم", "Nome", "Ім'я"],
  "Заданий": ["Tasks", "Aufgaben", "Tâches", "Görevler", "المهام", "Attività", "Завдань"],
  "Попыток": ["Attempts", "Versuche", "Tentatives", "Denemeler", "المحاولات", "Tentativi", "Спроб"],
  "Верных ответов": ["Correct answers", "Richtige Antworten", "Réponses correctes", "Doğru cevaplar", "إجابات صحيحة", "Risposte corrette", "Правильних відповідей"],
  "Средний %": ["Average %", "Durchschnitt %", "Moyenne %", "Ortalama %", "المتوسط %", "Media %", "Середній %"],
  "Лучший %": ["Best %", "Bestes %", "Meilleur %", "En iyi %", "الأفضل %", "Migliore %", "Найкращий %"],
  "Успешных": ["Successful", "Erfolgreich", "Réussies", "Başarılı", "ناجحة", "Riuscite", "Успішних"],
  "Серия": ["Streak", "Serie", "Série", "Seri", "سلسلة", "Serie", "Серія"],
  "Последняя активность": ["Last activity", "Letzte Aktivität", "Dernière activité", "Son etkinlik", "آخر نشاط", "Ultima attività", "Остання активність"],
  "Достижения": ["Achievements", "Erfolge", "Réussites", "Başarılar", "الإنجازات", "Successi", "Досягнення"],
  "задания": ["tasks", "Aufgaben", "tâches", "görevler", "مهام", "attività", "завдання"],
  "Без имени": ["Unnamed", "Ohne Namen", "Sans nom", "İsimsiz", "بدون اسم", "Senza nome", "Без імені"],
  "не заполнил(а) анкету": ["profile not filled in", "Profil nicht ausgefüllt", "profil non rempli", "profil doldurulmadı", "لم يُملأ الملف", "profilo non compilato", "не заповнив(ла) анкету"],
  "Показаны только имя, прогресс и активность. Дата рождения, адрес и другие поля анкеты не читаются. Данные обновляются, когда ученик сохраняет прогресс в облаке.": ["Only name, progress and activity are shown. Date of birth, address and other profile fields are not read. Data updates when a student saves progress in the cloud.", "Nur Name, Fortschritt und Aktivität. Geburtsdatum, Adresse und andere Felder werden nicht gelesen. Daten werden aktualisiert, wenn ein Schüler Fortschritt in der Cloud speichert.", "Seuls le nom, la progression et l'activité sont affichés. Les autres champs ne sont pas lus. Mise à jour quand l'élève enregistre sa progression.", "Yalnızca ad, ilerleme ve etkinlik gösterilir. Diğer alanlar okunmaz. Veriler öğrenci buluta kaydettiğinde güncellenir.", "يُعرض الاسم والتقدم والنشاط فقط. لا تُقرأ الحقول الأخرى. تُحدّث البيانات عند حفظ الطالب لتقدمه في السحابة.", "Solo nome, progresso e attività. Gli altri campi non vengono letti. I dati si aggiornano quando lo studente salva i progressi nel cloud.", "Показано лише ім'я, прогрес і активність. Дата народження, адреса й інші поля анкети не читаються. Дані оновлюються, коли учень зберігає прогрес у хмарі."],
  "Для кабинета нужен JavaScript.": ["JavaScript is required for the cabinet.", "Für das Kabinett ist JavaScript erforderlich.", "JavaScript est nécessaire pour l'espace.", "Panel için JavaScript gerekli.", "مطلوب JavaScript للوحة.", "JavaScript è necessario per l'area.", "Для кабінету потрібен JavaScript."],

  "Неверный пароль.": ["Wrong password.", "Falsches Passwort.", "Mot de passe incorrect.", "Yanlış şifre.", "كلمة مرور خاطئة.", "Password errata.", "Неправильний пароль."],
  "Слишком много попыток. Попробуйте через 10 минут.": ["Too many attempts. Try again in 10 minutes.", "Zu viele Versuche. Versuchen Sie es in 10 Minuten erneut.", "Trop de tentatives. Réessayez dans 10 minutes.", "Çok fazla deneme. 10 dakika sonra tekrar deneyin.", "محاولات كثيرة. حاول بعد 10 دقائق.", "Troppi tentativi. Riprova tra 10 minuti.", "Забагато спроб. Спробуйте через 10 хвилин."],
  "Войдите в кабинет.": ["Please log in.", "Bitte melden Sie sich an.", "Veuillez vous connecter.", "Lütfen giriş yapın.", "يرجى تسجيل الدخول.", "Accedi.", "Увійдіть у кабінет."],
  "Нет связи с сервером.": ["No connection to the server.", "Keine Verbindung zum Server.", "Pas de connexion au serveur.", "Sunucuya bağlantı yok.", "لا اتصال بالخادم.", "Nessuna connessione al server.", "Немає зв'язку із сервером."],

  "Первый шаг": ["First step", "Erster Schritt", "Premier pas", "İlk adım", "الخطوة الأولى", "Primo passo", "Перший крок"],
  "7 дней подряд": ["7-day streak", "7 Tage in Folge", "7 jours d'affilée", "7 gün üst üste", "7 أيام متتالية", "7 giorni di fila", "7 днів поспіль"],
  "30 дней занятий": ["30 study days", "30 Lerntage", "30 jours d'étude", "30 çalışma günü", "30 يوم دراسة", "30 giorni di studio", "30 днів занять"],
  "Без ошибок": ["No mistakes", "Ohne Fehler", "Sans erreur", "Hatasız", "بدون أخطاء", "Senza errori", "Без помилок"],
  "Отличник": ["Top student", "Einser-Schüler", "Excellent", "Başarılı öğrenci", "طالب متفوق", "Eccellente", "Відмінник"],
  "Письмо · Beschwerde": ["Letter · Beschwerde", "Brief · Beschwerde", "Lettre · Beschwerde", "Mektup · Beschwerde", "رسالة · Beschwerde", "Lettera · Beschwerde", "Лист · Beschwerde"],
  "из 10": ["of 10", "von 10", "sur 10", " / 10", "من 10", "di 10", "із 10"],
  "Показаны только имя, прогресс и активность. Остальные поля анкеты не читаются.": ["Only name, progress and activity are shown. Other profile fields are not read.", "Nur Name, Fortschritt und Aktivität. Andere Felder werden nicht gelesen.", "Seuls nom, progression et activité. Les autres champs ne sont pas lus.", "Yalnızca ad, ilerleme ve etkinlik. Diğer alanlar okunmaz.", "يُعرض الاسم والتقدم والنشاط فقط. لا تُقرأ الحقول الأخرى.", "Solo nome, progresso e attività. Gli altri campi non vengono letti.", "Показано лише ім'я, прогрес і активність. Інші поля анкети не читаються."],
  "облачный прогресс": ["cloud progress", "Cloud-Fortschritt", "progression cloud", "bulut ilerlemesi", "تقدم سحابي", "progresso cloud", "хмарний прогрес"],

  "Общий рейтинг": ["Overall ranking", "Gesamtrangliste", "Classement général", "Genel sıralama", "الترتيب العام", "Classifica generale", "Загальний рейтинг"],
  "Тот же рейтинг, что видят ученики: очки за всё время": ["The same ranking students see: total points", "Dieselbe Rangliste wie bei den Schülern: Gesamtpunkte", "Le même classement que celui des élèves : points totaux", "Öğrencilerin gördüğü sıralamayla aynı: toplam puan", "الترتيب نفسه الذي يراه الطلاب: النقاط الإجمالية", "La stessa classifica degli studenti: punti totali", "Той самий рейтинг, що бачать учні: бали за весь час"],
  "с первой попытки": ["from first attempt", "beim ersten Versuch", "au premier essai", "ilk denemede", "من المحاولة الأولى", "al primo tentativo", "з першої спроби"],
  "Средний успех (с первой попытки)": ["Average success (first attempt)", "Durchschnitt (erster Versuch)", "Réussite moyenne (premier essai)", "Ortalama başarı (ilk deneme)", "متوسط النجاح (المحاولة الأولى)", "Successo medio (primo tentativo)", "Середній успіх (з першої спроби)"],
  "Доступ к ИИ": ["AI access", "KI-Zugang", "Accès à l'IA", "Yapay zekâ erişimi", "الوصول إلى الذكاء الاصطناعي", "Accesso all'IA", "Доступ до ШІ"],
  "Выбрать всех в списке": ["Select all in the list", "Alle in der Liste auswählen", "Tout sélectionner dans la liste", "Listedekilerin hepsini seç", "تحديد الكل في القائمة", "Seleziona tutti nell'elenco", "Вибрати всіх у списку"],
  "Ждёт допуска": ["Awaiting admission", "Wartet auf Zulassung", "En attente d'admission", "Onay bekliyor", "بانتظار القبول", "In attesa di ammissione", "Чекає допуску"],
  "Ждут допуска": ["Awaiting admission", "Warten auf Zulassung", "En attente d'admission", "Onay bekleyenler", "بانتظار القبول", "In attesa di ammissione", "Чекають допуску"],
  "Допустить": ["Admit", "Zulassen", "Admettre", "Kabul et", "قبول", "Ammetti", "Допустити"],
  "ИИ открыт": ["AI on", "KI an", "IA activée", "Yapay zekâ açık", "الذكاء الاصطناعي مفعّل", "IA attiva", "ШІ відкрито"],
  "ИИ закрыт": ["AI off", "KI aus", "IA désactivée", "Yapay zekâ kapalı", "الذكاء الاصطناعي معطّل", "IA disattivata", "ШІ закрито"],
  "Открыть ИИ": ["Open AI", "KI freischalten", "Ouvrir l'IA", "Yapay zekâyı aç", "تفعيل الذكاء الاصطناعي", "Attiva IA", "Відкрити ШІ"],
  "Закрыть ИИ": ["Close AI", "KI sperren", "Fermer l'IA", "Yapay zekâyı kapat", "إيقاف الذكاء الاصطناعي", "Disattiva IA", "Закрити ШІ"],
  "Главный администратор": ["Main administrator", "Hauptadministrator", "Administrateur principal", "Ana yönetici", "المسؤول الرئيسي", "Amministratore principale", "Головний адміністратор"],
  "Организатор группы": ["Group organizer", "Gruppenleitung", "Organisateur du groupe", "Grup organizatörü", "منظّم المجموعة", "Organizzatore del gruppo", "Організатор групи"],
  "E-mail организатора": ["Organizer e-mail", "E-Mail der Gruppenleitung", "E-mail de l'organisateur", "Organizatör e-postası", "بريد المنظّم", "E-mail dell'organizzatore", "E-mail організатора"],
  "Пароль от тренажёра": ["Trainer password", "Kennwort des Trainers", "Mot de passe de l'entraîneur", "Eğitmen şifresi", "كلمة مرور المدرب", "Password del trainer", "Пароль від тренажера"],
  "Войдите с тем же e-mail и паролем, с которыми вы зарегистрировались в тренажёре как организатор. Кабинет откроется после того, как главный администратор одобрит группу.": ["Sign in with the e-mail and password you used to register in the trainer as an organizer. The cabinet opens once the main administrator approves your group.", "Melden Sie sich mit der E-Mail und dem Kennwort an, mit denen Sie sich im Trainer als Gruppenleitung registriert haben. Das Kabinett öffnet sich, sobald der Hauptadministrator die Gruppe freigibt.", "Connectez-vous avec l'e-mail et le mot de passe utilisés pour vous inscrire comme organisateur. L'espace s'ouvre après l'approbation du groupe par l'administrateur principal.", "Eğitmene organizatör olarak kaydolduğunuz e-posta ve şifreyle giriş yapın. Ana yönetici grubu onayladıktan sonra panel açılır.", "سجّل الدخول بالبريد وكلمة المرور اللذين سجّلت بهما في المدرب كمنظّم. تُفتح اللوحة بعد موافقة المسؤول الرئيسي على المجموعة.", "Accedi con l'e-mail e la password usate per registrarti nel trainer come organizzatore. Lo spazio si apre dopo l'approvazione del gruppo da parte dell'amministratore principale.", "Увійдіть з тим самим e-mail і паролем, з якими ви зареєструвалися в тренажері як організатор. Кабінет відкриється після того, як головний адміністратор схвалить групу."],
  "Введите e-mail и пароль.": ["Enter e-mail and password.", "Geben Sie E-Mail und Kennwort ein.", "Saisissez l'e-mail et le mot de passe.", "E-posta ve şifreyi girin.", "أدخل البريد وكلمة المرور.", "Inserisci e-mail e password.", "Введіть e-mail і пароль."],
  "Группы": ["Groups", "Gruppen", "Groupes", "Gruplar", "المجموعات", "Gruppi", "Групи"],
  "Группа": ["Group", "Gruppe", "Groupe", "Grup", "المجموعة", "Gruppo", "Група"],
  "Организатор": ["Organizer", "Leitung", "Organisateur", "Organizatör", "المنظّم", "Organizzatore", "Організатор"],
  "Учеников": ["Students", "Lernende", "Élèves", "Öğrenci", "الطلاب", "Studenti", "Учнів"],
  "Статус": ["Status", "Status", "Statut", "Durum", "الحالة", "Stato", "Статус"],
  "Одобрена": ["Approved", "Freigegeben", "Approuvé", "Onaylandı", "تمت الموافقة", "Approvato", "Схвалена"],
  "Ждёт одобрения": ["Awaiting approval", "Wartet auf Freigabe", "En attente", "Onay bekliyor", "بانتظار الموافقة", "In attesa", "Чекає схвалення"],
  "Одобрить": ["Approve", "Freigeben", "Approuver", "Onayla", "موافقة", "Approva", "Схвалити"],
  "Переименовать": ["Rename", "Umbenennen", "Renommer", "Yeniden adlandır", "إعادة تسمية", "Rinomina", "Перейменувати"],
  "Удалить": ["Delete", "Löschen", "Supprimer", "Sil", "حذف", "Elimina", "Видалити"],
  "Отклонить": ["Reject", "Ablehnen", "Refuser", "Reddet", "رفض", "Rifiuta", "Відхилити"],
  "Все группы": ["All groups", "Alle Gruppen", "Tous les groupes", "Tüm gruplar", "كل المجموعات", "Tutti i gruppi", "Усі групи"],
  "вы": ["you", "Sie", "vous", "siz", "أنت", "tu", "ви"],
  "Основная группа": ["Main group", "Hauptgruppe", "Groupe principal", "Ana grup", "المجموعة الرئيسية", "Gruppo principale", "Основна група"],
  "Организатор регистрируется в тренажёре и указывает название группы. Здесь вы одобряете группу, после этого у организатора открывается свой кабинет.": ["An organizer registers in the trainer and names the group. You approve the group here; then the organizer gets an own cabinet.", "Die Gruppenleitung registriert sich im Trainer und gibt den Gruppennamen an. Hier geben Sie die Gruppe frei, danach erhält die Gruppenleitung ein eigenes Kabinett.", "L'organisateur s'inscrit dans l'entraîneur et nomme le groupe. Vous l'approuvez ici ; l'organisateur obtient alors son propre espace.", "Organizatör eğitmene kaydolur ve grubun adını yazar. Grubu burada onaylarsınız; ardından organizatörün kendi paneli açılır.", "يسجّل المنظّم في المدرب ويكتب اسم المجموعة. توافق هنا على المجموعة، فيحصل المنظّم على لوحته الخاصة.", "L'organizzatore si registra nel trainer e indica il nome del gruppo. Qui approvi il gruppo; poi l'organizzatore ottiene il proprio spazio.", "Організатор реєструється в тренажері й указує назву групи. Тут ви схвалюєте групу, після цього в організатора відкривається власний кабінет."],
  "Допустить выбранных": ["Admit selected", "Ausgewählte zulassen", "Admettre la sélection", "Seçilenleri kabul et", "قبول المحددين", "Ammetti selezionati", "Допустити вибраних"],
  "Удалить выбранных": ["Delete selected", "Ausgewählte löschen", "Supprimer la sélection", "Seçilenleri sil", "حذف المحددين", "Elimina selezionati", "Видалити вибраних"],
  "Заявки организаторов ждут одобрения": ["Organizer requests awaiting approval", "Anfragen der Gruppenleitungen warten auf Freigabe", "Demandes d'organisateurs en attente", "Onay bekleyen organizatör talepleri", "طلبات المنظّمين بانتظار الموافقة", "Richieste degli organizzatori in attesa", "Заявки організаторів чекають схвалення"],
  "Доступ": ["Access", "Zugang", "Accès", "Erişim", "الوصول", "Accesso", "Доступ"],
  "Доступ к тренажёру": ["Trainer access", "Zugang zum Trainer", "Accès à l'entraîneur", "Eğitmen erişimi", "الوصول إلى المدرب", "Accesso al trainer", "Доступ до тренажера"],
  "Имя, e-mail или UID": ["Name, e-mail or UID", "Name, E-Mail oder UID", "Nom, e-mail ou UID", "Ad, e-posta veya UID", "الاسم أو البريد أو UID", "Nome, e-mail o UID", "Ім'я, e-mail або UID"],
  "Верифицирован": ["Verified", "Verifiziert", "Vérifié", "Doğrulandı", "تم التحقق", "Verificato", "Верифіковано"],
  "Не верифицирован": ["Not verified", "Nicht verifiziert", "Non vérifié", "Doğrulanmadı", "لم يتم التحقق", "Non verificato", "Не верифіковано"],
  "Не верифицированные": ["Not verified", "Nicht verifiziert", "Non vérifiés", "Doğrulanmayanlar", "غير موثّقين", "Non verificati", "Неверифіковані"],
  "Подтвердить": ["Verify", "Bestätigen", "Valider", "Onayla", "تأكيد", "Conferma", "Підтвердити"],
  "Отозвать": ["Revoke", "Entziehen", "Révoquer", "Geri al", "سحب", "Revoca", "Відкликати"],
  "Не удалось сохранить.": ["Could not save.", "Speichern fehlgeschlagen.", "Enregistrement impossible.", "Kaydedilemedi.", "تعذّر الحفظ.", "Impossibile salvare.", "Не вдалося зберегти."],
  "Не удалось загрузить статусы верификации": ["Could not load verification statuses", "Verifizierungsstatus konnten nicht geladen werden", "Impossible de charger les statuts de vérification", "Doğrulama durumları yüklenemedi", "تعذّر تحميل حالات التحقق", "Impossibile caricare gli stati di verifica", "Не вдалося завантажити статуси верифікації"],
  "Все ученики пока показаны как не верифицированные. Нажмите «Обновить» или проверьте ключ Firebase.": ["All students are shown as not verified for now. Press “Refresh” or check the Firebase key.", "Alle Schüler werden vorerst als nicht verifiziert angezeigt. Klicken Sie auf „Aktualisieren“ oder prüfen Sie den Firebase-Schlüssel.", "Tous les élèves sont affichés comme non vérifiés pour l'instant. Cliquez sur « Actualiser » ou vérifiez la clé Firebase.", "Şimdilik tüm öğrenciler doğrulanmamış görünüyor. «Yenile»ye basın veya Firebase anahtarını kontrol edin.", "يظهر جميع الطلاب حاليًا كغير موثّقين. اضغط «تحديث» أو تحقق من مفتاح Firebase.", "Per ora tutti gli studenti risultano non verificati. Premi «Aggiorna» o controlla la chiave Firebase.", "Усі учні поки показані як неверифіковані. Натисніть «Оновити» або перевірте ключ Firebase."],
  "Общий рейтинг: —":["Overall rank: —", "Gesamtrang: —", "Classement général : —", "Genel sıra: —", "الترتيب العام: —", "Posizione generale: —", "Загальний рейтинг: —"],
  "Язык": ["Language", "Sprache", "Langue", "Dil", "اللغة", "Lingua", "Мова"],
  "Распределение по успеваемости": ["Distribution by performance", "Verteilung nach Leistung", "Répartition par résultats", "Başarıya göre dağılım", "التوزيع حسب التحصيل", "Distribuzione per rendimento", "Розподіл за успішністю"],
  "Динамика последних результатов": ["Trend of recent results", "Verlauf der letzten Ergebnisse", "Évolution des derniers résultats", "Son sonuçların seyri", "تطور آخر النتائج", "Andamento degli ultimi risultati", "Динаміка останніх результатів"],
  "решить первое задание": ["solve the first task", "die erste Aufgabe lösen", "résoudre la première tâche", "ilk görevi çöz", "حل أول مهمة", "risolvere la prima attività", "розв'язати перше завдання"],
  "10 разных заданий": ["10 different tasks", "10 verschiedene Aufgaben", "10 tâches différentes", "10 farklı görev", "10 مهام مختلفة", "10 attività diverse", "10 різних завдань"],
  "50 разных заданий": ["50 different tasks", "50 verschiedene Aufgaben", "50 tâches différentes", "50 farklı görev", "50 مهمة مختلفة", "50 attività diverse", "50 різних завдань"],
  "100 попыток решения": ["100 solving attempts", "100 Lösungsversuche", "100 tentatives de résolution", "100 çözüm denemesi", "100 محاولة حل", "100 tentativi di risoluzione", "100 спроб розв'язання"],
  "неделя без пропусков": ["a week without gaps", "eine Woche ohne Lücken", "une semaine sans interruption", "aralıksız bir hafta", "أسبوع بلا انقطاع", "una settimana senza pause", "тиждень без пропусків"],
  "30 активных дней": ["30 active days", "30 aktive Tage", "30 jours actifs", "30 aktif gün", "30 يومًا نشطًا", "30 giorni attivi", "30 активних днів"],
  "100% за задание": ["100% on a task", "100 % bei einer Aufgabe", "100 % à une tâche", "bir görevde %100", "100% في مهمة", "100% in un'attività", "100% за завдання"],
  "85%+ на 10 заданиях": ["85%+ on 10 tasks", "85 %+ bei 10 Aufgaben", "85 %+ sur 10 tâches", "10 görevde %85+", "85%+ في 10 مهام", "85%+ su 10 attività", "85%+ на 10 завданнях"],
  "80%+ в Hören": ["80%+ in Hören", "80 %+ in Hören", "80 %+ en Hören", "Hören'de %80+", "80%+ في Hören", "80%+ in Hören", "80%+ у Hören"],
  "80%+ в Schreiben": ["80%+ in Schreiben", "80 %+ in Schreiben", "80 %+ en Schreiben", "Schreiben'de %80+", "80%+ في Schreiben", "80%+ in Schreiben", "80%+ у Schreiben"],
  "По рейтингу (общие очки)": ["By rank (total points)", "Nach Rang (Gesamtpunkte)", "Par classement (points totaux)", "Sıralamaya göre (toplam puan)", "حسب الترتيب (النقاط الإجمالية)", "Per classifica (punti totali)", "За рейтингом (загальні бали)"],
  "По точности (с первой попытки)": ["By accuracy (first attempt)", "Nach Genauigkeit (erster Versuch)", "Par précision (premier essai)", "Doğruluğa göre (ilk deneme)", "حسب الدقة (المحاولة الأولى)", "Per precisione (primo tentativo)", "За точністю (з першої спроби)"],
  "Место": ["Rank", "Platz", "Rang", "Sıra", "المركز", "Posizione", "Місце"],
  "Очки": ["Points", "Punkte", "Points", "Puan", "النقاط", "Punti", "Бали"],
  "место:": ["rank:", "Platz:", "rang :", "sıra:", "المركز:", "posizione:", "місце:"],
  "очков:": ["points:", "Punkte:", "points :", "puan:", "النقاط:", "punti:", "балів:"],
};

const ADM_RULES = [
  [/^(\d+) учеников в облаке · (\d+) активны за неделю · (\d+) заданий решено$/, ["{0} students in the cloud · {1} active this week · {2} tasks solved", "{0} Schüler in der Cloud · {1} diese Woche aktiv · {2} Aufgaben gelöst", "{0} élèves dans le cloud · {1} actifs cette semaine · {2} tâches résolues", "{0} öğrenci bulutta · {1} bu hafta aktif · {2} görev çözüldü", "{0} طالب في السحابة · {1} نشطون هذا الأسبوع · {2} مهمة محلولة", "{0} studenti nel cloud · {1} attivi questa settimana · {2} attività risolte", "{0} учнів у хмарі · {1} активні за тиждень · {2} завдань розв'язано"]],
  [/^(\d+) с прогрессом$/, ["{0} with progress", "{0} mit Fortschritt", "{0} avec progression", "{0} ilerlemeli", "{0} لديهم تقدم", "{0} con progresso", "{0} з прогресом"]],
  [/^(\d+) за 30 дней$/, ["{0} in 30 days", "{0} in 30 Tagen", "{0} sur 30 jours", "{0} 30 günde", "{0} خلال 30 يومًا", "{0} in 30 giorni", "{0} за 30 днів"]],
  [/^в среднем (.+) на ученика$/, ["on average {0} per student", "im Durchschnitt {0} pro Schüler", "en moyenne {0} par élève", "ortalama öğrenci başına {0}", "بمتوسط {0} لكل طالب", "in media {0} per studente", "у середньому {0} на учня"]],
  [/^(\d+) заданий · (\d+) успешных$/, ["{0} tasks · {1} successful", "{0} Aufgaben · {1} erfolgreich", "{0} tâches · {1} réussies", "{0} görev · {1} başarılı", "{0} مهام · {1} ناجحة", "{0} attività · {1} riuscite", "{0} завдань · {1} успішних"]],
  [/^лучший результат (.+)$/, ["best result {0}", "bestes Ergebnis {0}", "meilleur résultat {0}", "en iyi sonuç {0}", "أفضل نتيجة {0}", "miglior risultato {0}", "найкращий результат {0}"]],
  [/^обновлено (.+) назад$/, ["updated {0} ago", "aktualisiert vor {0}", "actualisé il y a {0}", "{0} önce güncellendi", "تم التحديث قبل {0}", "aggiornato {0} fa", "оновлено {0} тому"]],
  [/^(\d+) дн\.$/, ["{0} d", "{0} T", "{0} j", "{0} g", "{0} ي", "{0} g", "{0} дн."]],
  [/^(\d+) попыток$/, ["{0} attempts", "{0} Versuche", "{0} tentatives", "{0} deneme", "{0} محاولات", "{0} tentativi", "{0} спроб"]],
  [/^(\d+) заданий$/, ["{0} tasks", "{0} Aufgaben", "{0} tâches", "{0} görev", "{0} مهام", "{0} attività", "{0} завдань"]],
  [/^(\d+) учеников$/, ["{0} students", "{0} Schüler", "{0} élèves", "{0} öğrenci", "{0} طلاب", "{0} studenti", "{0} учнів"]],
  [/^(\d+) дней назад$/, ["{0} days ago", "vor {0} Tagen", "il y a {0} jours", "{0} gün önce", "قبل {0} أيام", "{0} giorni fa", "{0} днів тому"]],
  [/^(\d+) из 10$/, ["{0} of 10", "{0} von 10", "{0} sur 10", "{0} / 10", "{0} من 10", "{0} di 10", "{0} із 10"]],
  [/^успешно 80%\+ · (\d+)%$/, ["successful 80%+ · {0}%", "erfolgreich 80 %+ · {0} %", "réussi 80 %+ · {0} %", "başarılı %80+ · {0}%", "ناجح 80%+ · {0}%", "riuscito 80%+ · {0}%", "успішно 80%+ · {0}%"]],
  [/^средне · (\d+)%$/, ["medium · {0}%", "mittel · {0} %", "moyen · {0} %", "orta · {0}%", "متوسط · {0}%", "medio · {0}%", "середньо · {0}%"]],
  [/^слабо <50% · (\d+)%$/, ["weak <50% · {0}%", "schwach <50 % · {0} %", "faible <50 % · {0} %", "zayıf <%50 · {0}%", "ضعيف <50% · {0}%", "debole <50% · {0}%", "слабко <50% · {0}%"]],
  [/^(.+)% · (\d+) (попытки|попытка|попыток)$/, ["{0}% · {1} attempts", "{0} % · {1} Versuche", "{0} % · {1} tentatives", "{0}% · {1} deneme", "{0}% · {1} محاولات", "{0}% · {1} tentativi", "{0}% · {1} спроб"]],
  [/^(\d+) слабых (тем|темы)$/, ["{0} weak topics", "{0} schwache Themen", "{0} points faibles", "{0} zayıf konu", "{0} مواضيع ضعيفة", "{0} argomenti deboli", "{0} слабких тем"]],
  [/^с нами с (.+)$/, ["since {0}", "seit {0}", "depuis {0}", "{0} beri", "منذ {0}", "dal {0}", "з нами з {0}"]],
  [/^(\d+) (день|дня|дней) назад$/, ["{0} days ago", "vor {0} Tagen", "il y a {0} jours", "{0} gün önce", "قبل {0} أيام", "{0} giorni fa", "{0} дн. тому"]],
  [/^(\d+) заданий · (\d+) дн\.$/, ["{0} tasks · {1} d", "{0} Aufgaben · {1} T", "{0} tâches · {1} j", "{0} görev · {1} g", "{0} مهام · {1} ي", "{0} attività · {1} g", "{0} завдань · {1} дн."]],

  [/^UID (.+) · был\(а\) (.+)$/, ["UID {0} · last seen {1}", "UID {0} · zuletzt {1}", "UID {0} · vu(e) {1}", "UID {0} · son görülme {1}", "UID {0} · آخر ظهور {1}", "UID {0} · ultimo accesso {1}", "UID {0} · був(ла) {1}"]],
  [/^Лучший средний результат: (.+) · успешных заданий: (.+) из (.+) · ошибок к повтору: (.+)$/, ["Best average: {0} · successful tasks: {1} of {2} · mistakes to review: {3}", "Bester Durchschnitt: {0} · erfolgreiche Aufgaben: {1} von {2} · Fehler zum Wiederholen: {3}", "Meilleure moyenne : {0} · tâches réussies : {1} sur {2} · erreurs à revoir : {3}", "En iyi ortalama: {0} · başarılı görev: {1} / {2} · tekrar hataları: {3}", "أفضل متوسط: {0} · مهام ناجحة: {1} من {2} · أخطاء للمراجعة: {3}", "Migliore media: {0} · attività riuscite: {1} di {2} · errori da ripassare: {3}", "Найкращий середній результат: {0} · успішних завдань: {1} із {2} · помилок до повторення: {3}"]],
  [/^Достижения · (\d+) из 10$/, ["Achievements · {0} of 10", "Erfolge · {0} von 10", "Réussites · {0} sur 10", "Başarılar · {0} / 10", "الإنجازات · {0} من 10", "Successi · {0} di 10", "Досягнення · {0} із 10"]],
  [/^последние (\d+) результатов$/, ["latest {0} results", "letzte {0} Ergebnisse", "{0} derniers résultats", "son {0} sonuç", "آخر {0} نتائج", "ultimi {0} risultati", "останні {0} результатів"]],
  [/^(\d+) (неделю|недели|недель) назад$/, ["{0} weeks ago", "vor {0} Wochen", "il y a {0} semaines", "{0} hafta önce", "قبل {0} أسابيع", "{0} settimane fa", "{0} тиж. тому"]],

  [/^(\d+) попыток · (\d+) дн\. · (.+) с первой попытки$/, ["{0} attempts · {1} d · {2} from first attempt", "{0} Versuche · {1} T · {2} beim ersten Versuch", "{0} tentatives · {1} j · {2} au premier essai", "{0} deneme · {1} g · {2} ilk denemede", "{0} محاولات · {1} ي · {2} من المحاولة الأولى", "{0} tentativi · {1} g · {2} al primo tentativo", "{0} спроб · {1} дн. · {2} з першої спроби"]],
  [/^Общий рейтинг: #(\d+) · (.+) очков$/, ["Overall rank: #{0} · {1} points", "Gesamtrang: #{0} · {1} Punkte", "Classement général : #{0} · {1} points", "Genel sıra: #{0} · {1} puan", "الترتيب العام: #{0} · {1} نقطة", "Posizione generale: #{0} · {1} punti", "Загальний рейтинг: #{0} · {1} балів"]],
  [/^Сейчас \(с учётом пересдач\): (.+) · лучший: (.+) · успешных заданий: (.+) из (.+) · ошибок к повтору: (.+)$/, ["Now (including retakes): {0} · best: {1} · successful tasks: {2} of {3} · mistakes to review: {4}", "Aktuell (mit Wiederholungen): {0} · bestes: {1} · erfolgreiche Aufgaben: {2} von {3} · Fehler zum Wiederholen: {4}", "Actuellement (avec reprises) : {0} · meilleur : {1} · tâches réussies : {2} sur {3} · erreurs à revoir : {4}", "Şimdi (tekrarlar dahil): {0} · en iyi: {1} · başarılı görev: {2} / {3} · tekrar hataları: {4}", "الآن (مع الإعادات): {0} · الأفضل: {1} · مهام ناجحة: {2} من {3} · أخطاء للمراجعة: {4}", "Ora (con ripetizioni): {0} · migliore: {1} · attività riuscite: {2} su {3} · errori da ripassare: {4}", "Зараз (з урахуванням перескладань): {0} · найкращий: {1} · успішних завдань: {2} із {3} · помилок до повторення: {4}"]],
  [/^Активность: (\d+) дней$/, ["Activity: {0} days", "Aktivität: {0} Tage", "Activité : {0} jours", "Etkinlik: {0} gün", "النشاط: {0} يومًا", "Attività: {0} giorni", "Активність: {0} днів"]],
  [/^Успешно (\d+)%, средне (\d+)%, слабо (\d+)%$/, ["Successful {0}%, medium {1}%, weak {2}%", "Erfolgreich {0} %, mittel {1} %, schwach {2} %", "Réussi {0} %, moyen {1} %, faible {2} %", "Başarılı %{0}, orta %{1}, zayıf %{2}", "ناجح {0}%، متوسط {1}%، ضعيف {2}%", "Riuscito {0}%, medio {1}%, debole {2}%", "Успішно {0}%, середньо {1}%, слабко {2}%"]],
  [/^Открыть профиль (.+)$/, ["Open profile {0}", "Profil öffnen: {0}", "Ouvrir le profil {0}", "Profili aç: {0}", "افتح ملف {0}", "Apri il profilo {0}", "Відкрити профіль {0}"]],
  [/^(\d+) попыток, (\d+) заданий$/, ["{0} attempts, {1} tasks", "{0} Versuche, {1} Aufgaben", "{0} tentatives, {1} tâches", "{0} deneme, {1} görev", "{0} محاولات، {1} مهام", "{0} tentativi, {1} attività", "{0} спроб, {1} завдань"]],
  [/^Текущий: (.+) · лучший: (.+)$/, ["Current: {0} · best: {1}", "Aktuell: {0} · bestes: {1}", "Actuel : {0} · meilleur : {1}", "Güncel: {0} · en iyi: {1}", "الحالي: {0} · الأفضل: {1}", "Attuale: {0} · migliore: {1}", "Поточний: {0} · найкращий: {1}"]],
  [/^Текущий результат: (.+)$/, ["Current result: {0}", "Aktuelles Ergebnis: {0}", "Résultat actuel : {0}", "Güncel sonuç: {0}", "النتيجة الحالية: {0}", "Risultato attuale: {0}", "Поточний результат: {0}"]],
  [/^(\d{2}\.\d{2}\.\d{4}): (\d+) заданий, (\d+) учеников$/, ["{0}: {1} tasks, {2} students", "{0}: {1} Aufgaben, {2} Schüler", "{0} : {1} tâches, {2} élèves", "{0}: {1} görev, {2} öğrenci", "{0}: {1} مهام، {2} طلاب", "{0}: {1} attività, {2} studenti", "{0}: {1} завдань, {2} учнів"]],
  [/^(\d{2}\.\d{2}\.\d{4}) · (\d+) заданий · (\d+) учеников$/, ["{0} · {1} tasks · {2} students", "{0} · {1} Aufgaben · {2} Schüler", "{0} · {1} tâches · {2} élèves", "{0} · {1} görev · {2} öğrenci", "{0} · {1} مهام · {2} طلاب", "{0} · {1} attività · {2} studenti", "{0} · {1} завдань · {2} учнів"]],
];

function admFill(tpl, m) { return String(tpl || "").replace(/\{(\d)\}/g, (_, i) => m[+i + 1] ?? ""); }
// Russian counts change the word form (1 ученик, 2 ученика, 5 учеников): reduce them to the form the rules are written for
const ADM_PLURALS = [[/(\d) (?:ученика|ученик)(?![а-я])/g, "$1 учеников"], [/(\d) (?:задания|задание)(?![а-я])/g, "$1 заданий"], [/(\d) (?:попытки|попытка)(?![а-я])/g, "$1 попыток"],
  [/(\d) (?:дня|день)(?![а-я])/g, "$1 дней"], [/(\d) активен(?![а-я])/g, "$1 активны"]];
const admNorm = (c) => ADM_PLURALS.reduce((t, [rx, to]) => t.replace(rx, to), c);
function admTr(s) {
  if (ADM_LANG === "ru" || !/[\u0400-\u04FF]/.test(s)) return s;
  const li = ADM_LANG_IDX[ADM_LANG];
  const lead = (s.match(/^\s*/) || [""])[0], trail = (s.match(/\s*$/) || [""])[0];
  const core = admNorm(s.trim());
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
