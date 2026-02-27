#!/bin/bash
cd /Users/roman/Desktop/TikTok/images/players

echo "🎯 Загружаю фото с SoFIFA CDN..."

# Формат: https://cdn.sofifa.com/players/{ID}/26_60.png
# ID найдены на sofifa.com

# Топ игроки (ID известны)
curl -s "https://cdn.sofifa.com/players/020/801/26_60.png" -o cristiano.png && echo "✅ Cristiano Ronaldo"
sleep 2

curl -s "https://cdn.sofifa.com/players/015/8023/26_60.png" -o messi.png && echo "✅ Messi"  
sleep 2

curl -s "https://cdn.sofifa.com/players/023/1747/26_60.png" -o mbappe.png && echo "✅ Mbappé"
sleep 2

curl -s "https://cdn.sofifa.com/players/019/0871/26_60.png" -o neymar.png && echo "✅ Neymar"
sleep 2

curl -s "https://cdn.sofifa.com/players/023/9085/26_60.png" -o haaland.png && echo "✅ Haaland"
sleep 2

curl -s "https://cdn.sofifa.com/players/023/8794/26_60.png" -o vinicius.png && echo "✅ Vinícius Jr"
sleep 2

curl -s "https://cdn.sofifa.com/players/023/2356/26_60.png" -o bellingham.png && echo "✅ Bellingham"
sleep 2

curl -s "https://cdn.sofifa.com/players/020/9331/26_60.png" -o salah.png && echo "✅ Salah"
sleep 2

curl -s "https://cdn.sofifa.com/players/018/8545/26_60.png" -o lewandowski.png && echo "✅ Lewandowski"
sleep 2

curl -s "https://cdn.sofifa.com/players/019/2985/26_60.png" -o de-bruyne.png && echo "✅ De Bruyne"
sleep 2

curl -s "https://cdn.sofifa.com/players/019/4779/26_60.png" -o kane.png && echo "✅ Kane"
sleep 2

curl -s "https://cdn.sofifa.com/players/017/7003/26_60.png" -o modric.png && echo "✅ Modrić"
sleep 2

echo ""
echo "✅ Загружено $(ls -1 *.png 2>/dev/null | wc -l) фото"
