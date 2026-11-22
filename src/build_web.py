"""Build the plain static web version into ../web (index.html + assets, no Claude runtime needed)."""
import os, shutil, subprocess
H = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(H, '..')
subprocess.run(['python3', 'build.py'], check=True, cwd=H)
subprocess.run(['python3', 'build_i18n.py'], check=True, cwd=H)
os.makedirs(os.path.join(OUT, 'assets'), exist_ok=True)
shutil.copy(os.path.join(H, 'style.css'), os.path.join(OUT, 'assets', 'style.css'))
shutil.copy(os.path.join(H, 'data.js'), os.path.join(OUT, 'assets', 'data.js'))
with open(os.path.join(OUT, 'assets', 'data.js'), 'a', encoding='utf-8') as f:
    f.write(open(os.path.join(H, 'i18n.js'), encoding='utf-8').read())
js = ''.join(open(os.path.join(H, f), encoding='utf-8').read() for f in ['a0_repeat.js', 'a_util.js', 'b_quiz.js', 'c_parts.js', 'd_pages.js', 'd2_learn.js', 'd3_i18n.js', 'd5_cloud.js', 'd6_progress.js', 'e_main.js'])
open(os.path.join(OUT, 'assets', 'app.js'), 'w', encoding='utf-8').write(js)
# teacher cabinet: standalone page at /admin (server.js rewrite locally, vercel.json in production)
shutil.copy(os.path.join(H, 'admin.css'), os.path.join(OUT, 'assets', 'admin.css'))
shutil.copy(os.path.join(H, 'admin.js'), os.path.join(OUT, 'assets', 'admin.js'))
shutil.copy(os.path.join(H, 'admin_i18n.js'), os.path.join(OUT, 'assets', 'admin_i18n.js'))
# Link preview (Telegram, WhatsApp, Facebook): always German, same for every visitor, no login needed.
# Image source: project marketing/og/source (og.html + render_og.js).
OG = '''<meta name="description" content="Online-Trainer für die Prüfung telc Deutsch B2 Beruf (DTB): Lesen, Hören, Schreiben und Sprechen mit Fortschritt in Grafiken und Kabinett für Lehrkräfte. 3 Tage gratis.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="prufungen.de">
<meta property="og:locale" content="de_DE">
<meta property="og:title" content="telc DTB B2 Beruf Trainer · 3 Tage gratis · prufungen.de">
<meta property="og:description" content="Lesen, Hören, Schreiben und Sprechen wie in der echten Prüfung. Fortschritt in Grafiken, Fehlertraining, Probeprüfung und Kabinett für Lehrkräfte.">
<meta property="og:url" content="https://www.prufungen.de/">
<meta property="og:image" content="https://www.prufungen.de/assets/og-de.jpg">
<meta property="og:image:secure_url" content="https://www.prufungen.de/assets/og-de.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="telc DTB B2 Beruf Trainer: Lehrerkabinett mit Grafiken auf dem Laptop, Mein Fortschritt auf dem Handy">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="telc DTB B2 Beruf Trainer · 3 Tage gratis · prufungen.de">
<meta name="twitter:description" content="Lesen, Hören, Schreiben und Sprechen wie in der echten Prüfung. Fortschritt in Grafiken und Kabinett für Lehrkräfte.">
<meta name="twitter:image" content="https://www.prufungen.de/assets/og-de.jpg">
'''
html = '''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>DTB B2 Prüfungstrainer</title>
<!--OG-->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&family=Onest:wght@400;600;700&family=Unbounded:wght@500;600&subset=cyrillic,latin-ext&display=swap" rel="stylesheet">
<script>try{var r=localStorage.getItem("dtb.theme"),t;try{t=JSON.parse(r);}catch(e){t=r;}document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark");}catch(e){document.documentElement.setAttribute("data-theme","dark");}</script>
<link rel="stylesheet" href="assets/style.css">
<style>body{margin:0}</style>
</head>
<body>
<header class="top"><div class="top-in">
<a class="brand" href="#home"><b>DTB B2 Beruf</b><span>Prüfungstrainer</span></a>
<nav class="nav"><a href="#home">Главная</a><a href="#progress">Прогресс</a><a href="#leaderboard">Рейтинг</a><a href="#review">Ошибки</a><a href="#learn">Учить наизусть</a><a href="#exam">Пробный экзамен</a><a href="#voice">Голос</a></nav>
</div></header>
<main id="app"></main>
<script src="assets/data.js"></script>
<script src="assets/app.js"></script>
</body>
</html>
'''
html = html.replace('<!--OG-->\n', OG)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
admin = '''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>Кабинет преподавателя · DTB B2 Beruf</title>
<!--OG-->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Onest:wght@400;600;700&family=Unbounded:wght@500;600&subset=cyrillic,latin-ext&display=swap" rel="stylesheet">
<script>try{var r=localStorage.getItem("dtb.theme"),t;try{t=JSON.parse(r);}catch(e){t=r;}document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark");}catch(e){document.documentElement.setAttribute("data-theme","dark");}</script>
<link rel="stylesheet" href="/assets/style.css">
<link rel="stylesheet" href="/assets/admin.css">
</head>
<body class="adm">
<div id="admin-root"></div>
<noscript><p style="padding:24px;font-family:system-ui">Для кабинета нужен JavaScript.</p></noscript>
<script src="/assets/admin_i18n.js"></script>
<script src="/assets/admin.js"></script>
</body>
</html>
'''
admin = admin.replace('<!--OG-->\n', OG.split('\n', 1)[1])
open(os.path.join(OUT, 'admin.html'), 'w', encoding='utf-8').write(admin)
print('web built')
