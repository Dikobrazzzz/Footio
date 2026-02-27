// Helper для генерации URL фото игроков

// Вариант 1: UI Avatars (бесплатно, без регистрации)
function getPlayerPhoto(name) {
  const initials = name.split(' ').map(n => n[0]).join('');
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=10b981&color=fff&bold=true`;
}

// Вариант 2: DiceBear Avatars (множество стилей)
function getPlayerAvatarStyle(name) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=10b981`;
}

// Вариант 3: Boring Avatars
function getBoringAvatar(name) {
  return `https://source.boringavatars.com/beam/200/${encodeURIComponent(name)}?colors=10b981,059669,064e3b`;
}

// Тест
const testPlayers = ["Pelé", "Maradona", "Cristiano Ronaldo", "Messi"];
console.log("UI Avatars:");
testPlayers.forEach(p => console.log(`${p}: ${getPlayerPhoto(p)}`));
