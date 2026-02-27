#!/usr/bin/env python3
"""
Добавить фото к игрокам в index.html
"""
import json
import re

# Маппинг имен -> файл фото
photo_mapping = {
    # Legends
    "Maradona": "maradona.png",
    "Cruyff": "cruyff.png",
    "Beckenbauer": "beckenbauer.png",
    "Zidane": "zidane.png",
    "Ronaldinho": "ronaldinho.png",
    "Henry": "henry.png",
    "Maldini": "maldini.png",
    "Best": "best.png",
    "Platini": "platini.png",
    "Van Basten": "van-basten.png",
    "G.Müller": "muller.png",
    "Charlton": "charlton.png",
    "R9": "ronaldo.png",
    "Puskás": "puskas.png",
    "Matthäus": "matthaus.png",
    "Iniesta": "iniesta.png",
    "Xavi": "xavi.png",
    "Kaká": "kaka.png",
    "Beckham": "beckham.png",
    "Bergkamp": "bergkamp.png",
    "Rivaldo": "rivaldo.png",
    "Hagi": "hagi.png",
    
    # Players
    "Cristiano Ronaldo": "cristiano-ronaldo.png",
    "Zlatan": "zlatan.png",
    "Suárez": "suarez.png",
    "Griezmann": "griezmann.png",
    "Neymar": "neymar.png",
    "Mbappé": "mbappe.png",
    "Fàbregas": "fabregas.png",
    "Van Persie": "van-persie.png",
    "Owen": "owen.png",
    "Sánchez": "sanchez.png",
    "Tevez": "tevez.png",
    "Seedorf": "seedorf.png",
    "Davids": "davids.png",
    "Vieira": "vieira.png",
    "A.Cole": "cole.png",
    "Haaland": "haaland.png",
    "Vinícius": "vinicius.png",
    "Bellingham": "bellingham.png",
    "Messi": "messi.png",
    "Salah": "salah.png",
    "Lewandowski": "lewandowski.png",
    "De Bruyne": "de-bruyne.png",
    "Kane": "kane.png",
    "Modrić": "modric.png",
    "Eto'o": "etoo.png",
}

# Читаем HTML
with open('/Users/roman/Desktop/TikTok/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Находим legends массив
legends_match = re.search(r'const legends=(\[.*?\]);', html, re.DOTALL)
if not legends_match:
    print("❌ Не найден legends массив")
    exit(1)

# Находим players массив
players_match = re.search(r'const players=(\[.*?\]);', html, re.DOTALL)
if not players_match:
    print("❌ Не найден players массив")
    exit(1)

# Парсим JSON
legends_str = legends_match.group(1)
players_str = players_match.group(1)

legends = json.loads(legends_str)
players = json.loads(players_str)

# Добавляем фото
legends_with_photos = 0
for player in legends:
    name = player.get('name')
    if name in photo_mapping:
        player['photo'] = f"/images/players/{photo_mapping[name]}"
        legends_with_photos += 1

players_with_photos = 0
for player in players:
    name = player.get('name')
    if name in photo_mapping:
        player['photo'] = f"/images/players/{photo_mapping[name]}"
        players_with_photos += 1

# Конвертируем обратно в JSON строки
new_legends_str = f"const legends={json.dumps(legends, ensure_ascii=False)};"
new_players_str = f"const players={json.dumps(players, ensure_ascii=False)};"

# Заменяем в HTML
html = re.sub(r'const legends=\[.*?\];', new_legends_str, html, flags=re.DOTALL)
html = re.sub(r'const players=\[.*?\];', new_players_str, html, flags=re.DOTALL)

# Сохраняем
with open('/Users/roman/Desktop/TikTok/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('✅ Фото добавлены к игрокам!')
print(f'   Legends: {legends_with_photos}/{len(legends)} с фото')
print(f'   Players: {players_with_photos}/{len(players)} с фото')
