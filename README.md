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
index.html        страница
assets/           style.css, data.js (все билеты), app.js
server.js         маленький статический сервер без зависимостей
src/              gen_audio.py и исходники: JS-модули, стили и парсеры билетов (Python)
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
