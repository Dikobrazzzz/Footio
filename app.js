let _toastTimer=null;function showToast(msg,type='error'){const t=document.getElementById('toast');t.textContent=msg;t.style.borderColor=type==='error'?'var(--red)':type==='ok'?'var(--green)':'var(--border)';t.style.color=type==='error'?'var(--red)':type==='ok'?'var(--green)':'var(--text)';t.style.opacity='1';t.style.transform='translateX(-50%) translateY(0)';clearTimeout(_toastTimer);_toastTimer=setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(-50%) translateY(20px)'},3200);}
function clubImg(name,size=24){return clubLogos[name]?`<img src="${clubLogos[name]}" width="${size}" height="${size}" style="width:${size}px;height:${size}px;object-fit:contain;vertical-align:middle">`:name}
let stats=JSON.parse(localStorage.getItem('f11'))||{g:0,w:0,s:0};
function save(skipSync){localStorage.setItem('f11',JSON.stringify(stats));if(!skipSync&&typeof syncStats==='function')syncStats()}
function getToday(){return new Date().toISOString().split('T')[0]}
function isPlayedToday(game){const played=JSON.parse(localStorage.getItem('played')||'{}');const e=played[game];if(!e)return false;return(typeof e==='string'?e:e.d)===getToday();}
function markPlayed(game,won){const played=JSON.parse(localStorage.getItem('played')||'{}');played[game]={d:getToday(),w:won};localStorage.setItem('played',JSON.stringify(played));}
function getDailyScore(){const today=getToday();const played=JSON.parse(localStorage.getItem('played')||'{}');let w=0,l=0;for(const v of Object.values(played)){if(typeof v==='object'&&v.d===today){if(v.w===true)w++;else if(v.w===false)l++;}}return{w,l};}
function addDailyScore(){updateDailyScore();}
function checkPlayable(game){if(isPlayedToday(game)){showToast('You already played this game today! Come back tomorrow 🌅','info');return false}return true}
function updateDailyScore(){const d=getDailyScore();document.getElementById('daily-score-wins').textContent=`🟢 ${d.w}`;document.getElementById('daily-score-losses').textContent=`🔴 ${d.l}`;}
function updateProf(){document.getElementById('s-g').textContent=stats.g;document.getElementById('s-w').textContent=stats.w;document.getElementById('s-s').textContent=stats.s;renderProfUI();const my=stats.w*100+stats.s*50;loadLeaderboard();}
async function loadLeaderboard(){try{const [res,rankRes]=await Promise.all([fetch('/api/leaderboard'),authToken?apiFetch('/api/leaderboard/rank'):Promise.resolve(null)]);if(!res.ok)return;const data=await res.json();const my=stats.w*100+stats.s*50;const myName=authToken?profData.username:null;let all=data.map(r=>({n:r.username||'Player',s:(r.wins||0)*100+(r.streak||0)*50,me:myName&&r.username===myName}));if(!all.some(p=>p.me))all.push({n:'YOU',s:my,me:true});all.sort((a,b)=>b.s-a.s);const top8=all.slice(0,8);const myInTop=top8.some(p=>p.me);let html=top8.map((p,i)=>`<div class="lb-item ${p.me?'me':''}"><div class="lb-rank ${i<1?'g':i<2?'s':i<3?'b':'n'}">${i+1}</div><div class="lb-name">${p.n}</div><div class="lb-score">${p.s}</div></div>`).join('');if(!myInTop&&rankRes&&rankRes.ok){const{rank}=await rankRes.json();html+=`<div class="lb-my-rank">📍 Your rank: <strong style="color:var(--green)">#${rank}</strong><span style="margin-left:auto">${my} pts</span></div>`;}document.getElementById('lb-list').innerHTML=html;}catch(e){console.warn('Leaderboard load failed',e);}}
const _ALL_GAMES=['legacy','grid','wordle','goltexto','pyramid','impostor'];
function updateGameCards(){_ALL_GAMES.forEach(g=>{const card=document.querySelector(`[onclick="showPage('${g}')"]`);if(card&&isPlayedToday(g)){card.style.opacity='0.5';card.style.pointerEvents='none';const playBtn=card.querySelector('.play-btn');if(playBtn)playBtn.textContent='PLAYED ✓'}});startCountdown();}
let _cdInterval=null;
function startCountdown(){clearInterval(_cdInterval);_tickCountdown();_cdInterval=setInterval(_tickCountdown,1000);}
function _tickCountdown(){const wrap=document.getElementById('countdown-wrap');if(!wrap)return;const allPlayed=_ALL_GAMES.every(g=>isPlayedToday(g));if(!allPlayed){wrap.style.display='none';return;}wrap.style.display='block';const now=Date.now();const midnight=new Date();midnight.setUTCHours(24,0,0,0);const diff=midnight.getTime()-now;if(diff<=0){wrap.style.display='none';clearInterval(_cdInterval);return;}const hh=String(Math.floor(diff/3600000)).padStart(2,'0');const mm=String(Math.floor((diff%3600000)/60000)).padStart(2,'0');const ss=String(Math.floor((diff%60000)/1000)).padStart(2,'0');document.getElementById('countdown-time').textContent=`${hh}:${mm}:${ss}`;}
const _pages=['home','profile','legacy','grid','wordle','goltexto','pyramid','impostor'];
function showPage(id){if(!_pages.includes(id))id='home';document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById('page-'+id).classList.add('active');if(id==='profile'){updateProf();if(authToken)loadProfFromDB();}if(id==='home')updateGameCards();window.scrollTo(0,0);history.replaceState(null,'','#'+id);}
function setupAC(inId,listId,data,onSel,filter){const inp=document.getElementById(inId),list=document.getElementById(listId);inp.oninput=()=>{const q=inp.value.toLowerCase().trim();if(q.length<2){list.classList.remove('show');return}let f=data.filter(p=>p.name.toLowerCase().includes(q));if(filter)f=f.filter(filter);f=f.slice(0,5);if(!f.length){list.classList.remove('show');return}list.innerHTML=f.map(p=>`<div class="ac-item" data-n="${p.name}">${p.photo?`<img src="${p.photo}" loading="lazy" width="32" height="32" style="width:32px;height:32px;border-radius:50%;object-fit:cover;object-position:top">`:`<span style="font-size:1.1rem">${p.flag}</span>`}<div><div style="font-weight:500">${p.name}</div><div style="font-size:.7rem;color:var(--text3)">${p.team||''}</div></div></div>`).join('');list.classList.add('show');list.querySelectorAll('.ac-item').forEach(item=>{item.onclick=()=>{onSel(data.find(p=>p.name===item.dataset.n));inp.value='';list.classList.remove('show')}})};inp.onblur=()=>setTimeout(()=>list.classList.remove('show'),200)}
let lastG='',lastS='';function showModal(t,g,s,l,m){lastG=g;lastS=s;document.getElementById('m-t').textContent=t;document.getElementById('sh-g').textContent=g;document.getElementById('sh-s').textContent=s;document.getElementById('sh-l').textContent=l;document.getElementById('m-m').textContent=m;document.getElementById('modal-o').classList.add('show');if(t.startsWith('🎉')&&typeof confetti==='function'){confetti({particleCount:120,spread:70,origin:{y:.6},colors:['#10b981','#f59e0b','#f1f5f9','#3b82f6']});}}
function closeModal(){document.getElementById('modal-o').classList.remove('show')}
function shareIG(){const c=document.createElement('canvas');c.width=400;c.height=500;const x=c.getContext('2d');const gr=x.createLinearGradient(0,0,400,500);gr.addColorStop(0,'#0a0f1a');gr.addColorStop(1,'#1a2332');x.fillStyle=gr;x.fillRect(0,0,400,500);x.strokeStyle='#10b981';x.lineWidth=4;x.beginPath();x.roundRect(10,10,380,480,16);x.stroke();x.fillStyle='#10b981';x.font='20px Outfit';x.textAlign='center';x.fillText(lastG,200,80);x.fillStyle='#f1f5f9';x.font='30px Bebas Neue';x.fillText('MY RESULT',200,140);x.fillStyle='#10b981';x.font='bold 100px Bebas Neue';x.fillText(lastS,200,280);x.fillStyle='#64748b';x.font='18px Outfit';x.fillText('⚽ footio.online',200,450);const a=document.createElement('a');a.download='footio.png';a.href=c.toDataURL();a.click();showToast('Image downloaded! Add to Instagram Stories.','ok')}
// Legacy
let legG={c:[],f:{},sl:0};function startLeg(){if(!checkPlayable('legacy'))return;document.getElementById('leg-i').style.display='none';document.getElementById('leg-g').style.display='block';initLeg()}function resetLeg(){if(isPlayedToday('legacy')){showToast('You already played this game today! Come back tomorrow 🌅','info');showPage('home');return}initLeg()}
function initLeg(){const all=[...new Set(legends.map(p=>p.country))].sort(()=>Math.random()-.5).slice(0,11);legG={c:all,f:{},sl:0};renderLeg();setupAC('leg-in','leg-ac',legends,selLeg,p=>legG.c.includes(p.country)&&!Object.values(legG.f).some(x=>x.name===p.name))}
function renderLeg(){const rows=[[0],[1,2,3,4],[5,6,7],[8,9,10]];document.getElementById('leg-f').innerHTML=rows.map(r=>`<div class="leg-row">${r.map(i=>{const c=legG.c[i],p=legG.f[i],fl=legends.find(x=>x.country===c)?.flag||'🏳️';return`<div class="leg-slot ${p?'filled':''} ${legG.sl===i?'active':''}" onclick="selLegSl(${i})">${p&&p.photo?`<img src="${p.photo}" loading="lazy" width="40" height="40" style="width:68px;height:68px;border-radius:50%;object-fit:cover;object-position:top;margin-bottom:3px">`:`<span class="fl">${fl}</span>`}<span class="cn">${c}</span>${p?`<span class="pn">${p.name.split(' ').pop()}</span>`:''}</div>`}).join('')}</div>`).join('');document.getElementById('leg-sc').textContent=`${Object.keys(legG.f).length}/11`}
function selLegSl(i){if(!legG.f[i]){legG.sl=i;renderLeg();document.getElementById('leg-in').focus()}}
function selLeg(p){const idx=legG.c.findIndex((c,i)=>c===p.country&&!legG.f[i]);if(idx===-1)return;legG.f[idx]=p;legG.sl=legG.c.findIndex((c,i)=>!legG.f[i]);renderLeg();if(Object.keys(legG.f).length===11){markPlayed('legacy',true);stats.g++;stats.w++;stats.s++;save();addDailyScore();showModal('🎉 You Won!','LEGACY 11','11/11','Legends','')}}
// Grid
let gridG={r:[],cl:[],ce:Array(9).fill(null),gu:9,ac:null};function startGrid(){if(!checkPlayable('grid'))return;document.getElementById('grid-i').style.display='none';document.getElementById('grid-g').style.display='block';initGrid()}function resetGrid(){if(isPlayedToday('grid')){showToast('You already played this game today! Come back tomorrow 🌅','info');showPage('home');return}initGrid()}
function initGrid(){const sh=[...clubs].sort(()=>Math.random()-.5);gridG={r:sh.slice(0,3),cl:sh.slice(3,6),ce:Array(9).fill(null),gu:9,ac:0};renderGrid();document.getElementById('grid-iw').style.display='block';setupAC('grid-in','grid-ac',players,selGrid,p=>!gridG.ce.some(c=>c&&c.name===p.name))}
function renderGrid(){document.getElementById('grid-sc').textContent=gridG.gu;let h='<div class="grid-h corner"></div>';gridG.cl.forEach(c=>h+=`<div class="grid-h">${clubImg(c,48)}<div style="font-size:.85rem;margin-top:4px">${c}</div></div>`);for(let r=0;r<3;r++){h+=`<div class="grid-h">${clubImg(gridG.r[r],48)}<div style="font-size:.85rem;margin-top:4px">${gridG.r[r]}</div></div>`;for(let c=0;c<3;c++){const i=r*3+c,ce=gridG.ce[i];h+=`<div class="grid-c ${ce?'filled':''}" onclick="selGridC(${i})">${ce?ce.name.split(' ').pop():''}</div>`}}document.getElementById('grid-b').innerHTML=h}
function selGridC(i){if(gridG.ce[i]||gridG.gu<=0)return;gridG.ac=i;document.getElementById('grid-in').focus()}
function selGrid(p){if(gridG.ac===null&&gridG.ac!==0)return;const r=Math.floor(gridG.ac/3),c=gridG.ac%3;if(p.clubs&&p.clubs.includes(gridG.r[r])&&p.clubs.includes(gridG.cl[c]))gridG.ce[gridG.ac]=p;gridG.gu--;gridG.ac=null;renderGrid();const filled=gridG.ce.filter(c=>c).length;if(filled===9){markPlayed('grid',true);stats.g++;stats.w++;stats.s++;save();addDailyScore();showModal('🎉 You Won!','GRID','9/9','Perfect!','')}else if(gridG.gu<=0){markPlayed('grid',false);stats.g++;stats.s=0;save();addDailyScore();showModal('😢 Game Over','GRID',`${filled}/9`,'Cells','')}}
// Wordle
let wordG={t:null,g:[],m:8};function startWord(){if(!checkPlayable('wordle'))return;document.getElementById('word-i').style.display='none';document.getElementById('word-g').style.display='block';initWord()}function resetWord(){if(isPlayedToday('wordle')){showToast('You already played this game today! Come back tomorrow 🌅','info');showPage('home');return}initWord()}
function initWord(){wordG={t:players[Math.floor(Math.random()*players.length)],g:[],m:8};renderWord();document.getElementById('word-at').textContent=wordG.m;setupAC('word-in','word-ac',players,guessWord,p=>!wordG.g.some(x=>x.name===p.name))}
function renderWord(){const cats=[{i:'🏳️',l:'Nation'},{i:'🏟️',l:'Club'},{i:'📍',l:'Position'},{i:'🏆',l:'Common club'},{i:'📅',l:'Age'},{i:'👤',l:'Name'}];let h=`<div class="word-r">${cats.map(c=>`<div class="word-c"><span class="lbl">${c.i}</span><span style="font-size:.6rem;color:var(--text3);line-height:1">${c.l}</span></div>`).join('')}</div>`;for(let i=0;i<wordG.m;i++){const g=wordG.g[i];h+='<div class="word-r">';if(g){const t=wordG.t;h+=`<div class="word-c sm ${g.country===t.country?'correct':'wrong'}"><span class="val">${g.flag}</span></div>`;h+=`<div class="word-c sm ${g.team===t.team?'correct':'wrong'}"><span class="val">${(g.team||'').slice(0,6)}</span></div>`;h+=`<div class="word-c sm ${g.position===t.position?'correct':'wrong'}"><span class="val">${(g.position||'').slice(0,4)}</span></div>`;h+=`<div class="word-c sm ${g.clubs?.some(c=>t.clubs?.includes(c))?'partial':'wrong'}"><span class="val">Club</span></div>`;const ad=g.age-t.age,ac=ad===0?'correct':Math.abs(ad)<=2?'partial':'wrong',as=ad===0?'✓':ad>0?'↓':'↑';h+=`<div class="word-c sm ${ac}"><span class="val">${g.age}${as}</span></div>`;h+=`<div class="word-c sm ${g.name===t.name?'correct':'wrong'}"><span class="val">${g.name.split(' ').pop().slice(0,6)}</span></div>`}else{for(let j=0;j<6;j++)h+='<div class="word-c sm"></div>'}h+='</div>'}document.getElementById('word-b').innerHTML=h}
function guessWord(p){wordG.g.push(p);document.getElementById('word-at').textContent=wordG.m-wordG.g.length;renderWord();if(p.name===wordG.t.name){markPlayed('wordle',true);stats.g++;stats.w++;stats.s++;save();addDailyScore();showModal('🎉 You Won!','WORDLE',`${wordG.g.length}/${wordG.m}`,'Attempts',p.name)}else if(wordG.g.length>=wordG.m){markPlayed('wordle',false);stats.g++;stats.s=0;save();addDailyScore();showModal('😢 Game Over','WORDLE','0/'+wordG.m,'Not guessed','Answer: '+wordG.t.name)}}
// Goltexto
let goltG={t:null,g:[],b:0};function startGolt(){if(!checkPlayable('goltexto'))return;document.getElementById('golt-i').style.display='none';document.getElementById('golt-g').style.display='block';initGolt()}function resetGolt(){if(isPlayedToday('goltexto')){showToast('You already played this game today! Come back tomorrow 🌅','info');showPage('home');return}initGolt()}
function initGolt(){goltG={t:players[Math.floor(Math.random()*players.length)],g:[],b:0};renderGolt();setupAC('golt-in','golt-ac',players,guessGolt,p=>!goltG.g.some(x=>x.p.name===p.name))}
function calcGolt(p,t){let s=0;if(p.country===t.country)s+=200;if(p.team===t.team)s+=300;if(p.position===t.position)s+=150;if(p.clubs?.some(c=>t.clubs?.includes(c)))s+=150;s+=Math.max(0,200-Math.abs(p.age-t.age)*20);return Math.min(1000,s)}
function renderGolt(){const el=document.getElementById('golt-s');el.textContent=goltG.b;el.className='golt-sc '+(goltG.b>=800?'hot':goltG.b>=400?'warm':'cold');document.getElementById('golt-f').style.width=(goltG.b/10)+'%';document.getElementById('golt-gu').innerHTML=goltG.g.map(x=>`<div class="golt-guess"><span>${x.p.name}</span><span style="color:${x.s>=800?'var(--red)':x.s>=400?'var(--gold)':'var(--blue)'}">${x.s}</span></div>`).join('')}
function guessGolt(p){const s=calcGolt(p,goltG.t);goltG.g.unshift({p,s});if(s>goltG.b)goltG.b=s;renderGolt();if(s===1000){markPlayed('goltexto',true);stats.g++;stats.w++;stats.s++;save();addDailyScore();showModal('🎉 You Won!','GOLTEXTO',`${goltG.g.length}`,'Guesses',p.name)}}
// Pyramid
const pyrC=[
{n:"Most Goals",k:"goals",d:"legends"},
{n:"Most Trophies",k:"trophies",d:"legends"},
{n:"Highest Rating",k:"rating",d:"legends"},
{n:"Serie A Legends",k:"goals",d:"legends",f:p=>['Juventus','AC Milan','Inter'].some(t=>p.team===t)},
{n:"Premier League Legends",k:"rating",d:"legends",f:p=>['Man United','Liverpool','Arsenal','Chelsea','Man City'].some(t=>p.team===t)},
{n:"La Liga Legends",k:"rating",d:"legends",f:p=>['Real Madrid','Barcelona','Atletico'].some(t=>p.team===t)},
{n:"Oldest Active Stars",k:"age",d:"players"},
{n:"Youngest Stars",k:"age",d:"players",rev:true},
{n:"Premier League Stars",k:"age",d:"players",f:p=>['Man United','Liverpool','Arsenal','Chelsea','Man City','Tottenham','Aston Villa'].some(t=>p.team===t)},
{n:"Bundesliga Stars",k:"age",d:"players",f:p=>['Bayern','Leverkusen','Dortmund'].some(t=>p.team===t)},
{n:"Serie A Stars",k:"age",d:"players",f:p=>['Juventus','AC Milan','Inter','Napoli'].some(t=>p.team===t)},
{n:"La Liga Stars",k:"age",d:"players",f:p=>['Real Madrid','Barcelona','Atletico','Real Sociedad','Athletic Bilbao'].some(t=>p.team===t)},
{n:"Top Forwards",k:"age",d:"players",f:p=>p.position==='Forward'},
{n:"Top Midfielders",k:"age",d:"players",f:p=>p.position==='Midfielder'}
];let pyrG={c:null,p:[],pl:Array(10).fill(null),cu:0};
function startPyr(){if(!checkPlayable('pyramid'))return;document.getElementById('pyr-i').style.display='none';document.getElementById('pyr-g').style.display='block';initPyr()}function resetPyr(){if(isPlayedToday('pyramid')){showToast('You already played this game today! Come back tomorrow 🌅','info');showPage('home');return}initPyr()}
function initPyr(){let c,filtered,attempts=0;do{c=pyrC[Math.floor(Math.random()*pyrC.length)];const dataSource=c.d==='players'?players:legends;filtered=c.f?dataSource.filter(c.f):dataSource;attempts++}while(filtered.length<10&&attempts<20);const dataSource=c.d==='players'?players:legends;filtered=c.f?dataSource.filter(c.f):dataSource;const sorted=[...filtered].sort((a,b)=>c.rev?a[c.k]-b[c.k]:b[c.k]-a[c.k]).slice(0,10);const getRow=pos=>{if(pos===0)return 0;if(pos<=2)return 1;if(pos<=5)return 2;return 3};let randomOrder=sorted.map((p,i)=>({p,correctPos:i,row:getRow(i)}));let lastRow=-1;for(let i=randomOrder.length-1;i>0;i--){let swapIdx;let attempts=0;do{swapIdx=Math.floor(Math.random()*(i+1));attempts++}while(attempts<50&&swapIdx>0&&randomOrder[swapIdx].row===lastRow);[randomOrder[i],randomOrder[swapIdx]]=[randomOrder[swapIdx],randomOrder[i]];lastRow=randomOrder[i].row}pyrG={c,p:randomOrder.map(x=>x.p),correctPositions:randomOrder.map(x=>x.correctPos),pl:Array(10).fill(null),cu:0,sorted};renderPyr()}
function renderPyr(){document.getElementById('pyr-c').textContent=`📊 ${pyrG.c.n.toUpperCase()}`;const p=pyrG.p[pyrG.cu];const correctPos=pyrG.correctPositions[pyrG.cu];document.getElementById('pyr-p').innerHTML=p?`${p.photo?`<img src="${p.photo}" loading="lazy" width="50" height="50" style="width:50px;height:50px;border-radius:50%;object-fit:cover;object-position:top;margin:0 auto 8px;display:block">`:`<span style="font-size:1.5rem">${p.flag}</span>`}<span class="pyr-name">${p.name}</span><div class="pyr-team">${p.team}</div>`:'<span style="color:var(--green)">All placed! Submit</span>';const getRow=pos=>{if(pos===0)return 0;if(pos<=2)return 1;if(pos<=5)return 2;return 3};const correctRow=p?getRow(correctPos):-1;const rows=[[0],[1,2],[3,4,5],[6,7,8,9]];document.getElementById('pyr-b').innerHTML=rows.map((r,rowIdx)=>`<div class="pyr-row ${p&&rowIdx===correctRow?'highlight':''}">${r.map(i=>{const pl=pyrG.pl[i];return`<div class="pyr-slot ${pl?'filled':''}" onclick="placePyr(${i})">${pl?pl.name.split(' ').pop():i+1}</div>`}).join('')}</div>`).join('')}
function placePyr(sl){if(pyrG.pl[sl]||pyrG.cu>=pyrG.p.length)return;pyrG.pl[sl]=pyrG.p[pyrG.cu];pyrG.cu++;renderPyr()}
function subPyr(){if(pyrG.cu<10)return;let cor=0;pyrG.pl.forEach((p,i)=>{if(p&&pyrG.sorted[i]&&p.name===pyrG.sorted[i].name)cor++});markPlayed('pyramid',cor>=7);stats.g++;if(cor>=7){stats.w++;stats.s++;document.getElementById('pyr-hint').innerHTML='<span style="color:var(--green)">🎉 You won! Come back tomorrow!</span>';}else{stats.s=0;document.getElementById('pyr-hint').innerHTML='<span style="color:var(--red)">You lost. Come back again tomorrow.</span>';}save();addDailyScore();showModal(cor>=7?'🎉 You Won!':'😢 Game Over','PYRAMID',`${cor}/10`,'Correct','')}
// Impostor
const impC=[
{n:"Played for Barcelona",f:p=>p.clubs?.includes('Barcelona')},
{n:"Played for Real Madrid",f:p=>p.clubs?.includes('Real Madrid')},
{n:"Played for Man United",f:p=>p.clubs?.includes('Man United')},
{n:"Played for Chelsea",f:p=>p.clubs?.includes('Chelsea')},
{n:"Played for Liverpool",f:p=>p.clubs?.includes('Liverpool')},
{n:"Played for Juventus",f:p=>p.clubs?.includes('Juventus')},
{n:"Played for AC Milan",f:p=>p.clubs?.includes('AC Milan')},
{n:"Played for Inter",f:p=>p.clubs?.includes('Inter')},
{n:"Played for Bayern",f:p=>p.clubs?.includes('Bayern')},
{n:"Played for PSG",f:p=>p.clubs?.includes('PSG')},
{n:"Played for Arsenal",f:p=>p.clubs?.includes('Arsenal')},
{n:"Played for Atletico",f:p=>p.clubs?.includes('Atletico')},
{n:"Played for Man City",f:p=>p.clubs?.includes('Man City')},
{n:"Played for Tottenham",f:p=>p.clubs?.includes('Tottenham')},
{n:"Played for Leverkusen",f:p=>p.clubs?.includes('Leverkusen')},
{n:"French Players",f:p=>p.country==='France'},
{n:"Brazilian Players",f:p=>p.country==='Brazil'},
{n:"English Players",f:p=>p.country==='England'},
{n:"Spanish Players",f:p=>p.country==='Spain'},
{n:"German Players",f:p=>p.country==='Germany'},
{n:"Portuguese Players",f:p=>p.country==='Portugal'},
{n:"Argentine Players",f:p=>p.country==='Argentina'},
{n:"Italian Players",f:p=>p.country==='Italy'},
{n:"Dutch Players",f:p=>p.country==='Netherlands'},
{n:"Forward Position",f:p=>p.position==='Forward'},
{n:"Midfielder Position",f:p=>p.position==='Midfielder'},
{n:"Defender Position",f:p=>p.position==='Defender'},
{n:"Goalkeeper Position",f:p=>p.position==='Goalkeeper'}
].filter(c=>{const cor=players.filter(c.f);return cor.length>=5&&players.filter(p=>!c.f(p)).length>=3});let impG={c:null,ca:[],se:[],co:[]};
function startImp(){if(!checkPlayable('impostor'))return;document.getElementById('imp-i').style.display='none';document.getElementById('imp-g').style.display='block';initImp()}function resetImp(){if(isPlayedToday('impostor')){showToast('You already played this game today! Come back tomorrow 🌅','info');showPage('home');return}initImp()}
function initImp(){const c=impC[Math.floor(Math.random()*impC.length)];const cor=players.filter(c.f).sort(()=>Math.random()-.5).slice(0,5);const imp=players.filter(p=>!c.f(p)).sort(()=>Math.random()-.5).slice(0,3);const ca=[...cor,...imp].sort(()=>Math.random()-.5);impG={c,ca,se:[],co:cor.map(p=>p.name)};document.getElementById('imp-result').style.display='none';renderImp()}
function renderImp(){
  document.getElementById('imp-c').textContent=`🕵️ ${impG.c.n}`;
  const gr=document.getElementById('imp-gr');
  const existing=gr.querySelectorAll('.imp-card');
  if(existing.length===impG.ca.length){
    impG.ca.forEach((p,i)=>{
      const card=existing[i];
      card.classList.toggle('selected',impG.se.includes(i));
    });
  } else {
    gr.innerHTML=impG.ca.map((p,i)=>`<div class="imp-card ${impG.se.includes(i)?'selected':''}" onclick="togImp(${i})">${p.photo?`<img src="${p.photo}" loading="lazy" width="50" height="50" style="width:50px;height:50px;border-radius:50%;object-fit:cover;object-position:top">`:`<span class="fl">${p.flag}</span>`}<div class="nm">${p.name.split(' ').pop()}</div></div>`).join('');
  }
  document.getElementById('imp-sel').textContent=impG.se.length;
  document.getElementById('imp-tot').textContent=impG.co.length;
}
function togImp(i){const idx=impG.se.indexOf(i);if(idx>-1)impG.se.splice(idx,1);else{if(impG.se.length>=impG.co.length)return;impG.se.push(i)}renderImp()}
function subImp(){const selN=impG.se.map(i=>impG.ca[i].name);const allCor=selN.every(n=>impG.co.includes(n));const foundAll=selN.length===impG.co.length&&allCor;const impostorsSelected=selN.filter(n=>!impG.co.includes(n)).length;const correctMissed=impG.co.length-selN.filter(n=>impG.co.includes(n)).length;markPlayed('impostor',foundAll);stats.g++;if(foundAll){stats.w++;stats.s++;}else{stats.s=0;}save();addDailyScore();document.querySelectorAll('.imp-card').forEach((card,i)=>{const n=impG.ca[i].name;if(impG.co.includes(n))card.classList.add('correct');else card.classList.add('wrong')});setTimeout(()=>{showModal(foundAll?'🎉 You Won!':'😢 Game Over','IMPOSTOR',foundAll?'✓':'✗',foundAll?'Perfect!':'Try again tomorrow!','');let resultText='';if(!foundAll){if(impostorsSelected>0){resultText+=`You selected <strong style="color:var(--red)">${impostorsSelected} impostor${impostorsSelected>1?'s':''}</strong>`;if(correctMissed>0)resultText+=` and missed <strong style="color:var(--green)">${correctMissed} correct player${correctMissed>1?'s':''}</strong>`}else if(correctMissed>0){resultText+=`You missed <strong style="color:var(--green)">${correctMissed} correct player${correctMissed>1?'s':''}</strong>`}resultText+=`<br><br>Today's category was: <strong style="color:var(--cyan)">${impG.c.n}</strong><br><span style="color:var(--text3)">New game tomorrow!</span>`}else{resultText=`<strong style="color:var(--green)">Perfect!</strong> You found all correct players!<br><br>Today's category was: <strong style="color:var(--cyan)">${impG.c.n}</strong><br><span style="color:var(--text3)">New game tomorrow!</span>`}document.getElementById('imp-result-text').innerHTML=resultText;document.getElementById('imp-result').style.display='block'},800)}
updateGameCards();
updateDailyScore();

// ===== AUTH + PROFILE =====
let authToken=localStorage.getItem('footio_token')||null;
let authUser=null;
let profData={username:localStorage.getItem('prof_name')||'Player',avatar:localStorage.getItem('prof_avatar')||null};

async function apiFetch(url,opts={}){
  const headers=opts.headers||{};
  if(authToken)headers['Authorization']='Bearer '+authToken;
  if(opts.body&&typeof opts.body==='string')headers['Content-Type']='application/json';
  const res=await fetch(url,{...opts,headers});
  if(res.status===401){authToken=null;authUser=null;localStorage.removeItem('footio_token');renderProfUI();return null;}
  return res;
}

let pendingAuthEmail=null;

async function initAuth(){
  if(authToken){
    try{
      const res=await apiFetch('/api/auth/me');
      if(res&&res.ok){authUser=await res.json();await loadProfFromDB();}
      else{authToken=null;authUser=null;localStorage.removeItem('footio_token');}
    }catch(e){console.warn('Auth check failed',e);}
  }
  renderProfUI();
}

async function loadProfFromDB(){
  if(!authToken)return;
  try{
    const res=await apiFetch('/api/profile');
    if(res&&res.ok){
      const data=await res.json();
      if(data.username)profData.username=data.username;
      if(data.avatar_url)profData.avatar=data.avatar_url;
      localStorage.setItem('prof_name',profData.username);
      if(data.wins>stats.w)stats.w=data.wins;
      if(data.losses>(stats.g-stats.w))stats.g=stats.w+data.losses;
      if(data.streak>stats.s)stats.s=data.streak;
      _applyPlayedToday(data.played_today);
      save(true);
    }
  }catch(e){console.warn('Load profile failed',e);}
  renderProfUI();
}

function _applyPlayedToday(serverPlayed){
  if(!serverPlayed)return;
  const today=getToday();
  const played=JSON.parse(localStorage.getItem('played')||'{}');
  let changed=false;
  for(const [game,entry] of Object.entries(serverPlayed)){
    const date=typeof entry==='string'?entry:(entry&&entry.d?entry.d:'');
    if(date===today&&!isPlayedToday(game)){
      played[game]=typeof entry==='object'&&entry.d?entry:{d:date};
      changed=true;
    }
  }
  if(changed){localStorage.setItem('played',JSON.stringify(played));updateGameCards();updateDailyScore();}
}

async function syncStats(){
  if(!authToken)return;
  try{
    const played=JSON.parse(localStorage.getItem('played')||'{}');
    const res=await apiFetch('/api/stats/sync',{method:'POST',body:JSON.stringify({wins:stats.w,losses:stats.g-stats.w,streak:stats.s,played_today:played})});
    if(res&&res.ok){
      const d=await res.json();
      stats.w=d.wins;
      stats.g=d.wins+d.losses;
      stats.s=d.streak;
      _applyPlayedToday(d.played_today);
      save(true);
    }
  }catch(e){}
}

function renderProfUI(){
  const av=document.getElementById('prof-avatar');
  if(av){
    if(profData.avatar){av.innerHTML=`<img src="${profData.avatar}" style="width:100%;height:100%;object-fit:cover">`;}
    else{av.innerHTML='<span id="prof-avatar-emoji">⚽</span>';}
  }
  const nt=document.getElementById('prof-name-text');
  if(nt)nt.textContent=profData.username;
  const gp=document.getElementById('auth-guest-panel');
  const up=document.getElementById('auth-user-panel');
  const ed=document.getElementById('auth-email-disp');
  if(authUser){if(gp)gp.style.display='none';if(up)up.style.display='block';if(ed)ed.textContent=authUser.email;}
  else{if(gp)gp.style.display='block';if(up)up.style.display='none';}
}

function editProfName(){
  document.getElementById('prof-name-display').style.display='none';
  const inp=document.getElementById('prof-name-input');
  inp.style.display='inline-block';inp.value=profData.username;inp.focus();inp.select();
}
async function saveProfName(){
  const inp=document.getElementById('prof-name-input');
  const name=inp.value.trim()||'Player';
  profData.username=name;localStorage.setItem('prof_name',name);
  inp.style.display='none';document.getElementById('prof-name-display').style.display='inline-flex';
  document.getElementById('prof-name-text').textContent=name;
  if(authToken)await apiFetch('/api/profile',{method:'PUT',body:JSON.stringify({username:name})});
}

function handleAvatarUpload(input){
  const file=input.files[0];if(!file)return;
  const img=new Image(),reader=new FileReader();
  reader.onload=e=>{
    img.onload=async()=>{
      const canvas=document.createElement('canvas');canvas.width=200;canvas.height=200;
      const ctx=canvas.getContext('2d');
      const size=Math.min(img.width,img.height);
      ctx.drawImage(img,(img.width-size)/2,(img.height-size)/2,size,size,0,0,200,200);
      const b64=canvas.toDataURL('image/jpeg',.85);
      profData.avatar=b64;localStorage.setItem('prof_avatar',b64);
      renderProfUI();
      if(authToken){
        const blob=await(await fetch(b64)).blob();
        const fd=new FormData();fd.append('file',blob,'avatar.jpg');
        const res=await apiFetch('/api/profile/avatar',{method:'POST',body:fd});
        if(res&&res.ok){
          const data=await res.json();
          profData.avatar=data.avatar_url+'?t='+Date.now();
          localStorage.setItem('prof_avatar',profData.avatar);
          renderProfUI();
        }
      }
    };img.src=e.target.result;
  };reader.readAsDataURL(file);input.value='';
}

function getOtpCells(){return Array.from(document.querySelectorAll('#otp-boxes .otp-cell'))}
function getOtpValue(){return getOtpCells().map(c=>c.value).join('')}
function clearOtp(){getOtpCells().forEach(c=>{c.value='';c.classList.remove('filled')})}
function initOtpInputs(){
  const cells=getOtpCells();
  cells.forEach((cell,i)=>{
    cell.oninput=e=>{
      const v=cell.value.replace(/\D/g,'');
      cell.value=v?v[v.length-1]:'';
      cell.classList.toggle('filled',!!cell.value);
      if(cell.value&&i<cells.length-1)cells[i+1].focus();
      if(getOtpValue().length===6)authVerifyCode();
    };
    cell.onkeydown=e=>{
      if(e.key==='Backspace'&&!cell.value&&i>0){cells[i-1].focus();cells[i-1].value='';cells[i-1].classList.remove('filled');}
      if(e.key==='ArrowLeft'&&i>0)cells[i-1].focus();
      if(e.key==='ArrowRight'&&i<cells.length-1)cells[i+1].focus();
    };
    cell.onpaste=e=>{
      e.preventDefault();
      const text=(e.clipboardData||window.clipboardData).getData('text').replace(/\D/g,'').slice(0,6);
      if(!text)return;
      cells.forEach((c,j)=>{c.value=text[j]||'';c.classList.toggle('filled',!!c.value);});
      const next=Math.min(text.length,cells.length-1);
      cells[next].focus();
      if(text.length===6)authVerifyCode();
    };
  });
}
async function authSendCode(){
  const email=document.getElementById('auth-email-inp').value.trim();
  if(!/\S+@\S+\.\S+/.test(email)){showToast('Enter a valid email');return;}
  const btn=document.getElementById('auth-send-btn');btn.textContent='Sending...';btn.disabled=true;
  try{
    const res=await fetch('/api/auth/send-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
    if(res.ok){
      pendingAuthEmail=email;
      document.getElementById('auth-step-email').style.display='none';
      document.getElementById('auth-step-code').style.display='block';
      document.getElementById('auth-code-email').textContent=email;
      clearOtp();
      initOtpInputs();
      getOtpCells()[0].focus();
    }else{const d=await res.json();showToast(d.detail||'Failed to send code');}
  }catch(e){showToast('Network error');}
  btn.textContent='Send Code';btn.disabled=false;
}
async function authVerifyCode(){
  const code=getOtpValue();
  if(code.length!==6){return;}
  const btn=document.getElementById('auth-verify-btn');btn.textContent='Verifying...';btn.disabled=true;
  try{
    const res=await fetch('/api/auth/verify-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:pendingAuthEmail,code})});
    if(res.ok){
      const data=await res.json();
      authToken=data.token;authUser={email:data.email};
      localStorage.setItem('footio_token',authToken);
      await loadProfFromDB();
      document.getElementById('auth-step-code').style.display='none';
      document.getElementById('auth-step-email').style.display='block';
      document.getElementById('auth-email-inp').value='';
      renderProfUI();
    }else{
      const d=await res.json();
      clearOtp();getOtpCells()[0].focus();
      btn.textContent='Verify';btn.disabled=false;
      showToast(d.detail||'Invalid code');
    }
  }catch(e){btn.textContent='Verify';btn.disabled=false;showToast('Network error');}
}
function authBackToEmail(){
  document.getElementById('auth-step-code').style.display='none';
  document.getElementById('auth-step-email').style.display='block';
  clearOtp();
}
async function sbSignOut(){
  try{await apiFetch('/api/auth/logout',{method:'POST'});}catch(e){}
  authToken=null;authUser=null;localStorage.removeItem('footio_token');renderProfUI();
}

showPage(_pages.includes(location.hash.slice(1))?location.hash.slice(1):'home');
initAuth();
