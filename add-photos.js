const fs = require('fs');

// Читаем HTML файл
let html = fs.readFileSync('/Users/roman/Desktop/TikTok/index.html', 'utf8');

// Находим массив legends
const legendsMatch = html.match(/const legends=\[(.*?)\];/s);
if (legendsMatch) {
    const legendsStr = legendsMatch[1];
    // Добавляем photo к каждому объекту
    const newLegendsStr = legendsStr.replace(/\{name:"([^"]+)"/g, (match, name) => {
        const photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=10b981&color=fff&bold=true&font-size=0.4`;
        return `{name:"${name}",photo:"${photoUrl}"`;
    });
    
    html = html.replace(legendsStr, newLegendsStr);
}

// Находим массив players
const playersMatch = html.match(/const players=\[(.*?)\];/s);
if (playersMatch) {
    const playersStr = playersMatch[1];
    // Добавляем photo к каждому объекту
    const newPlayersStr = playersStr.replace(/\{name:"([^"]+)"/g, (match, name) => {
        const photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=10b981&color=fff&bold=true&font-size=0.4`;
        return `{name:"${name}",photo:"${photoUrl}"`;
    });
    
    html = html.replace(playersStr, newPlayersStr);
}

// Записываем обратно
fs.writeFileSync('/Users/roman/Desktop/TikTok/index.html', html, 'utf8');
console.log('✅ Добавлены фото ко всем игрокам!');
