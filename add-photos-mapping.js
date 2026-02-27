/**
 * Добавить фото к игрокам в index.html
 */
const fs = require('fs');

// Маппинг имен игроков -> файл фото
const photoMapping = {
  // Legends
  "Pelé": null, // не нашли
  "Maradona": "maradona.png",
  "Cruyff": "cruyff.png",
  "Beckenbauer": "beckenbauer.png",
  "Zidane": "zidane.png",
  "Ronaldinho": "ronaldinho.png",
  "Henry": "henry.png",
  "Maldini": "maldini.png",
  "Best": "best.png",
  "Di Stéfano": null, // нет в базе
  "Eusébio": null, // не нашли
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
  
  // Players
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
};

// Читаем index.html
const html = fs.readFileSync('/Users/roman/Desktop/TikTok/index.html', 'utf8');

// Функция для добавления photo к объектам
function addPhotos(jsonStr, mapping) {
  const arr = JSON.parse(jsonStr);
  return arr.map(player => {
    const photo = mapping[player.name];
    if (photo) {
      return { ...player, photo: `/images/players/${photo}` };
    }
    return player;
  });
}

// Извлекаем legends массив
const legendsMatch = html.match(/const legends=(\[.*?\]);/);
if (!legendsMatch) {
  console.error('❌ Не найден legends массив');
  process.exit(1);
}

// Извлекаем players массив
const playersMatch = html.match(/const players=(\[.*?\]);/);
if (!playersMatch) {
  console.error('❌ Не найден players массив');
  process.exit(1);
}

// Добавляем фото
const legendsWithPhotos = addPhotos(legendsMatch[1], photoMapping);
const playersWithPhotos = addPhotos(playersMatch[1], photoMapping);

// Форматируем обратно в JS
const newLegendsStr = `const legends=${JSON.stringify(legendsWithPhotos)};`;
const newPlayersStr = `const players=${JSON.stringify(playersWithPhotos)};`;

// Заменяем в HTML
let newHtml = html.replace(/const legends=\[.*?\];/, newLegendsStr);
newHtml = newHtml.replace(/const players=\[.*?\];/, newPlayersStr);

// Сохраняем
fs.writeFileSync('/Users/roman/Desktop/TikTok/index.html', newHtml, 'utf8');

console.log('✅ Фото добавлены к игрокам!');
console.log(`   Legends: ${legendsWithPhotos.filter(p => p.photo).length}/${legendsWithPhotos.length} с фото`);
console.log(`   Players: ${playersWithPhotos.filter(p => p.photo).length}/${playersWithPhotos.length} с фото`);
