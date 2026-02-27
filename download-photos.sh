#!/bin/bash

# Скрипт для загрузки фото игроков с Wikimedia Commons

cd /Users/roman/Desktop/TikTok/images/players

# Легенды
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Pel%C3%A9_c._late_1960s.jpg/200px-Pel%C3%A9_c._late_1960s.jpg" -o pele.jpg
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Maradona-Mundial_86_con_la_copa.JPG/200px-Maradona-Mundial_86_con_la_copa.JPG" -o maradona.jpg
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Johan_Cruijff_1974c.jpg/200px-Johan_Cruijff_1974c.jpg" -o cruyff.jpg
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Beckenbauer_DFB.jpg/200px-Beckenbauer_DFB.jpg" -o beckenbauer.jpg
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Zidane_2008.jpg/200px-Zidane_2008.jpg" -o zidane.jpg
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Ronaldinho10.jpg/200px-Ronaldinho10.jpg" -o ronaldinho.jpg
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Thierry_Henry_2018.jpg/200px-Thierry_Henry_2018.jpg" -o henry.jpg
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Paolo_Maldini_2012.jpg/200px-Paolo_Maldini_2012.jpg" -o maldini.jpg

# Современные игроки
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/200px-Cristiano_Ronaldo_2018.jpg" -o cristiano-ronaldo.jpg
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg/200px-Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg" -o messi.jpg
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Kylian_Mbapp%C3%A9_2023.jpg/200px-Kylian_Mbapp%C3%A9_2023.jpg" -o mbappe.jpg
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Neymar_Jr._with_Al_Hilal%2C_3_October_2023_-_03_%28cropped%29.jpg/200px-Neymar_Jr._with_Al_Hilal%2C_3_October_2023_-_03_%28cropped%29.jpg" -o neymar.jpg
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Erling_Haaland_2023_%28cropped%29.jpg/200px-Erling_Haaland_2023_%28cropped%29.jpg" -o haaland.jpg

echo "✅ Загружено $(ls -1 | wc -l) фото"
