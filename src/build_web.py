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
js = ''.join(open(os.path.join(H, f), encoding='utf-8').read() for f in ['a_util.js', 'b_quiz.js', 'c_parts.js', 'd_pages.js', 'd2_learn.js', 'd3_i18n.js', 'e_main.js'])
open(os.path.join(OUT, 'assets', 'app.js'), 'w', encoding='utf-8').write(js)
html = '''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>DTB B2 Prüfungstrainer</title>
<meta property="og:type" content="website">
<meta property="og:title" content="DTB B2 Beruf Prüfungstrainer">
<meta property="og:description" content="Тренажёр telc DTB B2 Beruf: Lesen, Hören, Schreiben и Sprechen с озвучкой и проверкой.">
<meta property="og:image" content="https://b2-beruf-test.vercel.app/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://b2-beruf-test.vercel.app/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://b2-beruf-test.vercel.app/assets/og.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&family=Onest:wght@400;600;700&family=Unbounded:wght@500;600&subset=cyrillic,latin-ext&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css">
<style>body{margin:0}</style>
</head>
<body>
<header class="top"><div class="top-in">
<a class="brand" href="#home"><b>DTB B2 Beruf</b><span>Prüfungstrainer</span></a>
<nav class="nav"><a href="#home">Главная</a><a href="#review">Ошибки</a><a href="#learn">Учить наизусть</a><a href="#exam">Пробный экзамен</a><a href="#voice">Голос</a></nav>
</div></header>
<main id="app"></main>
<script src="assets/data.js"></script>
<script src="assets/app.js"></script>
</body>
</html>
'''
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
print('web built')
