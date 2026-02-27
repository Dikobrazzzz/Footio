#!/usr/bin/env python3
"""
Добавить фото к игрокам в index.html через regex
"""
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

added_count = 0

# Для каждого игрока с фото
for name, photo_file in photo_mapping.items():
    # Ищем паттерн {name:"ИМЯ"...rating:XX}
    # Добавляем photo после rating
    pattern = rf'(\{{name:"{re.escape(name)}",[^}}]*,rating:\d+)(\}})'
    
    def add_photo(match):
        global added_count
        before = match.group(1)
        after = match.group(2)
        added_count += 1
        return f'{before},photo:"/images/players/{photo_file}"{after}'
    
    html = re.sub(pattern, add_photo, html)

# Также для players (другой формат - team вместо rating)
for name, photo_file in photo_mapping.items():
    # Ищем паттерн {name:"ИМЯ"...team:"XX"}
    # Добавляем photo после team
    pattern = rf'(\{{name:"{re.escape(name)}",[^}}]*,team:"[^"]+")(\}})'
    
    def add_photo2(match):
        global added_count
        before = match.group(1)
        after = match.group(2)
        added_count += 1
        return f'{before},photo:"/images/players/{photo_file}"{after}'
    
    html = re.sub(pattern, add_photo2, html)

# Сохраняем
with open('/Users/roman/Desktop/TikTok/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print(f'✅ Добавлено {added_count} фото к игрокам!')
