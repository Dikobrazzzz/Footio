#!/usr/bin/env python3
import requests
import time
import os
from urllib.parse import quote

# Список игроков (легенды + современные)
players_to_download = [
    # Легенды
    ("Pelé", "pele"),
    ("Diego Maradona", "maradona"),
    ("Johan Cruyff", "cruyff"),
    ("Franz Beckenbauer", "beckenbauer"),
    ("Zinedine Zidane", "zidane"),
    ("Ronaldinho", "ronaldinho"),
    ("Thierry Henry", "henry"),
    ("Paolo Maldini", "maldini"),
    ("George Best", "best"),
    ("Alfredo Di Stéfano", "di-stefano"),
    ("Eusébio", "eusebio"),
    ("Michel Platini", "platini"),
    ("Marco van Basten", "van-basten"),
    ("Gerd Müller", "gerd-muller"),
    ("Bobby Charlton", "charlton"),
    ("Ronaldo Nazário", "ronaldo-nazario"),
    ("Ferenc Puskás", "puskas"),
    ("Lothar Matthäus", "matthaus"),
    ("Andrés Iniesta", "iniesta"),
    ("Xavi Hernández", "xavi"),
    ("Kaká", "kaka"),
    ("David Beckham", "beckham"),
    ("Dennis Bergkamp", "bergkamp"),
    ("Rivaldo", "rivaldo"),
    ("Gheorghe Hagi", "hagi"),
    
    # Современные
    ("Cristiano Ronaldo", "cristiano-ronaldo"),
    ("Zlatan Ibrahimović", "zlatan"),
    ("Lionel Messi", "messi"),
    ("Kylian Mbappé", "mbappe"),
    ("Neymar Jr", "neymar"),
    ("Erling Haaland", "haaland"),
    ("Vinícius Júnior", "vinicius"),
    ("Jude Bellingham", "bellingham"),
    ("Mohamed Salah", "salah"),
    ("Robert Lewandowski", "lewandowski"),
    ("Kevin De Bruyne", "de-bruyne"),
    ("Harry Kane", "kane"),
    ("Luka Modrić", "modric"),
    ("Luis Suárez", "suarez"),
    ("Antoine Griezmann", "griezmann"),
    ("Cesc Fàbregas", "fabregas"),
    ("Robin van Persie", "van-persie"),
    ("Michael Owen", "owen"),
    ("Alexis Sánchez", "sanchez"),
    ("Carlos Tevez", "tevez"),
    ("Clarence Seedorf", "seedorf"),
    ("Edgar Davids", "davids"),
    ("Patrick Vieira", "vieira"),
    ("Ashley Cole", "ashley-cole"),
    ("Samuel Eto'o", "etoo"),
]

output_dir = "/Users/roman/Desktop/TikTok/images/players"
os.makedirs(output_dir, exist_ok=True)

print(f"🎯 Загружаю {len(players_to_download)} фото с SoFIFA...")
print("⏱️  С задержкой 3 секунды между запросами (не DDos)")

# SoFIFA использует CDN для фото
# Паттерн: https://cdn.sofifa.com/players/{player_id}/26_60.png
# Но ID нам неизвестен, поэтому используем поиск

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
})

success_count = 0
failed = []

for search_name, filename in players_to_download:
    try:
        print(f"📥 {search_name}...", end=" ")
        
        # Поиск игрока
        search_url = f"https://sofifa.com/players?keyword={quote(search_name)}"
        resp = session.get(search_url, timeout=10)
        
        if resp.status_code == 200:
            # Ищем первое фото игрока в HTML
            # Паттерн: <img data-src="https://cdn.sofifa.com/players/...
            import re
            img_match = re.search(r'data-src="(https://cdn\.sofifa\.com/players/[^"]+\.png)"', resp.text)
            
            if img_match:
                photo_url = img_match.group(1)
                
                # Скачиваем фото
                photo_resp = session.get(photo_url, timeout=10)
                if photo_resp.status_code == 200:
                    filepath = os.path.join(output_dir, f"{filename}.png")
                    with open(filepath, 'wb') as f:
                        f.write(photo_resp.content)
                    print(f"✅ ({len(photo_resp.content)} bytes)")
                    success_count += 1
                else:
                    print(f"❌ Фото не загрузилось")
                    failed.append(search_name)
            else:
                print(f"❌ Не найдено")
                failed.append(search_name)
        else:
            print(f"❌ Ошибка {resp.status_code}")
            failed.append(search_name)
        
        # Задержка 3 секунды между запросами
        time.sleep(3)
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        failed.append(search_name)
        time.sleep(3)

print(f"\n{'='*50}")
print(f"✅ Успешно загружено: {success_count}/{len(players_to_download)}")
if failed:
    print(f"❌ Не удалось: {len(failed)}")
    print(f"   {', '.join(failed[:5])}...")
