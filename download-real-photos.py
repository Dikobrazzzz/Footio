#!/usr/bin/env python3
"""
Загрузка реальных фото футболистов с TheSportsDB API
Бесплатно, легально, с задержками
"""
import requests
import time
import os
import sys

# Список всех игроков
PLAYERS = [
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
    ("Eusébio", "eusebio"),
    ("Michel Platini", "platini"),
    ("Marco van Basten", "van-basten"),
    ("Gerd Müller", "muller"),
    ("Bobby Charlton", "charlton"),
    ("Ronaldo Nazário", "ronaldo"),
    ("Ferenc Puskás", "puskas"),
    ("Lothar Matthäus", "matthaus"),
    ("Andrés Iniesta", "iniesta"),
    ("Xavi Hernández", "xavi"),
    ("Kaká", "kaka"),
    ("David Beckham", "beckham"),
    ("Dennis Bergkamp", "bergkamp"),
    ("Rivaldo", "rivaldo"),
    ("Gheorghe Hagi", "hagi"),
    
    # Современные игроки
    ("Cristiano Ronaldo", "cristiano-ronaldo"),
    ("Zlatan Ibrahimović", "zlatan"),
    ("Lionel Messi", "messi"),
    ("Kylian Mbappé", "mbappe"),
    ("Neymar", "neymar"),
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
    ("Ashley Cole", "cole"),
    ("Samuel Eto'o", "etoo"),
]

output_dir = "/Users/roman/Desktop/TikTok/images/players"
os.makedirs(output_dir, exist_ok=True)

print(f"🎯 Загружаю {len(PLAYERS)} фото с TheSportsDB API...")
print(f"⏱️  С задержкой 2 сек между запросами\n")

success = 0
failed = []

for search_name, filename in PLAYERS:
    try:
        print(f"📥 {search_name:30s} ... ", end="", flush=True)
        
        # API запрос
        url = f"https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p={requests.utils.quote(search_name)}"
        resp = requests.get(url, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            
            if data.get('player') and len(data['player']) > 0:
                player = data['player'][0]
                
                # Берем cutout (вырезанное фото на прозрачном фоне)
                photo_url = player.get('strCutout') or player.get('strThumb')
                
                if photo_url:
                    # Скачиваем фото
                    photo_resp = requests.get(photo_url, timeout=10)
                    if photo_resp.status_code == 200:
                        ext = 'png' if 'cutout' in photo_url else 'jpg'
                        filepath = os.path.join(output_dir, f"{filename}.{ext}")
                        
                        with open(filepath, 'wb') as f:
                            f.write(photo_resp.content)
                        
                        size_kb = len(photo_resp.content) / 1024
                        print(f"✅ ({size_kb:.1f} KB)")
                        success += 1
                    else:
                        print(f"❌ Фото недоступно")
                        failed.append(search_name)
                else:
                    print(f"❌ URL фото не найден")
                    failed.append(search_name)
            else:
                print(f"❌ Игрок не найден в базе")
                failed.append(search_name)
        else:
            print(f"❌ API ошибка {resp.status_code}")
            failed.append(search_name)
        
        # Задержка между запросами
        time.sleep(2)
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        failed.append(search_name)
        time.sleep(2)

print(f"\n{'='*60}")
print(f"✅ Успешно: {success}/{len(PLAYERS)}")
print(f"❌ Не найдено: {len(failed)}")
if failed:
    print(f"\n📝 Не загружены:")
    for name in failed[:10]:
        print(f"   - {name}")
    if len(failed) > 10:
        print(f"   ... и еще {len(failed) - 10}")
