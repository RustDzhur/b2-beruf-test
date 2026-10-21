# DTB B2 Prüfungstrainer

Тренажёр по билетам экзамена **telc Deutsch-Test für den Beruf B2**: Lesen 1–4, Beschwerde, Hören 1–4 с озвучкой голосом браузера, Telefonnotiz, Sprachbausteine 1–2, 68 тем форума, Sprechen Teil 3 и пробный экзамен с подсчётом баллов. Прогресс сохраняется в браузере (localStorage).

## Запуск на localhost

Нужен только Node.js (без установки пакетов):

```bash
cd ~/WebstormProjects/dtb-b2-trainer
npm start
```

Откроется http://localhost:5173. Остановить: `Ctrl+C`.
На Mac можно просто дважды нажать `start.command`. Другой порт: `PORT=8080 npm start`.

## Проверка писем ИИ (Schreiben)

Письма (Beschwerde, Forum) вы пишете сами, ИИ проверяет грамматику, построение предложений и уровень B2, показывает ошибки в тексте, более сильные формулировки и исправленный вариант. Для этого нужен ключ OpenAI (platform.openai.com). Ключ хранится только в переменной окружения, в код и в репозиторий он не попадает.

Локально:

```bash
OPENAI_API_KEY=sk-... npm start
```

На Vercel: Project → Settings → Environment Variables → `OPENAI_API_KEY` (при желании `OPENAI_MODEL`, по умолчанию `gpt-4o`), затем Redeploy. Страница обращается к собственным функциям `/api/ai` и `/api/status`, браузер ключа не видит. Без ключа письма можно писать и сравнивать с образцом.

## Кабинет преподавателя `/admin`

Отдельная страница для преподавателя: все ученики, которые сохраняют прогресс в Firebase. Видно имя и фамилию, дни занятий, число попыток и уникальных заданий, средний успех в процентах, ошибки к повтору, серию дней, достижения, активность по дням и динамику последних результатов. Есть поиск, фильтры, сортировка, карточка ученика и экспорт CSV.

Данные читает серверная функция `/api/admin/dashboard` по service account. Ключ остаётся на сервере и в браузер не попадает. Правила Firestore менять не нужно: service account имеет доступ к коллекции, а сама страница закрыта паролем.

### Vercel (продакшен)

1. Firebase Console → ⚙ Project settings → Service accounts → **Generate new private key**. Скачается JSON. Ключ должен быть от того же проекта, что и тренажёр (`prufung-6e9b1`).
2. Vercel → Project → Settings → Environment Variables:
   - `ADMIN_PASSWORD` — пароль для входа в `/admin`;
   - `FIREBASE_SERVICE_ACCOUNT` — содержимое JSON-ключа (можно одной строкой; также поддерживается base64 в `FIREBASE_SERVICE_ACCOUNT_B64`);
   - по желанию `ADMIN_SECRET` — стабильный ключ подписи cookie (иначе выводится из пароля).
3. Redeploy и откройте `https://b2-beruf-test.vercel.app/admin`.

### Локально

```bash
ADMIN_PASSWORD=мой-пароль \
FIREBASE_SERVICE_ACCOUNT="$(cat key.json)" \
npm start
# http://localhost:5173/admin
```

Без `ADMIN_PASSWORD` сервер генерирует случайный пароль и печатает его в консоли при запуске. Без ключа Firebase страница `/admin` покажет пошаговую инструкцию. Если Firestore отвечает `403 Missing or insufficient permissions`, выдайте сервисному аккаунту роль **Datastore User** (или Firebase Admin) в Google Cloud IAM.

В кабинет попадают только ученики, которые в анкете «Данные участника» указали пароль: тогда прогресс синхронизируется в Firestore. Без пароля данные остаются в браузере и преподавателю не видны.

Сессия — HttpOnly-cookie на 8 часов; пароль в браузере не хранится. В кабинете показываются только имя, прогресс и активность. Дата рождения, адрес и остальные поля анкеты не читаются.

Проверка: `npm test` (встроенный `node:test`, без зависимостей). Демо-данные не используются; тестовый набор лежит в `tests/` и на Vercel не выкладывается.

## Голос для Hören

Лучший звук дают нейроголоса Microsoft (Katja, Amala, Conrad, Killian): они звучат как живые дикторы. Один раз запустите на своём компьютере (нужны интернет и Python 3):

```bash
python3 -m pip install edge-tts
npm run audio
```

Скрипт озвучит все диалоги и сообщения (около 500 коротких файлов, несколько минут) и сложит их в `assets/audio/`. Обновите страницу (Cmd+Shift+R): у каждого собеседника свой голос, в плеере будет надпись «диктор: нейроголос Microsoft». Если скрипт прервался, запустите его снова, он допишет недостающее.

Пока аудио нет, приложение читает голосами браузера (вкладка «Голос»: выбор голоса и скорость). Для Mac скачайте Anna / Petra / Markus (Premium): Системные настройки → Универсальный доступ → Устной контент → Управлять голосами → Немецкий.

## Структура

```
index.html        страница тренажёра
admin.html        кабинет преподавателя (/admin)
assets/           style.css, data.js (все билеты), app.js, admin.css, admin.js
api/              Vercel-функции: ИИ-проверка и /api/admin (service account, метрики)
server.js         маленький статический сервер без зависимостей
src/              gen_audio.py и исходники: JS-модули, admin.js/css, стили и парсеры (Python)
tests/            node:test для кабинета (на Vercel не выкладывается)
```

После правок в `src/` пересобрать: `npm run build` (нужен Python 3).

## GitHub

```bash
git init && git add . && git commit -m "DTB B2 trainer"
git branch -M main
git remote add origin https://github.com/<ваш-логин>/dtb-b2-trainer.git
git push -u origin main
```

Материалы билетов защищены авторским правом telc, поэтому репозиторий лучше сделать **приватным**. Для GitHub Pages сайт работает как есть (Settings → Pages → Deploy from branch → main / root).

## Ограничения

- Ответы заданий Lesen и Hören проверяются по заложенным ключам; при сомнении сверяйтесь с материалами курса.
- Кабинет `/admin` работает на Vercel (нужны serverless-функции `api/admin/*`). На GitHub Pages без функций он не откроется.
