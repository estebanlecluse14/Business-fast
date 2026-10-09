const updatesModal=document.getElementById('updatesModal');
document.getElementById('updatesBtn').addEventListener('click',()=>{
  updatesModal.classList.add('open');
  updatesModal.setAttribute('aria-hidden','false');
});
document.getElementById('updatesClose').addEventListener('click',()=>{
  updatesModal.classList.remove('open');
  updatesModal.setAttribute('aria-hidden','true');
});
updatesModal.addEventListener('click',e=>{
  if(e.target===updatesModal){
    updatesModal.classList.remove('open');
    updatesModal.setAttribute('aria-hidden','true');
  }
});

const patrimonyModal=document.getElementById('patrimonyModal');
document.getElementById('patrimonyBtn')?.addEventListener('click',openPatrimony);
document.getElementById('patrimonyClose')?.addEventListener('click',closePatrimony);
patrimonyModal?.addEventListener('click',e=>{if(e.target===patrimonyModal)closePatrimony()});

const journalModal=document.getElementById('journalModal');
document.getElementById('journalBtn').addEventListener('click',()=>{
  journalModal.classList.add('open');
  journalModal.setAttribute('aria-hidden','false');
});
document.getElementById('journalClose').addEventListener('click',()=>{
  journalModal.classList.remove('open');
  journalModal.setAttribute('aria-hidden','true');
});
journalModal.addEventListener('click',e=>{
  if(e.target===journalModal){
    journalModal.classList.remove('open');
    journalModal.setAttribute('aria-hidden','true');
  }
});

const moneyFmt = n => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
const PRICE_STEP=5000;
const RENT_STEP=5000;
const roundPriceStep = n => Math.max(0, Math.floor((n||0)/PRICE_STEP)*PRICE_STEP);
const roundRentStep = n => (n||0)<=0 ? 0 : Math.max(RENT_STEP, Math.round((n||0)/RENT_STEP)*RENT_STEP);
const shortMoneyFmt = n => {
  const abs=Math.abs(n||0), sign=(n||0)<0?'-':'';
  if(abs>=1000){
    const v=Math.round(abs/1000);
    return `${sign}${v}k`;
  }
  return `${sign}${Math.round(abs)}€`;
};
const colors=['#22c55e','#3b82f6','#ef4444','#eab308'];
const diceFaces=[0,1,2,3,4,5,6];
const performanceLiteMode=true;
document.documentElement.classList.add('performance-lite','crisp-render');

/* --- Moteur audio synthétique, sans fichier externe --- */
let audioCtx=null,musicGain=null,sfxGain=null,musicTimer=null,musicStep=0,lobbyMusicTimer=null,lobbyMusicStep=0;
let audioSettings={music:true,sfx:true,musicVolume:.28,sfxVolume:.55};
try{const saved=JSON.parse(localStorage.getItem('businessFastAudio')||'null');if(saved)audioSettings={...audioSettings,...saved}}catch(e){}
function saveAudioSettings(){try{localStorage.setItem('businessFastAudio',JSON.stringify(audioSettings))}catch(e){}}
function ensureAudio(){
 if(!audioCtx){
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
  audioCtx=new AC();
  musicGain=audioCtx.createGain();sfxGain=audioCtx.createGain();
  musicGain.connect(audioCtx.destination);sfxGain.connect(audioCtx.destination);
 }
 if(audioCtx.state==='suspended')audioCtx.resume();
 updateAudioGains();return true;
}
function updateAudioGains(){
 if(musicGain)musicGain.gain.value=audioSettings.music?audioSettings.musicVolume*.20:0;
 if(sfxGain)sfxGain.gain.value=audioSettings.sfx?audioSettings.sfxVolume*.32:0;
}
function tone(freq,dur=.12,type='sine',vol=.18,delay=0,dest=null){
 if(!ensureAudio())return;
 const now=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();
 o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.001,vol),now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+dur);
 o.connect(g);g.connect(dest||sfxGain);o.start(now);o.stop(now+dur+.03);
}
function playSfx(name){
 if(!audioSettings.sfx||!ensureAudio())return;
 const f={
  click:()=>tone(520,.06,'square',.08),
  open:()=>{tone(420,.08,'sine',.08);tone(650,.11,'sine',.06,.05)},
  close:()=>{tone(500,.07,'sine',.07);tone(330,.10,'sine',.05,.04)},
  dice:()=>tone(150+Math.random()*100,.045,'square',.07),
  step:()=>tone(250,.045,'triangle',.055),
  buy:()=>{tone(440,.09,'triangle',.09);tone(660,.12,'triangle',.08,.07);tone(880,.16,'triangle',.06,.14)},
  build:()=>{tone(220,.08,'square',.07);tone(330,.09,'square',.06,.06);tone(494,.12,'triangle',.07,.13)},
  money:()=>{tone(740,.055,'sine',.07);tone(990,.09,'sine',.055,.05)},
  bad:()=>{tone(240,.13,'sawtooth',.06);tone(180,.18,'sawtooth',.045,.10)},
  turn:()=>{tone(390,.07,'triangle',.05);tone(520,.08,'triangle',.05,.06)},
  start:()=>{tone(392,.12,'triangle',.07);tone(523,.16,'triangle',.065,.10);tone(659,.20,'triangle',.06,.20)}
 }[name];if(f)f();
}
const musicChords=[
 [130.81,164.81,196.00,261.63],
 [146.83,174.61,220.00,293.66],
 [110.00,146.83,164.81,220.00],
 [164.81,196.00,246.94,329.63],
 [98.00,130.81,164.81,196.00],
 [116.54,146.83,174.61,233.08]
];
function playAmbientChord(){
 if(!audioSettings.music||!ensureAudio())return;
 const chord=musicChords[musicStep++%musicChords.length];
 const beat=audioCtx.currentTime;

 // Pad court et plus rythmé.
 chord.forEach((f,i)=>{
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=i===0?'sine':'triangle';o.frequency.value=f;
  g.gain.setValueAtTime(.0001,beat);
  g.gain.exponentialRampToValueAtTime(i===0?.048:.022,beat+.08);
  g.gain.exponentialRampToValueAtTime(.0001,beat+1.25);
  o.connect(g);g.connect(musicGain);o.start(beat);o.stop(beat+1.32);
 });

 // Basse + pulsation légère : dynamique sans devenir agressive.
 tone(chord[0]/2,.18,'sine',.040,0,musicGain);
 tone(chord[0]/2,.13,'sine',.028,.48,musicGain);
 tone(chord[1]*2,.055,'triangle',.018,.24,musicGain);
 tone(chord[2]*2,.045,'triangle',.015,.72,musicGain);
}
function startAmbient(){
 if(!audioSettings.music||musicTimer)return;
 stopLobbyMusic();ensureAudio();
 musicStep=0;
 playAmbientChord();
 musicTimer=setInterval(playAmbientChord,1250)
}
function stopAmbient(){if(musicTimer){clearInterval(musicTimer);musicTimer=null}}
const lobbySequence=[
 [261.63,329.63,392.00],[293.66,369.99,440.00],[329.63,392.00,493.88],[293.66,349.23,440.00]
];
function playLobbyPhrase(){
 if(!audioSettings.music||!ensureAudio())return;
 const chord=lobbySequence[lobbyMusicStep++%lobbySequence.length];
 chord.forEach((f,i)=>tone(f,.72,i===0?'sine':'triangle',i===0?.032:.018,i*.07,musicGain));
 tone(chord[0]/2,.95,'sine',.018,0,musicGain);
}
function startLobbyMusic(){
 if(!audioSettings.music||lobbyMusicTimer||!document.getElementById('startScreen')?.classList.contains('active'))return;
 ensureAudio();stopAmbient();playLobbyPhrase();lobbyMusicTimer=setInterval(playLobbyPhrase,1850);
}
function stopLobbyMusic(){if(lobbyMusicTimer){clearInterval(lobbyMusicTimer);lobbyMusicTimer=null}}

function applyAudioSettings(){
 updateAudioGains();
 if(audioSettings.music){
   if(document.getElementById('startScreen')?.classList.contains('active'))startLobbyMusic();
   else startAmbient();
 }else{
   stopAmbient();stopLobbyMusic();
 }
 saveAudioSettings();syncAudioUI()
}
function syncAudioUI(){
 const mt=document.getElementById('musicToggle'),st=document.getElementById('sfxToggle'),mv=document.getElementById('musicVolume'),sv=document.getElementById('sfxVolume');
 if(mt){mt.textContent=audioSettings.music?'Activée':'Désactivée';mt.classList.toggle('on',audioSettings.music)}
 if(st){st.textContent=audioSettings.sfx?'Activés':'Désactivés';st.classList.toggle('on',audioSettings.sfx)}
 if(mv)mv.value=Math.round(audioSettings.musicVolume*100);if(sv)sv.value=Math.round(audioSettings.sfxVolume*100);
}

const AI_NAMES=[
 'Oliver','Noah','Liam','Ethan','Mason','Logan','Lucas','Henry','Jack','Leo',
 'Emma','Olivia','Ava','Sophia','Mia','Amelia','Chloe','Grace','Lily','Ruby'
];
const AI_RESERVE=55000;
let aiBusy=false,aiTimer=null;
function randomAiName(used=[]){
 const pool=AI_NAMES.filter(n=>!used.includes(n));
 return pool.length?pool[Math.floor(Math.random()*pool.length)]:`AI ${used.length+1}`;
}
function isAIPlayer(index=current){return !!players[index]?.isAI}
function aiDelay(ms=520){return new Promise(r=>setTimeout(r,ms))}
function aiDistrictNeed(playerIndex,s){
 if(!s?.district)return 0;
 const d=wonderDistricts.find(x=>x.name===s.district);
 if(!d)return 0;
 return d.ids.filter(id=>spaces[id].owner===playerIndex).length;
}
function aiShouldBuy(playerIndex,s){
 const p=players[playerIndex],price=purchasePrice(s);
 if(!p||!s||s.owner!==null||!['property','beach'].includes(s.type)||p.money<price)return false;
 const reserve=s.type==='beach'?35000:AI_RESERVE;
 const districtScore=aiDistrictNeed(playerIndex,s);
 if(districtScore>=2)return p.money-price>=25000;
 if(s.type==='beach'&&p.beaches>=2)return p.money-price>=20000;
 const yieldScore=price?currentRent(s)/price:0;
 return p.money-price>=reserve && (yieldScore>=.15 || districtScore>=1 || s.type==='beach');
}
function aiShouldBuild(playerIndex,s){
 const p=players[playerIndex];
 if(!p||!s||s.type!=='property'||s.owner!==playerIndex||s.level>=3)return false;
 const cost=upgradeCost(s,s.level+1)||Infinity;
 if(p.money<cost)return false;
 const districtScore=aiDistrictNeed(playerIndex,s);
 const reserve=districtScore>=3?40000:AI_RESERVE;
 return p.money-cost>=reserve;
}
function aiShouldBuyout(playerIndex,s){
 const p=players[playerIndex],price=buyoutPrice(s);
 if(!p||p.money<price)return false;
 const districtScore=aiDistrictNeed(playerIndex,s);
 return districtScore>=2 && p.money-price>=35000;
}
function aiHandleOpenModal(){
 if(!isAIPlayer()||gameOver)return false;
 const modalEl=document.getElementById('modal');
 if(!modalEl?.classList.contains('open'))return false;
 const p=players[current],s=spaces[p.pos];
 if(pendingRentDecision){
   if(aiShouldBuyout(current,s)){
     const b=modalEl.querySelector('.buyout:not(:disabled)');if(b){b.click();return true}
   }
   const pay=modalEl.querySelector('.pay-rent');if(pay){pay.click();return true}
 }
 if(pendingDebt){
   const saleButtons=[...modalEl.querySelectorAll('[data-sell-id]')];
   if(saleButtons.length){
     saleButtons.sort((a,b)=>parcelValue(spaces[+b.dataset.sellId])-parcelValue(spaces[+a.dataset.sellId]));
     saleButtons[0].click();return true;
   }
   const bankrupt=modalEl.querySelector('.danger');if(bankrupt){bankrupt.click();return true}
 }
 const fast=modalEl.querySelector('#wonderFast:not(:disabled)');
 const collective=modalEl.querySelector('#wonderCollective');
 if(fast||collective){
   if(fast && p.money>=500000){fast.click();return true}
   if(collective){collective.click();return true}
 }
 const spread=[...modalEl.querySelectorAll('button')].find(b=>b.textContent.includes('Échelonner'));
 const payNow=[...modalEl.querySelectorAll('button')].find(b=>b.textContent.includes('Payer 20'));
 if(spread||payNow){
   if(payNow&&p.money-20000>=AI_RESERVE)payNow.click(); else spread?.click();
   return true;
 }
 const ok=modalEl.querySelector('#modalOk');
 if(ok&&!ok.disabled){ok.click();return true}
 return false;
}
async function runAITurn(){
 if(aiBusy||gameOver||!isAIPlayer())return;
 aiBusy=true;
 const aiIndex=current;
 try{
   await aiDelay(520);
   if(current!==aiIndex||gameOver)return;

   // Toute fenêtre de décision appartenant à l'IA est traitée automatiquement.
   if(aiHandleOpenModal()){
     await aiDelay(360);
     return;
   }

   if(!rolled){
     addLog(`🤖 <b>${players[current].name}</b> analyse le plateau et lance les dés.`);
     rollBtn.click();
     return;
   }

   const p=players[current],s=spaces[p.pos];

   if(canLaunchWonder(current)){
     addLog(`🤖 <b>${p.name}</b> sécurise un quartier complet et prépare une Merveille.`);
     openWonderModal();
     return;
   }

   if(aiShouldBuy(current,s)&&!buyBtn.disabled){
     addLog(`🤖 <b>${p.name}</b> juge ${s.name} rentable et l'achète.`);
     buyBtn.click();
     await aiDelay(300);
   }

   if(current!==aiIndex||gameOver)return;

   if(aiShouldBuild(current,s)&&!buildBtn.disabled){
     addLog(`🤖 <b>${p.name}</b> renforce ${s.name} pour augmenter son loyer.`);
     buildBtn.click();
     await aiDelay(300);
     if(document.getElementById('modal')?.classList.contains('open'))closeModal();
   }

   if(current!==aiIndex||gameOver)return;
   await aiDelay(320);
   repairTurnState();

   if(current===aiIndex && rolled && !pendingDebt && !pendingRentDecision && !animating && !document.getElementById('modal')?.classList.contains('open')){
     endBtn.disabled=false;
   }

   if(current===aiIndex&&!endBtn.disabled){
     addLog(`🤖 <b>${p.name}</b> termine son tour automatiquement.`);
     endBtn.click();
   }
 }finally{
   aiBusy=false;
   // Point crucial : un refresh peut survenir pendant que aiBusy=true.
   // On relance donc la boucle après chaque sous-action afin qu'aucun clic humain ne soit requis.
   if(!gameOver&&isAIPlayer())scheduleAI(260);
 }
}
function scheduleAI(delay=420){
 if(aiTimer){clearTimeout(aiTimer);aiTimer=null}
 if(initiativeActive||gameOver||!isAIPlayer()||players[current]?.jailed)return;
 aiTimer=setTimeout(()=>{
   aiTimer=null;
   if(aiBusy){scheduleAI(180);return}
   runAITurn();
 },delay);
}

const names=[
'DÉPART','Paris','Lyon','Marseille','Événement','Nice','Plage Azur','Toulouse','Bordeaux','Banque',
'Nantes','Lille','Événement mondial','Strasbourg','Montpellier','Plage Atlantique','Rennes','Reims','Prison','Le Havre',
'Saint-Étienne','Toulon','Événement','Grenoble','Dijon','Plage Manche','Angers','Aéroport','Rouen','Villeurbanne',
'Clermont-Ferrand','Aix-en-Provence','Événement mondial','Brest','Plage Méditerranée','Caen'];
const types=names.map((n,i)=> i===0?'start': n.includes('Plage')?'beach': n==='Prison'?'jail': n==='Aéroport'?'airport': n==='Banque'?'bank': n==='Événement'?'event': n==='Événement mondial'?'global':'property');
const ECONOMY_VALUE_BOOST=1;
const PROPERTY_PRICES={
  'Paris':400000,
  'Nice':350000,
  'Bordeaux':320000,
  'Aix-en-Provence':300000,

  'Lyon':290000,
  'Lille':260000,
  'Toulouse':250000,
  'Nantes':235000,

  'Grenoble':270000,
  'Montpellier':240000,
  'Rennes':225000,
  'Villeurbanne':210000,

  'Marseille':280000,
  'Le Havre':210000,
  'Toulon':200000,
  'Brest':180000,

  'Strasbourg':230000,
  'Dijon':190000,
  'Reims':175000,
  'Caen':160000,

  'Clermont-Ferrand':170000,
  'Rouen':155000,
  'Angers':140000,
  'Saint-Étienne':120000
};
const basePrices=names.map((n,i)=>{
  if(types[i]==='property')return PROPERTY_PRICES[n]||0;
  if(types[i]==='beach')return 75000;
  return 0;
});
const CITY_RENT_TIERS=[
  {max:155000,rents:[15000,25000,40000,60000]},
  {max:190000,rents:[20000,35000,55000,80000]},
  {max:235000,rents:[25000,45000,70000,110000]},
  {max:270000,rents:[35000,60000,95000,145000]},
  {max:320000,rents:[45000,80000,125000,190000]},
  {max:350000,rents:[55000,95000,150000,225000]},
  {max:Infinity,rents:[70000,120000,180000,260000]}
];
function rentForPrice(price,level=0,type='property'){
  if(type==='beach')return 10000;
  const tier=CITY_RENT_TIERS.find(t=>price<=t.max)||CITY_RENT_TIERS[CITY_RENT_TIERS.length-1];
  return tier.rents[Math.max(0,Math.min(3,level))];
}
function upgradeCost(s,nextLevel){
  if(!s||s.type!=='property'||nextLevel<1||nextLevel>3)return 0;
  const rates=[0,.25,.35,.50];
  return roundPriceStep(Math.round(s.price*rates[nextLevel]));
}
const rents=basePrices.map((p,i)=>p?rentForPrice(p,0,types[i]):0);
function baseParcelValue(s){
  if(!s.price)return 0;
  let v=s.price;
  for(let lvl=1;lvl<=s.level;lvl++)v+=upgradeCost(s,lvl);
  return v;
}
function zoneKey(s){return s?.theme?.label || 'Autre'}
function zonePressureInfo(s){
  const z=zonePressure[zoneKey(s)];
  if(!z||z.roundsLeft<=0)return {valuePenalty:0,rentPenalty:0,label:'',level:0,roundsLeft:0};
  const severity=Math.min(3,z.level);
  const baseValue=[0,.10,.15,.20][severity];
  const baseRent=[0,.05,.10,.15][severity];
  const recovery=z.roundsLeft===3?1:z.roundsLeft===2?.65:.30;
  return {
    valuePenalty:baseValue*recovery,
    rentPenalty:baseRent*recovery,
    label:`Marché -${Math.round(baseValue*recovery*100)}% valeur / -${Math.round(baseRent*recovery*100)}% loyer`,
    level:severity,
    roundsLeft:z.roundsLeft
  };
}
function communistWonderActive(){
  return players.some(p=>p?.active&&p.wonderMode==='communist'&&p.wonderTurnsLeft>0);
}
function currentRent(s){
  const raw=rentForPrice(s.price,s.level,s.type);
  const m=zonePressureInfo(s);
  const wonderMultiplier=communistWonderActive()?.35:1;
  const owner=s.owner!==null?players[s.owner]:null;
  if(owner?.floodTurnsLeft>0)return 0;
  const quakeMultiplier=((s.repairTurnsLeft||0)>0)?0.25:1;
  return roundRentStep(raw*(1-m.rentPenalty)*wonderMultiplier*quakeMultiplier);
}
function parcelValue(s){
  const raw=baseParcelValue(s);
  const m=zonePressureInfo(s);
  return Math.max(0,Math.round(raw*(1-m.valuePenalty)));
}
function nextParcelValue(s){
  if(s.level>=3)return parcelValue(s);
  const clone={...s,level:s.level+1};
  return parcelValue(clone);
}
function purchasePrice(s){
  if(!s?.price)return 0;
  const m=zonePressureInfo(s);
  return roundPriceStep(Math.round(s.price*(1-m.valuePenalty)));
}
const themePool=[
 {label:'Tech',emoji:'💻',color:'#7c3aed'},
 {label:'Luxe',emoji:'💎',color:'#e11d48'},
 {label:'Port',emoji:'⚓',color:'#0f766e'},
 {label:'Culture',emoji:'🎭',color:'#c2410c'},
 {label:'Nature',emoji:'🌿',color:'#15803d'},
 {label:'Business',emoji:'💼',color:'#0369a1'},
 {label:'Gourmet',emoji:'🍷',color:'#7f1d1d'},
 {label:'Tourisme',emoji:'📸',color:'#d97706'}
];
const fixedThemes={
 start:{label:'Départ',emoji:'🚀',color:'#16a34a'},
 event:{label:'Surprise',emoji:'⚡',color:'#ca8a04'},
 global:{label:'Monde',emoji:'🌍',color:'#dc2626'},
 bank:{label:'Finance',emoji:'🏦',color:'#0284c7'},
 jail:{label:'Police',emoji:'🚔',color:'#7c3aed'},
 airport:{label:'Transport',emoji:'✈️',color:'#0ea5e9'},
 beach:{label:'Vacances',emoji:'🌊',color:'#0891b2'}
};
const wonderDistricts=[
 {name:'Quartier Luxe',label:'Luxe',emoji:'💎',color:'#e11d48',ids:[1,5,8,31]},
 {name:'Quartier Business',label:'Business',emoji:'💼',color:'#0369a1',ids:[2,7,10,11]},
 {name:'Quartier Innovation',label:'Innovation',emoji:'💻',color:'#7c3aed',ids:[14,16,23,29]},
 {name:'Quartier Port',label:'Port',emoji:'⚓',color:'#0f766e',ids:[3,19,21,33]},
 {name:'Quartier Culture',label:'Culture',emoji:'🎭',color:'#c2410c',ids:[13,17,24,35]},
 {name:'Quartier Régional',label:'Régional',emoji:'🏘️',color:'#15803d',ids:[20,26,28,30]}
];
const districtBySpaceId={};
wonderDistricts.forEach(d=>d.ids.forEach(id=>districtBySpaceId[id]=d));
const spaces=names.map((name,i)=>{
  const type=types[i];
  const district=districtBySpaceId[i];
  const theme=type==='property' && district ? {label:district.label,emoji:district.emoji,color:district.color}
    : (type==='property' ? themePool[i % themePool.length] : (type==='beach' ? fixedThemes.beach : fixedThemes[type]));
  return {id:i,name,type,price:basePrices[i],rent:rents[i],baseRent:rents[i],owner:null,level:0,theme,district:district?.name||null};
});
let players=[],current=0,rolled=false,lastRoll=0,gameOver=false,winMode='both',animating=false,pendingRentDecision=false;
let initiativeActive=false,initiativeScores=[];
let pendingDebt=null,debtQueue=[],zonePressure={},roundNumber=1;
let devMode=false,devTimer=null;
let devStats={startedAt:0,rolls:0,turns:0,purchases:0,upgrades:0,rentPayments:0,rentPaid:0,buyouts:0,emergencySales:0,bankruptcies:0,events:0,globalEvents:0,bankVisits:0,bankCashChoices:0,bankInvestments:0,bankInvestmentPayouts:0,bankRobberies:0,bankRobberyEscapes:0,bankRobberyCaught:0,jailVisits:0,jailBails:0,jailEscapeAttempts:0,jailEscapes:0,jailBladeBreaks:0,jailWaits:0,airportVisits:0,airportDirect:0,airportStandby:0,debtCases:0,moneyInjected:0,moneyRemoved:0,scheduledCharges:0,propertyTaxes:0,wondersStarted:0,wonderWins:0};
function resetDevStats(){
 devStats={startedAt:performance.now(),rolls:0,turns:0,purchases:0,upgrades:0,rentPayments:0,rentPaid:0,buyouts:0,emergencySales:0,bankruptcies:0,events:0,globalEvents:0,bankVisits:0,bankCashChoices:0,bankInvestments:0,bankInvestmentPayouts:0,bankRobberies:0,bankRobberyEscapes:0,bankRobberyCaught:0,jailVisits:0,jailBails:0,jailEscapeAttempts:0,jailEscapes:0,jailBladeBreaks:0,jailWaits:0,airportVisits:0,airportDirect:0,airportStandby:0,debtCases:0,moneyInjected:0,moneyRemoved:0,scheduledCharges:0,propertyTaxes:0,wondersStarted:0,wonderWins:0};
}
function stat(name,amount=1){if(Object.prototype.hasOwnProperty.call(devStats,name))devStats[name]+=amount;refreshDevStats()}
function elapsedText(){
 if(!devStats.startedAt)return '0:00';
 const sec=Math.max(0,Math.floor((performance.now()-devStats.startedAt)/1000)),m=Math.floor(sec/60),s=sec%60;
 return `${m}:${String(s).padStart(2,'0')}`;
}
function refreshDevStats(){
 const el=document.getElementById('devStats');if(!el)return;
 const active=players.filter(p=>p.active).length;
 const totalCash=players.reduce((a,p)=>a+p.money,0);
 const pressure=Object.keys(zonePressure).length;
 const rows=[
  ['Temps réel',elapsedText()],['Tour de table',roundNumber],['Lancers',devStats.rolls],['Tours joueurs',devStats.turns],
  ['Achats',devStats.purchases],['Constructions',devStats.upgrades],['Loyers payés',devStats.rentPayments],['Montant loyers',moneyFmt(devStats.rentPaid)],
  ['Rachats',devStats.buyouts],['Ventes urgence',devStats.emergencySales],['Crises dette',devStats.debtCases],['Faillites',devStats.bankruptcies],
  ['Événements',devStats.events],['Mondiaux',devStats.globalEvents],['Banques',devStats.bankVisits],['Cash Banque',devStats.bankCashChoices],['Placements Banque',devStats.bankInvestments],['Braquages',devStats.bankRobberies],['Arrestations Banque',devStats.bankRobberyCaught],['Prisons',devStats.jailVisits],['Cautions',devStats.jailBails],['Évasions',devStats.jailEscapes],['Lames cassées',devStats.jailBladeBreaks],['Aéroports',devStats.airportVisits],['Vols directs',devStats.airportDirect],['Standby',devStats.airportStandby],['Joueurs actifs',active],['Zones en crise',pressure],
  ['Charges différées',devStats.scheduledCharges],['Taxes foncières',devStats.propertyTaxes],['Merveilles lancées',devStats.wondersStarted],['Victoires Merveille',devStats.wonderWins],['Cash total',moneyFmt(totalCash)],['Argent injecté',moneyFmt(devStats.moneyInjected)]
 ];
 el.innerHTML=rows.map(([k,v])=>`<div class="dev-stat"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
}
const board=document.getElementById('board'), playerBox=document.getElementById('players'), logBox=document.getElementById('log'), status=document.getElementById('status');
const rollBtn=document.getElementById('rollBtn'),buyBtn=document.getElementById('buyBtn'),buildBtn=document.getElementById('buildBtn'),endBtn=document.getElementById('endBtn'),wonderBtn=document.getElementById('wonderBtn');
const turnPhase=document.getElementById('turnPhase'),turnGuide=document.getElementById('turnGuide'),turnGuideMain=document.getElementById('turnGuideMain'),turnGuideDetail=document.getElementById('turnGuideDetail');
const rollHint=document.getElementById('rollHint'),buyLabel=document.getElementById('buyLabel'),buyHint=document.getElementById('buyHint'),buyPrice=document.getElementById('buyPrice'),buildLabel=document.getElementById('buildLabel'),buildHint=document.getElementById('buildHint'),buildPrice=document.getElementById('buildPrice'),wonderHint=document.getElementById('wonderHint'),endHint=document.getElementById('endHint');


function ownedWonderDistrict(playerIndex){
 return wonderDistricts.find(d=>d.ids.every(id=>spaces[id].owner===playerIndex))||null;
}
function districtProgress(playerIndex,d){
 const owned=d.ids.filter(id=>spaces[id].owner===playerIndex).length;
 return {owned,total:d.ids.length};
}
function canLaunchWonder(playerIndex){
 const p=players[playerIndex];
 return !!(p&&p.active&&!p.wonderMode&&ownedWonderDistrict(playerIndex));
}
function openWonderModal(){
 const p=players[current],district=ownedWonderDistrict(current);
 if(!p||!district||p.wonderMode||gameOver)return;
 const list=district.ids.map(id=>spaces[id].name).join(', ');
 const body=`<div class="decision-shell wonder-decision">
   <div class="decision-hero wonder">
     <div class="decision-icon">★</div>
     <div><div class="decision-kicker">QUARTIER COMPLET</div><div class="decision-title">${district.emoji} ${district.name}</div><div class="decision-sub">${list}</div></div>
   </div>
   <div class="decision-balance"><span>Trésorerie de ${p.name}</span><strong>${moneyFmt(p.money)}</strong></div>
   <div class="decision-grid two">
     <div class="decision-card ${p.money>=400000?'recommended':'locked'}">
       <div class="decision-card-tag">ACCÉLÉRÉE</div>
       <b>Construction privée</b>
       <strong>400 000 €</strong>
       <small>Victoire après 5 de tes tours complets.</small>
       <button id="wonderFast" class="wonder-capitalist" ${p.money<400000?'disabled':''}>Choisir · 5 tours</button>
       ${p.money<400000?`<div class="decision-warning">Il manque ${moneyFmt(400000-p.money)}.</div>`:''}
     </div>
     <div class="decision-card">
       <div class="decision-card-tag">COLLECTIVE</div>
       <b>Construction gratuite</b>
       <strong>0 €</strong>
       <small>8 tours · tous les loyers de la partie baissent de 65 %.</small>
       <button id="wonderCollective" class="wonder-communist">Choisir · 8 tours</button>
     </div>
   </div>
 </div>`;
 modal('Construire une Merveille',body,'wonder');
 const row=document.querySelector('#modal .row');row.innerHTML='<button id="wonderCancel" class="secondary">Annuler</button>';
 document.getElementById('wonderCancel').onclick=closeModal;
 const fast=document.getElementById('wonderFast');
 if(fast&&!fast.disabled)fast.onclick=()=>startWonder('fast',district.name);
 document.getElementById('wonderCollective').onclick=()=>startWonder('communist',district.name);
}
function startWonder(mode,districtName){
 const p=players[current];
 if(!p||p.wonderMode)return;
 if(mode==='fast'){
   if(p.money<400000)return;
   p.money-=400000;stat('moneyRemoved',400000);
   p.wonderTurnsLeft=5;
 }else{
   p.wonderTurnsLeft=8;
 }
 p.wonderMode=mode;p.wonderLine=districtName;p.wonderSkipCountdown=true;
 stat('wondersStarted');
 document.getElementById('modal').classList.remove('open');
 addLog(`🏛️ <b>${p.name}</b> lance une Merveille dans <b>${districtName}</b> — ${mode==='fast'?`${moneyFmt(400000)} payés, victoire dans 5 tours`:'construction collective, loyers -65 %, victoire dans 8 tours'}.`);
 status.textContent=`Merveille de ${p.name} en construction : ${p.wonderTurnsLeft} tours restants.`;
 showCinematic('wonder','NOUVEAU PROJET','MERVEILLE LANCÉE',`${p.name} · ${districtName} · ${p.wonderTurnsLeft} tours`,1900);
 playSfx('build');refresh();
 scheduleAI(220);
}
function advanceWonderForPlayer(playerIndex){
 const p=players[playerIndex];
 if(!p?.active||!p.wonderMode||p.wonderTurnsLeft<=0)return false;
 if(p.wonderSkipCountdown){p.wonderSkipCountdown=false;return false}
 p.wonderTurnsLeft--;
 addLog(`🏗️ Merveille de <b>${p.name}</b> : ${p.wonderTurnsLeft} tour(s) restant(s).`);
 refresh();
 showWonderProgress(playerIndex);
 if(p.wonderTurnsLeft<=0){
   stat('wonderWins');
   declareWinner(p,'achève sa Merveille');
   return true;
 }
 return false;
}

function boardPos(i){
  const j=(i+18)%36;
  if(j<=9)return {r:1,c:j+1};
  if(j<=18)return {r:j-8,c:10};
  if(j<=27)return {r:10,c:28-j};
  return {r:37-j,c:1};
}
function themeSlug(label=''){
 return String(label).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
}
const characterIds=['magnat','architecte','banquiere','stratege','aventuriere','rebelle'];
const characterNames=['Le Magnat',"L'Architecte",'La Banquière','Le Stratège',"L'Aventurière",'Le Rebelle'];
function characterIdFor(playerIndex){
 const selected=players[playerIndex]?.characterId;
 return characterIds.includes(selected)?selected:characterIds[playerIndex%characterIds.length];
}
function characterSprite(playerIndex){return 'assets/characters/'+characterIdFor(playerIndex)+'.svg'}
function pawnVisual(playerIndex,name='',extraClass=''){
 return `<img class="player-pawn ${extraClass}" src="${characterSprite(playerIndex)}" alt="" title="${name}" loading="eager">`;
}
function houseVisual(level){
 return level>0?`<div class="property-level-badge">NIV. ${level}</div>`:'';
}
function buildingVisual(s){
 const slug=s.type==='beach'?'beach':themeSlug(s.theme?.label||'business');
 if(s.type==='property'){
  const level=Math.max(0,Math.min(3,Number(s.level)||0));
  return `<div class="case-visual premium-art-card bf-evolving-plot plot-level-${level} theme-${slug}" aria-label="Terrain niveau ${level}">
    <div class="bf-plot-ground"><span class="bf-plot-path"></span><span class="bf-plot-grass"></span></div>
    ${level>0?`<img class="level-building-art level-${level}" src="assets/buildings/level${level}.svg" alt="" loading="eager">`:''}
    <div class="case-art-gloss"></div>
    ${level>0?houseVisual(level):''}
    <span class="district-mark">${(s.theme?.label||'Q').slice(0,1)}</span>
   </div>`;
 }
 return `<div class="case-visual premium-art-card theme-${slug}">
   <img class="case-art" src="assets/tiles/${slug}.svg" alt="" loading="eager">
   <div class="case-art-gloss"></div>
   <span class="district-mark">${(s.theme?.label||'Q').slice(0,1)}</span>
  </div>`;
}
function positionBoardPawns(){
 const boardRect=board.getBoundingClientRect();
 board.querySelectorAll('.board-edge-pawns').forEach(el=>el.remove());
 board.querySelectorAll('.space').forEach(space=>{
  const pawns=[...space.querySelectorAll('.case-pawn-slot .board-pawn, .special-layout > .tokens .board-pawn')];
  if(!pawns.length)return;
  const rect=space.getBoundingClientRect();
  const top=space.classList.contains('side-top');
  const bottom=space.classList.contains('side-bottom');
  const left=space.classList.contains('side-left');
  const right=space.classList.contains('side-right');
  const corner=space.classList.contains('corner');
  const layer=document.createElement('div');
  layer.className='board-edge-pawns';
  layer.style.position='absolute';
  layer.style.display='flex';
  layer.style.alignItems='center';
  layer.style.justifyContent='center';
  layer.style.gap='0px';
  layer.style.pointerEvents='none';
  layer.style.zIndex='999';
  layer.style.width='max-content';
  layer.style.height='40px';
  let x=(rect.left+rect.right)/2-boardRect.left;
  let y=rect.top-boardRect.top-22;
  if(bottom){y=rect.bottom-boardRect.top+19;}
  else if(left&&!corner){x=rect.left-boardRect.left-18;y=(rect.top+rect.bottom)/2-boardRect.top;}
  else if(right&&!corner){x=rect.right-boardRect.left+18;y=(rect.top+rect.bottom)/2-boardRect.top;}
  layer.style.left=x+'px';
  layer.style.top=y+'px';
  layer.style.transform='translate(-50%,-50%)';
  pawns.forEach(pawn=>layer.appendChild(pawn));
  board.appendChild(layer);
 });
}
function drawBoard(){
  board.querySelectorAll('.space,.board-edge-pawns').forEach(e=>e.remove());
  const tileBatch=document.createDocumentFragment();
  spaces.forEach(s=>{
    const d=document.createElement('div');
    const p=boardPos(s.id);
    const posClass=((p.r===1&&p.c===1)||(p.r===1&&p.c===10)||(p.r===10&&p.c===10)||(p.r===10&&p.c===1))?' corner':(p.r===1?' side-top':p.c===10?' side-right':p.r===10?' side-bottom':' side-left');
    d.className='space '+s.type+posClass+(s.owner!==null?' owned':'')+(zonePressureInfo(s).level?' market-stress':'')+((s.repairTurnsLeft||0)>0?' quake-damaged':'');
    d.dataset.spaceId=s.id;
    d.style.gridRow=p.r;
    d.style.gridColumn=p.c;
    d.style.setProperty('--theme-color', s.theme?.color || '#64748b');
    if(s.owner!==null)d.style.setProperty('--owner-color',colors[s.owner]);

    const ownerName=s.owner!==null?(players[s.owner]?.name||'Joueur'):'';
    const mp=zonePressureInfo(s);
    const district=s.district?wonderDistricts.find(d=>d.name===s.district):null;
    const districtState=(district&&s.owner!==null)?districtProgress(s.owner,district):null;
    const tokensHtml=players.map((pl,idx)=>pl.active&&pl.pos===s.id?pawnVisual(idx,pl.name,'board-pawn'):'').join('');

    if(['property','beach'].includes(s.type)){
      const economyTitle=s.owner===null?'ACHAT':'LOYER';
      const economyValue=s.owner===null?shortMoneyFmt(purchasePrice(s)):shortMoneyFmt(currentRent(s));
      const valueLine=s.owner===null
        ? `Valeur ${shortMoneyFmt(purchasePrice(s))}`
        : `Valeur ${shortMoneyFmt(parcelValue(s))}${s.type==='property'? ` · Niv.${s.level}`:''}`;
      const ownerBand=s.owner!==null
        ? `<div class="case-owner-band" style="--band:${colors[s.owner]}"><span class="owner-swatch"></span><span>${ownerName}</span></div>`
        : `<div class="case-owner-band available" style="--band:${s.theme?.color||'#94a3b8'}"><span class="owner-swatch"></span><span>À VENDRE</span></div>`;
      const districtReady=districtState&&districtState.owned===districtState.total?'<span class="district-ready">M</span>':'';
      const stressBadge=mp.level?`<div class="case-stress">${mp.label}</div>`:'';
      const houses=s.type==='property'&&s.level>0?houseVisual(s.level):'';

      d.innerHTML=`<div class="tile-face property-layout">
        <div class="case-pawn-slot">${tokensHtml}</div>
        ${buildingVisual(s)}
        ${ownerBand}
        <div class="case-economy">
          <div class="case-economy-label">${economyTitle}</div>
          <div class="case-economy-value">${economyValue}</div>
          <div class="case-economy-sub">${valueLine}</div>
          ${stressBadge}
        </div>
        <div class="case-city"><span>${s.name}</span>${districtReady}</div>
      </div>`;
      d.dataset.clickable='true';
      d.addEventListener('click',()=>openPropertyModal(s.id));
      tileBatch.appendChild(d);
      return;
    }

    const specialAsset={start:'start',event:'event',global:'global',bank:'bank',jail:'jail',airport:'airport'}[s.type]||'';
    const specialEffect={
      start:'+30k au passage',
      bank:'+25k',
      jail:'Caution · Évasion · 3 tours',
      airport:'Voyager sur le plateau',
      event:'Effet surprise',
      global:'Tous les joueurs'
    }[s.type]||'';
    const specialKicker={
      start:'BONUS',
      bank:'FINANCE',
      jail:'RISQUE',
      airport:'TRANSPORT',
      event:'CARTE',
      global:'MONDE'
    }[s.type]||'';
    d.innerHTML=`<div class="tile-face special-layout">
      <div class="special-art-wrap">
        <img class="special-art" src="assets/special/${specialAsset}.svg" alt="" loading="eager">
        <div class="special-gloss"></div>
      </div>
      <div class="special-copy">
        <div class="special-kicker">${specialKicker}</div>
        <div class="special-name">${s.name}</div>
        <div class="special-effect">${specialEffect}</div>
      </div>
      <div class="tokens">${tokensHtml}</div>
    </div>`;
    tileBatch.appendChild(d);
  });
  board.appendChild(tileBatch);
  positionBoardPawns();
}

function renderWonderSite(){
 const slot=document.getElementById('wonderSiteInner');
 const site=document.getElementById('wonderSite');
 const state=document.getElementById('wonderSiteState');
 if(!slot||!site)return;

 const activeWonder=players.find(p=>p.active&&p.wonderMode&&p.wonderTurnsLeft>0);
 const readyPlayer=players[current]?.active&&canLaunchWonder(current)?players[current]:null;
 const readyDistrict=readyPlayer?ownedWonderDistrict(current):null;

 site.classList.remove('live','ready','idle','stage-1','stage-2','stage-3');

 if(!activeWonder){
   if(readyPlayer&&readyDistrict){
     site.classList.add('ready');
     if(state)state.textContent='PROJET DISPONIBLE';
     slot.innerHTML=`<div class="wonder-ready-card">
       <div class="wonder-ready-mark">★</div>
       <div class="wonder-ready-copy">
         <b>${readyDistrict.emoji} ${readyDistrict.name} complet</b>
         <small>${readyPlayer.name} peut lancer une Merveille maintenant.</small>
       </div>
       <div class="wonder-ready-cta">OUVRIR</div>
     </div>`;
     slot.onclick=()=>{if(canLaunchWonder(current))openWonderModal()};
   }else{
     site.classList.add('idle');
     if(state)state.textContent='EMPLACEMENT DISPONIBLE';
     slot.innerHTML=`<div class="wonder-empty-visual">
       <div class="wonder-blueprint"><span></span><span></span><span></span></div>
       <div class="wonder-placeholder"><b>AUCUN CHANTIER</b><small>Contrôle les 3 propriétés d’un quartier.</small></div>
     </div>`;
     slot.onclick=null;
   }
   return;
 }

 site.classList.add('live');
 slot.onclick=null;
 const totalTurns=activeWonder.wonderMode==='communist'?8:5;
 const done=Math.max(0,totalTurns-activeWonder.wonderTurnsLeft);
 const ratio=done/totalTurns;
 const stage=ratio<.34?1:ratio<.72?2:3;
 site.classList.add('stage-'+stage);
 if(state)state.textContent=`CHANTIER · ÉTAPE ${stage}/3`;

 const art=`assets/wonder/stage${stage}.svg`;
 const percent=Math.round((done/totalTurns)*100);
 const bars=Array.from({length:totalTurns},(_,i)=>`<span class="wonder-step ${i<done?'done':''} ${i===done?'current':''}"></span>`).join('');

 slot.innerHTML=`<div class="wonder-live-card ${activeWonder.wonderMode}">
   <div class="wonder-art-shell"><img class="wonder-stage-art" src="${art}" alt="" loading="eager"></div>
   <div class="wonder-live-copy">
     <div class="wonder-live-title">${activeWonder.name}</div>
     <div class="wonder-live-sub">${activeWonder.wonderLine} · ${activeWonder.wonderMode==='communist'?'collective':'accélérée'}</div>
     <div class="wonder-progress-meta"><span>${percent} %</span><strong>${activeWonder.wonderTurnsLeft} tour(s)</strong></div>
     <div class="wonder-progress-bar">${bars}</div>
   </div>
 </div>`;
}
function renderPlayers(){
 playerBox.innerHTML=players.map((p,i)=>`<div class="player ${i===current&&p.active?'active':''}">${pawnVisual(i,p.name,'panel-pawn')}<div class="pmeta"><div class="pname">${p.name}${p.isAI?' <span class="ai-player-badge">IA</span>':''}${!p.active?' 💀':''}</div><div class="pmoney">${moneyFmt(p.money)} · ${p.props.length} biens · ${p.beaches} plage(s)</div>${p.jailed&&p.active?`<div class="jail-player-status">PRISON · ${p.jailTurnsLeft} tour(s)</div>`:''}${p.wonderMode&&p.active?`<div class="wonder-progress">🏛️ ${p.wonderLine} · ${p.wonderTurnsLeft} tour(s) · ${p.wonderMode==='communist'?'collective':'accélérée'}</div>`:''}</div></div>`).join('');
 const activeWonder=players.find(p=>p.active&&p.wonderMode&&p.wonderTurnsLeft>0);
 document.getElementById('turnText').innerHTML=gameOver?'Partie terminée':`<span class="turn-player-name">${players[current]?.name||''}</span><small class="turn-round">Tour de table ${roundNumber}</small>${communistWonderActive()?'<div class="global-rent-alert">☭ Construction collective : tous les loyers -65 %</div>':activeWonder?`<div class="wonder-banner">🏛️ ${activeWonder.name} · Merveille dans ${activeWonder.wonderTurnsLeft} tour(s)</div>`:''}`;
 const centerTokens=document.getElementById('centerTokens');
 if(centerTokens){
   centerTokens.innerHTML=players.filter(p=>p.active).map(p=>{
     const i=players.indexOf(p);
     return `<span class="center-token ${i===current?'current':''}">${pawnVisual(i,p.name,'center-pawn')}<small>${p.name}</small></span>`;
   }).join('');
 }
 renderWonderSite();
}

function addLog(msg){const d=document.createElement('div'); d.innerHTML=msg; logBox.prepend(d)}
function resetModalTone(){
 const modalEl=document.getElementById('modal');
 if(!modalEl)return;
 modalEl.classList.remove('event-positive','event-negative','event-neutral');
}
function modal(title,html,variant='default'){
 resetModalTone();
 document.getElementById('modalTitle').textContent=title;
 document.getElementById('modalBody').innerHTML=html;
 const row=document.querySelector('#modal .row');
 row.innerHTML='<button id="modalOk" class="primary">Fermer</button>';
 document.getElementById('modalOk').onclick=closeModal;
 const modalEl=document.getElementById('modal');
 modalEl.classList.remove('modal-decision','modal-property','modal-danger','modal-wonder','modal-event','modal-jail-fail','modal-bank','modal-bank-robbery');
 if(variant&&variant!=='default')modalEl.classList.add('modal-'+variant);
 modalEl.classList.add('open','visual-alpha-modal');
 playSfx('open');
}
function closeModal(){
 if(pendingRentDecision)return;
 const modalEl=document.getElementById('modal');
 if(modalEl)modalEl.classList.remove('open','event-positive','event-negative','event-neutral','modal-decision','modal-property','modal-danger','modal-wonder','modal-event','modal-jail-fail');
 playSfx('close');
 requestAnimationFrame(()=>refresh());
}
function showEventResult({title,icon='✨',description='',effect='',tone='neutral',afterClose=null}){
 const body=`
  <div class="event-result ${tone}">
   <div class="event-icon">${icon}</div>
   <div class="event-title">${title}</div>
   <div class="event-desc">${description}</div>
   <div class="event-effect">${effect}</div>
   <div class="balance">${players[current]?`${players[current].name} · ${moneyFmt(players[current].money)}`:''}</div>
  </div>`;
 modal(title,body,'event');
 const eventModal=document.getElementById('modal');
 eventModal.classList.remove('event-positive','event-negative','event-neutral');
 eventModal.classList.add('event-'+tone);
 setTimeout(()=>eventModal.classList.remove('event-positive','event-negative','event-neutral'),900);
 const btn=document.getElementById('modalOk');
 btn.textContent='Continuer';
 btn.onclick=()=>{
   eventModal.classList.remove('open','event-positive','event-negative','event-neutral','modal-event');
   playSfx('close');
   if(afterClose)afterClose();
   // Un événement est résolu après le déplacement. On recalcule toujours les
   // actions ici pour éviter que "Fin du tour" reste bloqué dans l'état animation.
   requestAnimationFrame(()=>{refresh();repairTurnState();scheduleAI(220);});
 };
 playSfx(tone==='positive'?'money':tone==='negative'?'bad':'open');
}

function openPropertyModal(spaceId){
 const s=spaces[spaceId];
 if(!s||!['property','beach'].includes(s.type))return;
 const owner=s.owner!==null?players[s.owner]:null;
 const canUpgrade=s.type==='property'&&s.owner===current&&s.level<3&&!gameOver&&!animating&&players[current].active;
 const nextLevel=Math.min(3,s.level+1);
 const cost=upgradeCost(s,nextLevel)||0;
 const rentNow=s.owner!==null?currentRent(s):s.baseRent;
 const rentNext=s.level<3?rentForPrice(s.price,nextLevel,s.type):rentNow;
 const valueNow=s.owner!==null?parcelValue(s):purchasePrice(s);
 const ownerName=owner?owner.name:'Aucun propriétaire';
 const market=zonePressureInfo(s);
 const district=s.district?wonderDistricts.find(d=>d.name===s.district):null;
 const dp=district?districtProgress(current,district):null;
 const dots=[1,2,3].map(n=>`<span class="level-dot ${s.level>=n?'on':''}"></span>`).join('');
 const body=`
  <div class="property-card">
   <div class="hero property-modal-hero">
    <div class="hero-icon">${s.type==='beach'?'🏖️':'🏙️'}</div>
    <div><div class="modal-eyebrow">${s.owner===null?'À VENDRE':s.owner===current?'TON BIEN':'BIEN ADVERSE'}</div><div class="hero-title">${s.name}</div><div class="hero-sub">${s.theme?.emoji||''} ${s.theme?.label||''} · Propriétaire : ${ownerName}</div></div>
   </div>
   <div class="level-track">${dots}</div>
   <div class="property-stats">
    <div class="property-stat"><div class="k">Valeur de la parcelle</div><div class="v">${moneyFmt(valueNow)}</div></div>
    <div class="property-stat"><div class="k">Loyer actuel</div><div class="v">${moneyFmt(rentNow)}</div></div>
    <div class="property-stat"><div class="k">Prix d'achat</div><div class="v">${moneyFmt(purchasePrice(s))}</div></div>
    <div class="property-stat"><div class="k">Niveau</div><div class="v">${s.type==='property'?`${s.level} / 3`:'Plage'}</div></div>
   </div>
   ${market.level?`<div class="property-market-status">📉 Zone ${zoneKey(s)} sous pression : valeur -${Math.round(market.valuePenalty*100)} %, loyers -${Math.round(market.rentPenalty*100)} % · récupération dans ${market.roundsLeft} tour(s) de table.</div>`:''}
   ${district?`<div class="property-market-status" style="background:#f5f3ff;border-color:#ddd6fe;color:#5b21b6">🏘️ ${district.name} · vous contrôlez ${dp.owned}/${dp.total} propriété(s) de ce quartier${dp.owned===dp.total?' · Merveille disponible !':''}</div>`:''}
   ${s.owner===null?`<div class="upgrade-box locked"><b>Disponible à l'achat</b><div class="upgrade-note">Le premier loyer sera de ${moneyFmt(currentRent(s))}.</div></div>`:
     s.type==='beach'?`<div class="upgrade-box locked"><b>Plage spéciale</b><div class="upgrade-note">Cette propriété ne reçoit pas de maison pour le moment.</div></div>`:
     s.level>=3?`<div class="upgrade-box locked"><b>Niveau maximum atteint</b><div class="upgrade-note">Valeur finale ${moneyFmt(valueNow)} · loyer ${moneyFmt(rentNow)}.</div></div>`:
     `<div class="upgrade-box ${canUpgrade?'':'locked'}"><b>Passer au niveau ${nextLevel}</b><div class="upgrade-note">Coût ${moneyFmt(cost)} · valeur ${moneyFmt(nextParcelValue(s))} · nouveau loyer ${moneyFmt(rentNext)}.</div></div>`}
  </div>`;
 modal(`🏢 ${s.name}`,body,'property');
 const row=document.querySelector('#modal .row');
 if(canUpgrade){
   const btn=document.createElement('button');
   btn.className='primary upgrade-action';
   btn.textContent=`🏠 Améliorer · ${moneyFmt(cost)}`;
   btn.disabled=players[current].money<cost;
   btn.title=btn.disabled?'Fonds insuffisants':'';
   btn.onclick=()=>upgradeProperty(spaceId);
   row.prepend(btn);
 }
}
function upgradeProperty(spaceId){
 const s=spaces[spaceId],p=players[current];
 if(!s||s.type!=='property'||s.owner!==current||s.level>=3||gameOver||animating)return;
 const cost=upgradeCost(s,s.level+1);
 if(p.money<cost){status.textContent='Fonds insuffisants pour cette amélioration.';return}
 p.money-=cost;
 s.level++;
 addLog(`🏠 <b>${p.name}</b> améliore <b>${s.name}</b> au niveau ${s.level} pour ${moneyFmt(cost)}. Valeur : ${moneyFmt(parcelValue(s))}, loyer : ${moneyFmt(currentRent(s))}.`);
 status.textContent=`${s.name} passe au niveau ${s.level} · loyer ${moneyFmt(currentRent(s))}.`;
 closeModal();
 refresh();
 animateBuild(s.id);
 pulsePlayerCard(current,'positive');
 if(s.level===3)showCinematic('level3','NIVEAU MAXIMUM',s.name,'La propriété atteint son développement maximal.',1450);
 playSfx('build');
}
document.getElementById('modalOk').onclick=closeModal;
function refresh(){
 drawBoard();
 renderPlayers();
 updateActions();
 refreshDevStats();
 maybeOpenJailTurn();
 scheduleAI();
}
function repairTurnState(){
 const modalOpen=document.getElementById('modal')?.classList.contains('open');
 if(animating && !modalOpen && !pendingDebt && !pendingRentDecision){
   animating=false;
 }
 updateActions();
 if(rolled && !gameOver && !pendingDebt && !pendingRentDecision && !animating && !modalOpen){
   endBtn.disabled=false;
   endBtn.classList.add('turn-ready');
   endBtn.title='';
   if(endHint)endHint.textContent='Passer au joueur suivant';
 }
}
function setActionState(btn,enabled,reason=''){
 btn.disabled=!enabled;
 btn.title=enabled?'':reason;
 btn.classList.toggle('recommended',false);
}
function setTurnGuide(phase,main,detail,kind='neutral'){
 if(turnPhase)turnPhase.textContent=phase;
 if(turnGuideMain)turnGuideMain.textContent=main;
 if(turnGuideDetail)turnGuideDetail.textContent=detail;
 if(turnGuide){
   turnGuide.classList.remove('guide-roll','guide-buy','guide-build','guide-wonder','guide-end','guide-wait','guide-danger');
   turnGuide.classList.add('guide-'+kind);
 }
}
function updateActions(){
 const all=[rollBtn,buyBtn,buildBtn,endBtn,wonderBtn];
 all.forEach(b=>b.classList.remove('recommended'));
 if(initiativeActive){
   all.forEach(b=>b.disabled=true);
   endBtn.classList.remove('turn-ready');
   setTurnGuide('INITIATIVE','Ordre de départ','Le lancer de dés détermine qui commencera la partie.','wait');
   if(status)status.textContent='Lancer d’initiative en cours…';
   return;
 }
 endBtn.classList.toggle('turn-ready',!!rolled&&!gameOver&&!pendingDebt&&!pendingRentDecision&&!animating);
 if(!players[current]){
   all.forEach(b=>b.disabled=true);
   setTurnGuide('EN ATTENTE','Partie non lancée','Choisis les joueurs puis lance la partie.','wait');
   renderWonderSite();return;
 }
 const p=players[current],s=spaces[p.pos];
 if(p.jailed){
   all.forEach(b=>b.disabled=true);endBtn.classList.remove('turn-ready');
   setTurnGuide('PRISON','Décision de détention',p.jailTurnsLeft+' tour(s) restant(s) · caution, évasion ou attente.','danger');
   if(status)status.textContent=p.name+' est actuellement en prison.';
   return;
 }
 const isProperty=['property','beach'].includes(s.type);
 const price=isProperty?purchasePrice(s):0;
 const nextCost=s.type==='property'&&s.level<3?upgradeCost(s,s.level+1):0;
 const district=ownedWonderDistrict(current);

 if(buyLabel)buyLabel.textContent=isProperty&&s.owner===null?'Acheter':'Acheter';
 if(buildLabel)buildLabel.textContent=s.type==='property'&&s.owner===current&&s.level<3?'Améliorer':'Améliorer';
 if(buyPrice){
   buyPrice.textContent=isProperty&&s.owner===null?moneyFmt(price):'—';
   buyPrice.classList.toggle('visible',isProperty&&s.owner===null);
 }
 if(buildPrice){
   const showBuildPrice=s.type==='property'&&s.owner===current&&s.level<3;
   buildPrice.textContent=showBuildPrice?moneyFmt(nextCost):'—';
   buildPrice.classList.toggle('visible',showBuildPrice);
 }
 if(rollHint)rollHint.textContent=rolled?'Déjà lancé':'Commencer le tour';

 if(gameOver){
   all.forEach(b=>b.disabled=true);
   setTurnGuide('TERMINÉ','Partie terminée','Consulte le résultat ou recommence une partie.','wait');
   renderWonderSite();return;
 }
 if(pendingDebt){
   all.forEach(b=>b.disabled=true);
   setTurnGuide('DETTE','Résous la dette','Vends des biens ou règle la somme demandée avant de continuer.','danger');
   renderWonderSite();return;
 }
 if(pendingRentDecision){
   all.forEach(b=>b.disabled=true);
   setTurnGuide('LOYER','Choisis dans la fenêtre','Paie le loyer ou rachète la propriété pour poursuivre.','danger');
   renderWonderSite();return;
 }
 if(animating){
   all.forEach(b=>b.disabled=true);
   setTurnGuide('DÉPLACEMENT','Déplacement en cours','Le pion rejoint sa nouvelle case.','wait');
   renderWonderSite();return;
 }

 const canBuy=rolled&&isProperty&&s.owner===null&&p.money>=price;
 const canBuild=rolled&&s.type==='property'&&s.owner===current&&s.level<3&&p.money>=nextCost;
 const canWonder=canLaunchWonder(current);
 const modalBlocking=document.getElementById('modal')?.classList.contains('open');
 const canEnd=rolled&&!gameOver&&!pendingDebt&&!pendingRentDecision&&!animating&&!modalBlocking;

 setActionState(rollBtn,!rolled,rolled?'Les dés ont déjà été lancés ce tour.':'');
 setActionState(buyBtn,canBuy,!rolled?'Lance les dés d’abord.':!isProperty?'Cette case ne peut pas être achetée.':s.owner!==null?'Cette propriété appartient déjà à un joueur.':p.money<price?`Il manque ${moneyFmt(price-p.money)}.`:'');
 setActionState(buildBtn,canBuild,!rolled?'Lance les dés d’abord.':s.type!=='property'?'Seules les propriétés classiques peuvent être améliorées.':s.owner!==current?'Tu dois posséder cette propriété.':s.level>=3?'Niveau maximum atteint.':p.money<nextCost?`Il manque ${moneyFmt(nextCost-p.money)}.`:'');
 setActionState(wonderBtn,canWonder, p.wonderMode?'Une Merveille est déjà en construction.':district?'Merveille déjà engagée ou indisponible.':'Contrôle les 3 propriétés d’un même quartier.');
 setActionState(endBtn,canEnd,!rolled?'Lance les dés avant de terminer le tour.':'');

 if(buyHint)buyHint.textContent=canBuy?`${s.name} · solde après achat : ${moneyFmt(p.money-price)}`:(!rolled?'Disponible après le lancer':isProperty&&s.owner===null&&p.money<price?`Il manque ${moneyFmt(price-p.money)}`:s.owner!==null?'Déjà possédée':'Indisponible ici');
 if(buildHint)buildHint.textContent=canBuild?`${s.name} → niveau ${s.level+1} · loyer ${moneyFmt(roundRentStep(s.baseRent*(rentMultipliers[s.level+1]||1)))}`:(!rolled?'Disponible après le lancer':s.type==='property'&&s.owner===current&&s.level>=3?'Niveau maximum':s.type==='property'&&s.owner===current&&p.money<nextCost?`Il manque ${moneyFmt(nextCost-p.money)}`:'Ta propriété requise');
 if(wonderHint)wonderHint.textContent=canWonder?`${district?.name||'Quartier complet'} prêt`:p.wonderMode?`${p.wonderTurnsLeft} tour(s) restant(s)`:'Quartier complet requis';
 if(endHint)endHint.textContent=canEnd?'Passer au joueur suivant':'Lance d’abord les dés';

 if(!rolled){
   rollBtn.classList.add('recommended');
   setTurnGuide('À JOUER','Lance les dés',`${p.name}, commence ton tour.`,'roll');
 }else if(canBuy){
   buyBtn.classList.add('recommended');
   setTurnGuide('DÉCISION','Acheter '+s.name,`${moneyFmt(price)} · loyer ${moneyFmt(currentRent(s))}. Tu peux aussi passer.`,'buy');
 }else if(canBuild){
   buildBtn.classList.add('recommended');
   setTurnGuide('OPTION','Améliorer '+s.name,`Niveau ${s.level} → ${s.level+1} pour ${moneyFmt(nextCost)}. Optionnel.`,'build');
 }else if(canWonder){
   wonderBtn.classList.add('recommended');
   setTurnGuide('MERVEILLE','Projet disponible',`${district?.name||'Quartier complet'} est complet. Tu peux lancer une Merveille.`,'wonder');
 }else{
   endBtn.classList.add('recommended');
   const location=s?.name||'la case actuelle';
   setTurnGuide('FIN DE TOUR','Termine ton tour',`Aucune action prioritaire sur ${location}. Passe au joueur suivant.`,'end');
 }
 renderWonderSite();
}
function passStart(p,steps){if(p.pos+steps>=36){p.money+=30000;stat('moneyInjected',30000);addLog(`💰 <b>${p.name}</b> passe par DÉPART : +${moneyFmt(30000)}`);showCinematic('start','PASSAGE DÉPART','+30 000 €',`${p.name} reçoit son bonus de tour.`,1450);pulsePlayerCard(players.indexOf(p),'positive')}}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function animateDice(finalRoll){
 const dice=document.getElementById('dice');
 dice.classList.add('rolling');
 const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const duration=reduced?120:320, start=performance.now();
 let tick=0;
 while(performance.now()-start<duration){
   dice.dataset.face=String(1+Math.floor(Math.random()*6));
   if((tick++%2)===0)playSfx('dice');
   await sleep(reduced?70:88);
 }
 dice.dataset.face=String(finalRoll);
 dice.classList.remove('rolling');
 if(!reduced) await sleep(180);
}
async function animateTokenStep(playerIndex,from,to,movingPawn=null){
 const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const fromEl=board.querySelector(`.space[data-space-id="${from}"]`);
 const toEl=board.querySelector(`.space[data-space-id="${to}"]`);
 if(!fromEl||!toEl){players[playerIndex].pos=to;return movingPawn}
 if(reduced){players[playerIndex].pos=to;return movingPawn}

 let dot=movingPawn;
 if(!dot){
   dot=document.createElement('img');
   dot.className='moving-token moving-pawn';
   dot.src=characterSprite(playerIndex);
   dot.alt='';
   board.appendChild(dot);
 }
 const x1=fromEl.offsetLeft+fromEl.offsetWidth/2-15;
 const y1=fromEl.offsetTop+fromEl.offsetHeight/2-18;
 const x2=toEl.offsetLeft+toEl.offsetWidth/2-15;
 const y2=toEl.offsetTop+toEl.offsetHeight/2-18;

 dot.style.left=x1+'px';
 dot.style.top=y1+'px';
 dot.style.transform='translate3d(0,0,0)';
 const duration=125;
 const anim=dot.animate([
   {transform:'translate3d(0,0,0)'},
   {transform:`translate3d(${x2-x1}px,${y2-y1}px,0)`}
 ],{duration,easing:'linear',fill:'forwards'});
 try{await anim.finished}catch(e){}
 dot.style.left=x2+'px';
 dot.style.top=y2+'px';
 dot.style.transform='translate3d(0,0,0)';
 players[playerIndex].pos=to;
 if(to%2===0)playSfx('step');
 await sleep(4);
 return dot;
}
async function movePlayer(steps){
 const p=players[current],idx=current,initial=p.pos;
 passStart(p,steps);
 const staticPawns=[...board.querySelectorAll('.board-edge-pawns .board-pawn')].filter(el=>el.getAttribute('title')===p.name);
 staticPawns.forEach(el=>el.style.opacity='0');
 let movingPawn=null;
 for(let n=0;n<steps;n++){
   const from=p.pos,to=(from+1)%36;
   movingPawn=await animateTokenStep(idx,from,to,movingPawn);
 }
 if(movingPawn)movingPawn.remove();
 drawBoard();
 addLog(`🎲 <b>${p.name}</b> avance de ${steps} case(s) de <b>${spaces[initial].name}</b> vers <b>${spaces[p.pos].name}</b>.`);
 animateLanding(p.pos);
 await sleep(70);
 resolveSpace();
}

let jailGameState=null,jailGameFrame=null,jailHold=false,jailLastTs=0;

function closeJailEscapeGame(){
 const overlay=document.getElementById('jailEscapeOverlay');
 if(overlay){overlay.classList.remove('open','blade-broken','escaped');overlay.setAttribute('aria-hidden','true')}
 jailHold=false;jailGameState=null;jailLastTs=0;
 if(jailGameFrame){cancelAnimationFrame(jailGameFrame);jailGameFrame=null}
}
function forceEndJailTurn(){
 const modalEl=document.getElementById('modal');
 if(modalEl)modalEl.classList.remove('open','modal-decision','modal-danger','modal-jail');
 rolled=true;animating=false;pendingRentDecision=false;
 endBtn.disabled=false;
 setTimeout(()=>endBtn.click(),80);
}
function releaseFromJail(playerIndex,reason,canPlayNow=false){
 const p=players[playerIndex];if(!p)return;
 p.jailed=false;p.jailTurnsLeft=0;p.jailJustEntered=false;
 addLog('Prison : <b>'+p.name+'</b> est libéré'+(reason?' — '+reason:'')+'.');
 status.textContent=p.name+' est libre.';
 if(canPlayNow){rolled=false;animating=false;refresh();scheduleAI(350)}
 else{refresh();repairTurnState()}
}
function chooseJailWait(playerIndex,fromArrival=false){
 const p=players[playerIndex];if(!p)return;
 stat('jailWaits');
 if(fromArrival||p.jailJustEntered){
   p.jailJustEntered=false;p.jailTurnsLeft=3;
   addLog('Prison : <b>'+p.name+'</b> choisit d’attendre. 3 tours de détention.');
   forceEndJailTurn();return;
 }
 p.jailTurnsLeft=Math.max(0,(p.jailTurnsLeft||3)-1);
 addLog('Prison : <b>'+p.name+'</b> passe son tour. '+p.jailTurnsLeft+' tour(s) restant(s).');
 if(p.jailTurnsLeft<=0){
   p.jailed=false;p.jailJustEntered=false;
   addLog('Prison : <b>'+p.name+'</b> a purgé sa peine et sera libre à son prochain tour.');
 }
 forceEndJailTurn();
}
function applyJailRecidive(playerIndex,onDone){
 const p=players[playerIndex];
 if(!p?.hasEscapedJail){onDone();return}
 p.jailRecidiveCount=(p.jailRecidiveCount||0)+1;
 const improved=p.props.map(id=>spaces[id]).filter(s=>s.type==='property'&&s.level>0).sort((a,b)=>parcelValue(b)-parcelValue(a))[0];
 if(improved){improved.level=Math.max(0,improved.level-1);addLog('Récidive : <b>'+p.name+'</b> perd 1 niveau sur <b>'+improved.name+'</b>.')}
 const fine=50000;
 addLog('Récidive : <b>'+p.name+'</b> reçoit '+moneyFmt(fine)+' de sanction supplémentaire.');
 chargePlayer(playerIndex,fine,'Récidive après évasion',()=>onDone());
}
function openJailDecision(playerIndex=current,opts={}){
 const fromArrival=!!opts.fromArrival;
 const p=players[playerIndex];if(!p||!p.active||gameOver)return;
 p.jailed=true;if(fromArrival){p.jailTurnsLeft=3;p.jailJustEntered=true}
 const recidive=p.hasEscapedJail&&fromArrival;
 const render=()=>{
   const body='<div class="jail-decision">'+
    '<div class="jail-cell-visual"><div class="jail-cell-bars"><i></i><i></i><i></i><i></i><i></i></div></div>'+
    '<div class="decision-kicker">PRISON 2.0</div>'+
    '<div class="decision-title">'+p.name+' est détenu</div>'+
    '<div class="decision-sub">'+(fromArrival?'Choisis comment sortir de prison.':'Il reste '+p.jailTurnsLeft+' tour(s) avant la libération automatique.')+'</div>'+
    (recidive?'<div class="jail-recidive-note">RÉCIDIVE : 50 000 € + perte d’un niveau de propriété si possible.</div>':'')+
    '<div class="decision-balance"><span>Trésorerie</span><strong>'+moneyFmt(p.money)+'</strong></div>'+
    '<div class="jail-options">'+
      '<div class="jail-option '+(p.money>=150000?'recommended':'locked')+'"><span class="jail-option-code">SÛR</span><b>Payer la caution</b><strong>150 000 €</strong><small>Sortie immédiate et garantie.</small></div>'+
      '<div class="jail-option escape"><span class="jail-option-code">RISQUÉ</span><b>Tenter l’évasion</b><strong>0 € à avancer</strong><small>Échec : 150 000 € à régler, vente de biens si nécessaire, faillite si impossible.</small></div>'+
      '<div class="jail-option wait"><span class="jail-option-code">GRATUIT</span><b>Attendre</b><strong>'+p.jailTurnsLeft+' tour(s)</strong><small>Pas de déplacement. Les loyers continuent de fonctionner.</small></div>'+
    '</div></div>';
   modal('Prison',body,'decision');
   document.getElementById('modal').classList.add('modal-jail');
   const row=document.querySelector('#modal .row');row.innerHTML='';
   const bail=document.createElement('button');bail.className='jail-bail';bail.textContent='Caution · 150 000 €';bail.disabled=p.money<150000;
   const escape=document.createElement('button');escape.className='jail-escape';escape.textContent='Tenter l’évasion · 0 €';
   const wait=document.createElement('button');wait.className='jail-wait';wait.textContent=fromArrival?'Attendre 3 tours':'Passer ce tour';
   bail.onclick=()=>{if(p.money<150000)return;p.money-=150000;stat('moneyRemoved',150000);stat('jailBails');document.getElementById('modal').classList.remove('open','modal-decision','modal-jail');releaseFromJail(playerIndex,'caution payée',!fromArrival);if(fromArrival)repairTurnState()};
   escape.onclick=()=>{stat('jailEscapeAttempts');document.getElementById('modal').classList.remove('open','modal-decision','modal-jail');if(p.isAI)simulateAIEscape(playerIndex,fromArrival);else startJailEscapeGame(playerIndex,fromArrival)};
   wait.onclick=()=>chooseJailWait(playerIndex,fromArrival);
   row.append(bail,escape,wait);
   if(p.isAI)setTimeout(()=>{if(!p.jailed||current!==playerIndex)return;if(p.money>=260000)bail.click();else escape.click()},520);
 };
 if(recidive)applyJailRecidive(playerIndex,render);else render();
}
function enterJail(playerIndex=current){
 const p=players[playerIndex];if(!p||!p.active)return;
 stat('jailVisits');p.jailed=true;p.jailTurnsLeft=3;p.jailJustEntered=true;
 status.textContent=p.name+' est envoyé en prison.';
 addLog('Prison : <b>'+p.name+'</b> doit choisir entre caution, évasion ou détention.');
 refresh();openJailDecision(playerIndex,{fromArrival:true});
}
function maybeOpenJailTurn(){
 if(initiativeActive||gameOver||pendingDebt||pendingRentDecision||animating)return;
 const p=players[current];if(!p?.jailed)return;
 if(document.getElementById('modal')?.classList.contains('open'))return;
 if(document.getElementById('jailEscapeOverlay')?.classList.contains('open'))return;
 setTimeout(()=>{
   const p2=players[current];
   if(!p2?.jailed||gameOver||pendingDebt||pendingRentDecision||animating)return;
   if(document.getElementById('modal')?.classList.contains('open'))return;
   if(document.getElementById('jailEscapeOverlay')?.classList.contains('open'))return;
   openJailDecision(current,{fromArrival:false});
 },120);
}

function showJailEscapeFailure(playerIndex,onResolved){
 const p=players[playerIndex];if(!p)return;
 const extraFine=50000;
 const totalPenalty=100000+extraFine;
 p.jailTurnsLeft=Math.max(1,p.jailTurnsLeft||3)+1;
 p.jailJustEntered=false;
 addLog('Évasion ratée : <b>'+p.name+'</b> doit '+moneyFmt(totalPenalty)+' après son évasion ratée et +1 tour de prison.');
 status.textContent='Évasion ratée : amende et détention prolongée.';
 const body='<div class="jail-fail-screen">'+
   '<div class="jail-fail-visual"><div class="jail-alarm"></div><div class="broken-blade"><span></span><i></i></div><div class="jail-fail-bars"><i></i><i></i><i></i><i></i></div></div>'+
   '<div class="jail-fail-kicker">ALERTE SÉCURITÉ</div>'+
   '<div class="jail-fail-title">ÉVASION RATÉE</div>'+
   '<div class="jail-fail-copy">La lame a surchauffé et s’est brisée. Les gardiens vous ont intercepté avant votre fuite.</div>'+
   '<div class="jail-fail-penalties">'+
     '<div><span>ÉVASION + AMENDE</span><strong>'+moneyFmt(totalPenalty)+'</strong></div>'+
     '<div><span>DÉTENTION PROLONGÉE</span><strong>+1 TOUR</strong></div>'+
   '</div>'+
   '<div class="jail-fail-total">Il reste maintenant <b>'+p.jailTurnsLeft+' tour(s)</b> de prison.</div>'+
 '</div>';
 modal('Évasion ratée',body,'danger');
 const modalEl=document.getElementById('modal');modalEl.classList.add('modal-jail-fail');
 const row=document.querySelector('#modal .row');row.innerHTML='';
 const ok=document.createElement('button');ok.className='jail-fail-ok';ok.textContent='Compris';
 ok.onclick=()=>{
   modalEl.classList.remove('open','modal-danger','modal-jail-fail');
   playSfx('close');
   chargePlayer(playerIndex,totalPenalty,'Évasion ratée — coût et amende',()=>{
     refresh();
     if(onResolved)onResolved();
   });
 };
 row.append(ok);
 playSfx('bad');
 if(p.isAI)setTimeout(()=>ok.click(),1050);
}

function simulateAIEscape(playerIndex,fromArrival){
 const p=players[playerIndex];if(!p)return;
 const success=Math.random()<0.74;
 showCinematic(success?'start':'bankrupt',success?'ÉVASION RÉUSSIE':'ÉVASION ÉCHOUÉE',p.name,success?'La lame tient jusqu’au dernier barreau.':'La lame casse sous la chaleur.',1200);
 if(success){stat('jailEscapes');p.hasEscapedJail=true;releaseFromJail(playerIndex,'évasion réussie',!fromArrival);if(fromArrival)repairTurnState()}
 else{
   stat('jailBladeBreaks');
   addLog('Évasion : la lame de <b>'+p.name+'</b> casse. Il reste en prison.');
   showJailEscapeFailure(playerIndex,()=>{if(players[playerIndex]?.active&&!gameOver)forceEndJailTurn()});
 }
}
function startJailEscapeGame(playerIndex,fromArrival){
 const overlay=document.getElementById('jailEscapeOverlay');if(!overlay)return;
 jailGameState={playerIndex,fromArrival,bar:0,cut:0,heat:0,finished:false};jailHold=false;jailLastTs=performance.now();
 document.querySelectorAll('.jail-bar').forEach(el=>{el.classList.remove('cut','active');el.querySelector('.bar-cut').style.height='0%'});
 document.querySelector('.jail-bar[data-bar="0"]')?.classList.add('active');
 document.getElementById('jailBarLabel').textContent='1 / 4';document.getElementById('jailCutFill').style.width='0%';document.getElementById('jailHeatFill').style.width='0%';document.getElementById('jailHeatLabel').textContent='0 %';document.getElementById('jailEscapeStatus').textContent='La lame est froide. Commence doucement.';
 overlay.classList.remove('blade-broken','escaped');overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');
 jailGameFrame=requestAnimationFrame(jailEscapeTick);
}
function finishJailEscape(success){
 if(!jailGameState||jailGameState.finished)return;
 jailGameState.finished=true;jailHold=false;const state={...jailGameState},p=players[state.playerIndex],overlay=document.getElementById('jailEscapeOverlay');
 if(success){stat('jailEscapes');p.hasEscapedJail=true;overlay?.classList.add('escaped');document.getElementById('jailEscapeStatus').textContent='Évasion réussie. Les 4 barreaux sont coupés.';addLog('Évasion réussie : <b>'+p.name+'</b> quitte la prison.');playSfx('start')}
 else{stat('jailBladeBreaks');overlay?.classList.add('blade-broken');document.getElementById('jailEscapeStatus').textContent='SURCHAUFFE — la lame vient de casser.';addLog('Évasion ratée : la lame de <b>'+p.name+'</b> casse. La pénalité sera exigée après l’échec.');playSfx('bad')}
 setTimeout(()=>{
   closeJailEscapeGame();
   if(success){
     releaseFromJail(state.playerIndex,'évasion réussie',!state.fromArrival);
     if(state.fromArrival)repairTurnState();
   }else{
     showJailEscapeFailure(state.playerIndex,()=>{if(players[state.playerIndex]?.active&&!gameOver)forceEndJailTurn()});
   }
 },1100);
}
function jailEscapeTick(ts){
 if(!jailGameState||jailGameState.finished)return;
 const dt=Math.min(.05,(ts-jailLastTs)/1000||0);jailLastTs=ts;const state=jailGameState;
 if(jailHold){state.cut=Math.min(100,state.cut+44*dt);state.heat=Math.min(100,state.heat+38*dt)}
 else state.heat=Math.max(0,state.heat-30*dt);
 if(state.heat>=100){finishJailEscape(false);return}
 if(state.cut>=100){
   const barEl=document.querySelector('.jail-bar[data-bar="'+state.bar+'"]');barEl?.classList.remove('active');barEl?.classList.add('cut');
   state.bar++;state.cut=0;if(state.bar>=4){finishJailEscape(true);return}
   document.querySelector('.jail-bar[data-bar="'+state.bar+'"]')?.classList.add('active');document.getElementById('jailEscapeStatus').textContent='Barreau coupé. Laisse refroidir la lame.';playSfx('build');
 }
 const heatPct=Math.round(state.heat),cutPct=Math.round(state.cut);
 document.getElementById('jailBarLabel').textContent=(state.bar+1)+' / 4';document.getElementById('jailCutFill').style.width=cutPct+'%';document.getElementById('jailHeatFill').style.width=heatPct+'%';document.getElementById('jailHeatLabel').textContent=heatPct+' %';
 const activeBar=document.querySelector('.jail-bar[data-bar="'+state.bar+'"] .bar-cut');if(activeBar)activeBar.style.height=Math.min(12,cutPct*.12)+'px';
 const glow=document.getElementById('jailHeatGlow');if(glow)glow.style.opacity=Math.min(.85,state.heat/100);
 if(state.heat>=82)document.getElementById('jailEscapeStatus').textContent='DANGER : relâche pour refroidir !';
 else if(state.heat>=60)document.getElementById('jailEscapeStatus').textContent='La lame chauffe fortement.';
 else if(jailHold)document.getElementById('jailEscapeStatus').textContent='Sciage en cours…';
 jailGameFrame=requestAnimationFrame(jailEscapeTick);
}
const jailSawButton=document.getElementById('jailSawButton');
if(jailSawButton){
 const startSaw=e=>{e?.preventDefault();if(jailGameState&&!jailGameState.finished)jailHold=true};
 const stopSaw=e=>{e?.preventDefault();jailHold=false};
 jailSawButton.addEventListener('pointerdown',startSaw);jailSawButton.addEventListener('pointerup',stopSaw);jailSawButton.addEventListener('pointercancel',stopSaw);jailSawButton.addEventListener('pointerleave',stopSaw);window.addEventListener('pointerup',()=>{jailHold=false});
}


const BANK_CASH_BONUS=25000;
const BANK_INVESTMENT_DEPOSIT=25000;
const BANK_INVESTMENT_GAIN=15000; // +60 % du dépôt initial à chaque tour du joueur.
const BANK_ROBBERY_LOOT=[50000,100000,175000,250000];
const BANK_ROBBERY_TARGET_WIDTH=[44,34,24,16];
const BANK_ROBBERY_ALARM_SPEED=[4.5,6.5,9,13];
let bankRobberyState=null;
let bankRobberyFrame=0;
const AIRPORT_DIRECT_COST=35000;
const AIRPORT_HUBS=[1,5,11,13,33,35];

function airportHubLabel(spaceId){
 const s=spaces[spaceId];
 const zone={1:'CAPITALE',5:'RIVIERA',11:'NORD',13:'EST',33:'ATLANTIQUE',35:'NORMANDIE'}[spaceId]||'DESTINATION';
 return {id:spaceId,name:s?.name||'Destination',zone};
}
function moveByAirport(playerIndex,destinationId,mode){
 const p=players[playerIndex],from=p.pos,dest=spaces[destinationId];
 if(!p||!dest)return;
 document.getElementById('modal')?.classList.remove('open','modal-decision','modal-airport');
 p.pos=destinationId;
 addLog('Aéroport : <b>'+p.name+'</b> prend un '+(mode==='direct'?'vol direct':'vol Standby')+' vers <b>'+dest.name+'</b>.');
 status.textContent=p.name+' atterrit à '+dest.name+'.';
 drawBoard();renderPlayers();playSfx('turn');
 showAirportArrival(destinationId,()=>resolveSpace());
}
function showAirportArrival(destinationId,onDone){
 const dest=spaces[destinationId];
 const body='<div class="airport-arrival">'+
   '<div class="airport-arrival-sky"><span class="airport-plane-mark">✦</span><div class="airport-runway"></div></div>'+
   '<div class="decision-kicker">ARRIVÉE</div><div class="decision-title">'+dest.name+'</div>'+
   '<div class="decision-sub">Le vol est terminé. La case de destination va maintenant être résolue normalement.</div>'+
 '</div>';
 modal('Aéroport · Arrivée',body,'decision');
 document.getElementById('modal').classList.add('modal-airport');
 const btn=document.getElementById('modalOk');btn.textContent='Débarquer';
 btn.onclick=()=>{document.getElementById('modal').classList.remove('open','modal-decision','modal-airport');playSfx('close');if(onDone)onDone()};
}
function takeAirportDirect(playerIndex,destinationId){
 const p=players[playerIndex];if(!p||p.money<AIRPORT_DIRECT_COST)return;
 p.money-=AIRPORT_DIRECT_COST;stat('moneyRemoved',AIRPORT_DIRECT_COST);stat('airportDirect');
 addLog('Aéroport : <b>'+p.name+'</b> paie '+moneyFmt(AIRPORT_DIRECT_COST)+' pour choisir sa destination.');
 moveByAirport(playerIndex,destinationId,'direct');
}
function takeAirportStandby(playerIndex){
 const p=players[playerIndex];if(!p)return;
 const choices=AIRPORT_HUBS.filter(id=>id!==p.pos);
 const destinationId=choices[Math.floor(Math.random()*choices.length)];
 stat('airportStandby');
 moveByAirport(playerIndex,destinationId,'standby');
}
function aiChooseAirportDestination(playerIndex){
 const p=players[playerIndex];
 const scored=AIRPORT_HUBS.map(id=>{
   const s=spaces[id];let score=0;
   if(['property','beach'].includes(s.type)){
     if(s.owner===null&&p.money>=purchasePrice(s)+AI_RESERVE)score+=7;
     if(s.owner===playerIndex)score+=2;
     if(s.owner!==null&&s.owner!==playerIndex)score-=Math.min(6,currentRent(s)/10000);
     const d=s.district?wonderDistricts.find(x=>x.name===s.district):null;
     if(d)score+=districtProgress(playerIndex,d).owned*2.5;
   }
   score+=Math.random()*1.4;
   return {id,score};
 }).sort((a,b)=>b.score-a.score);
 return scored[0]?.id||AIRPORT_HUBS[0];
}
function openAirportDecision(playerIndex=current){
 const p=players[playerIndex];if(!p||!p.active||gameOver)return;
 stat('airportVisits');
 const hubs=AIRPORT_HUBS.map(airportHubLabel);
 const cards=hubs.map(h=>{
   const s=spaces[h.id],owner=s.owner!==null?players[s.owner]:null;
   const note=owner?('Propriétaire : '+owner.name+' · loyer '+moneyFmt(currentRent(s))):('Disponible · achat '+moneyFmt(purchasePrice(s)));
   return '<button class="airport-destination" data-airport-dest="'+h.id+'" '+(p.money<AIRPORT_DIRECT_COST?'disabled':'')+'>'+
     '<span class="airport-zone">'+h.zone+'</span><b>'+h.name+'</b><small>'+note+'</small></button>';
 }).join('');
 const body='<div class="airport-decision">'+
  '<div class="airport-hero"><div class="airport-terminal"><span></span><span></span><span></span></div><div><div class="decision-kicker">CASE UNIQUE · AÉROPORT</div><div class="decision-title">Choisis ton vol</div><div class="decision-sub">Un vol direct coûte '+moneyFmt(AIRPORT_DIRECT_COST)+'. Le Standby est gratuit mais la destination est aléatoire.</div></div></div>'+
  '<div class="decision-balance"><span>Trésorerie de '+p.name+'</span><strong>'+moneyFmt(p.money)+'</strong></div>'+
  '<div class="airport-board"><div class="airport-board-head"><span>VOL DIRECT</span><strong>'+moneyFmt(AIRPORT_DIRECT_COST)+'</strong></div><div class="airport-destinations">'+cards+'</div></div>'+
  '<div class="airport-standby-card"><div><span>STANDBY</span><b>Destination surprise</b><small>Gratuit · un des 6 hubs sera tiré au sort.</small></div><button id="airportStandbyBtn" type="button">VOL GRATUIT</button></div>'+
 '</div>';
 modal('Aéroport',body,'decision');
 document.getElementById('modal').classList.add('modal-airport');
 const row=document.querySelector('#modal .row');row.innerHTML='<button id="airportStayBtn" class="secondary">Rester à l’aéroport</button>';
 document.querySelectorAll('[data-airport-dest]').forEach(btn=>btn.onclick=()=>takeAirportDirect(playerIndex,+btn.dataset.airportDest));
 document.getElementById('airportStandbyBtn').onclick=()=>takeAirportStandby(playerIndex);
 document.getElementById('airportStayBtn').onclick=()=>{document.getElementById('modal').classList.remove('open','modal-decision','modal-airport');status.textContent=p.name+' reste à l’aéroport.';refresh();scheduleAI(220)};
 if(p.isAI){
   setTimeout(()=>{
     if(current!==playerIndex||!document.getElementById('modal')?.classList.contains('open'))return;
     if(p.money>=AIRPORT_DIRECT_COST+AI_RESERVE){
       const dest=aiChooseAirportDestination(playerIndex);
       document.querySelector('[data-airport-dest="'+dest+'"]')?.click();
     }else document.getElementById('airportStandbyBtn')?.click();
   },520);
 }
}


function bankCloseModal(){
 const modalEl=document.getElementById('modal');
 if(modalEl)modalEl.classList.remove('open','modal-bank','modal-bank-robbery');
 cancelAnimationFrame(bankRobberyFrame);bankRobberyFrame=0;bankRobberyState=null;
 playSfx('close');
 requestAnimationFrame(()=>{refresh();repairTurnState();scheduleAI(220);});
}
function collectBankInvestment(playerIndex){
 const p=players[playerIndex];
 if(!p?.bankInvestment)return 0;
 const amount=p.bankInvestment;
 p.money+=amount;
 p.bankInvestment=0;
 p.bankInvestmentSkip=false;
 stat('bankInvestmentPayouts');stat('moneyInjected',Math.max(0,amount-BANK_INVESTMENT_DEPOSIT));
 addLog('📈 <b>'+p.name+'</b> récupère son placement Banque 2.0 : <b>'+moneyFmt(amount)+'</b>.');
 return amount;
}
function accrueBankInvestment(playerIndex){
 const p=players[playerIndex];
 if(!p?.active||!p.bankInvestment)return;
 if(p.bankInvestmentSkip){p.bankInvestmentSkip=false;return}
 p.bankInvestment+=BANK_INVESTMENT_GAIN;
 stat('moneyInjected',BANK_INVESTMENT_GAIN);
 addLog('📈 Placement de <b>'+p.name+'</b> : +'+moneyFmt(BANK_INVESTMENT_GAIN)+' · valeur '+moneyFmt(p.bankInvestment)+'.');
}
function chooseBankCash(playerIndex){
 const p=players[playerIndex];if(!p)return;
 p.money+=BANK_CASH_BONUS;
 stat('bankCashChoices');stat('moneyInjected',BANK_CASH_BONUS);
 addLog('🏦 <b>'+p.name+'</b> choisit le versement sûr : +'+moneyFmt(BANK_CASH_BONUS)+'.');
 status.textContent='Banque 2.0 : '+moneyFmt(BANK_CASH_BONUS)+' encaissés.';
 animateBankGain(players[playerIndex].pos,playerIndex,BANK_CASH_BONUS);
 bankCloseModal();
}
function chooseBankInvestment(playerIndex){
 const p=players[playerIndex];if(!p||p.bankInvestment||p.money<BANK_INVESTMENT_DEPOSIT)return;
 p.money-=BANK_INVESTMENT_DEPOSIT;
 p.bankInvestment=BANK_INVESTMENT_DEPOSIT;
 p.bankInvestmentSkip=true;
 stat('bankInvestments');stat('moneyRemoved',BANK_INVESTMENT_DEPOSIT);
 addLog('📈 <b>'+p.name+'</b> place '+moneyFmt(BANK_INVESTMENT_DEPOSIT)+' à la Banque · +'+moneyFmt(BANK_INVESTMENT_GAIN)+' par tour jusqu’au retour à la Banque.');
 status.textContent='Placement actif : '+moneyFmt(BANK_INVESTMENT_DEPOSIT)+' · +60 % par tour.';
 bankCloseModal();
}
function finishBankRobbery(playerIndex,caught=false){
 const p=players[playerIndex];if(!p)return;
 const state=bankRobberyState;
 cancelAnimationFrame(bankRobberyFrame);bankRobberyFrame=0;bankRobberyState=null;
 const modalEl=document.getElementById('modal');
 if(modalEl)modalEl.classList.remove('open','modal-bank','modal-bank-robbery');
 if(caught){
   stat('bankRobberyCaught');
   addLog('🚨 Braquage raté : <b>'+p.name+'</b> est arrêté et envoyé en prison.');
   status.textContent='Braquage raté : direction Prison.';
   playSfx('bad');
   const jail=spaces.find(x=>x.type==='jail');if(jail)p.pos=jail.id;
   drawBoard();
   setTimeout(()=>enterJail(playerIndex),180);
   return;
 }
 const loot=state?.loot||0;
 if(loot<=0){bankCloseModal();return}
 p.money+=loot;stat('bankRobberyEscapes');stat('moneyInjected',loot);
 addLog('💰 <b>'+p.name+'</b> fuit la Banque avec <b>'+moneyFmt(loot)+'</b> de butin.');
 status.textContent='Braquage réussi : +'+moneyFmt(loot)+'.';
 animateBankGain(p.pos,playerIndex,loot);playSfx('money');
 showEventResult({title:'💰 Braquage réussi',icon:'👜',description:'Tu as quitté la Banque avant le déclenchement total de l’alarme.',effect:'+ '+moneyFmt(loot),tone:'positive'});
}
function startBankRobbery(playerIndex){
 const p=players[playerIndex];if(!p)return;
 stat('bankRobberies');
 bankRobberyState={playerIndex,stage:0,loot:0,alarm:8,cursor:0,dir:1,last:performance.now(),targetLeft:28,targetWidth:BANK_ROBBERY_TARGET_WIDTH[0],finished:false};
 const body=`
  <div class="bank-robbery">
   <div class="bank-robbery-head"><div><span>BUTIN</span><strong id="bankLoot">0 €</strong></div><div><span>COFFRE</span><strong id="bankStage">1 / 4</strong></div></div>
   <div class="bank-alarm-line"><span>ALARME</span><b id="bankAlarmPct">8 %</b></div>
   <div class="bank-alarm"><i id="bankAlarmFill"></i></div>
   <div class="bank-vault">🔐<div class="bank-vault-title" id="bankVaultTitle">COFFRE 1 · 50 000 €</div><small>Appuie quand le curseur traverse la zone sûre.</small></div>
   <div class="bank-skillbar"><div id="bankTarget" class="bank-target"></div><div id="bankCursor" class="bank-cursor"></div></div>
   <div class="bank-robbery-hint" id="bankRobberyHint">Plus tu avances, plus l’alarme monte vite.</div>
  </div>`;
 modal('🏦 Banque 2.0 · Braquage',body,'bank-robbery');
 const row=document.querySelector('#modal .row');row.innerHTML='';
 const force=document.createElement('button');force.id='bankForceBtn';force.className='primary';force.textContent='🔓 FORCER LE COFFRE';
 const flee=document.createElement('button');flee.id='bankFleeBtn';flee.className='secondary';flee.textContent='🏃 FUIR · 0 €';flee.disabled=true;
 row.append(force,flee);
 const render=()=>{
   const st=bankRobberyState;if(!st||st.finished)return;
   const target=document.getElementById('bankTarget'),cursor=document.getElementById('bankCursor'),alarm=document.getElementById('bankAlarmFill');
   if(target){target.style.left=st.targetLeft+'%';target.style.width=st.targetWidth+'%'}
   if(cursor)cursor.style.left=st.cursor+'%';
   if(alarm)alarm.style.width=Math.min(100,st.alarm)+'%';
   const ap=document.getElementById('bankAlarmPct');if(ap)ap.textContent=Math.floor(st.alarm)+' %';
   const loot=document.getElementById('bankLoot');if(loot)loot.textContent=moneyFmt(st.loot);
   const sb=document.getElementById('bankStage');if(sb)sb.textContent=Math.min(4,st.stage+1)+' / 4';
   if(flee){flee.disabled=st.loot<=0;flee.textContent='🏃 FUIR · '+moneyFmt(st.loot)}
 };
 force.onclick=()=>{
   const st=bankRobberyState;if(!st||st.finished)return;
   const hit=st.cursor>=st.targetLeft&&st.cursor<=st.targetLeft+st.targetWidth;
   const hint=document.getElementById('bankRobberyHint');
   if(hit){
     st.loot=BANK_ROBBERY_LOOT[st.stage];st.alarm=Math.min(99,st.alarm+8);st.stage++;
     if(hint)hint.textContent='✅ Coffre ouvert ! Pars maintenant ou tente le suivant.';
     playSfx('money');
     if(st.stage>=4){st.finished=true;finishBankRobbery(playerIndex,false);return}
     st.targetWidth=BANK_ROBBERY_TARGET_WIDTH[st.stage];
     st.targetLeft=10+Math.random()*(80-st.targetWidth);
     const title=document.getElementById('bankVaultTitle');if(title)title.textContent='COFFRE '+(st.stage+1)+' · '+moneyFmt(BANK_ROBBERY_LOOT[st.stage]);
   }else{
     st.alarm=Math.min(100,st.alarm+22);
     if(hint)hint.textContent='⚠️ Raté ! L’alarme bondit de 22 %.';
     playSfx('bad');
     if(st.alarm>=100){st.finished=true;finishBankRobbery(playerIndex,true);return}
   }
   render();
 };
 flee.onclick=()=>{const st=bankRobberyState;if(!st||st.loot<=0)return;st.finished=true;finishBankRobbery(playerIndex,false)};
 const tick=ts=>{
   const st=bankRobberyState;if(!st||st.finished)return;
   const dt=Math.min(.05,(ts-st.last)/1000);st.last=ts;
   st.cursor+=st.dir*82*dt;
   if(st.cursor>=100){st.cursor=100;st.dir=-1}else if(st.cursor<=0){st.cursor=0;st.dir=1}
   st.alarm+=BANK_ROBBERY_ALARM_SPEED[Math.min(3,st.stage)]*dt;
   if(st.alarm>=100){st.alarm=100;render();st.finished=true;finishBankRobbery(playerIndex,true);return}
   render();bankRobberyFrame=requestAnimationFrame(tick);
 };
 render();bankRobberyFrame=requestAnimationFrame(tick);
}
function simulateAIBankRobbery(playerIndex){
 const p=players[playerIndex];if(!p)return;
 stat('bankRobberies');
 const risk=Math.random();
 let loot=0,caught=false;
 if(risk<.12)caught=true;
 else if(risk<.42)loot=50000;
 else if(risk<.70)loot=100000;
 else if(risk<.90)loot=175000;
 else loot=250000;
 if(caught){
   stat('bankRobberyCaught');addLog('🚨 Braquage IA raté : <b>'+p.name+'</b> est arrêté.');
   const jail=spaces.find(x=>x.type==='jail');if(jail)p.pos=jail.id;
   drawBoard();setTimeout(()=>enterJail(playerIndex),350);
 }else{
   p.money+=loot;stat('bankRobberyEscapes');stat('moneyInjected',loot);
   addLog('💰 <b>'+p.name+'</b> réussit son braquage et fuit avec '+moneyFmt(loot)+'.');
   animateBankGain(p.pos,playerIndex,loot);refresh();scheduleAI(350);
 }
}
function openBankDecision(playerIndex=current){
 const p=players[playerIndex];if(!p?.active)return;
 stat('bankVisits');
 const payout=collectBankInvestment(playerIndex);
 const canInvest=!p.bankInvestment&&p.money>=BANK_INVESTMENT_DEPOSIT;
 const body=`
  <div class="bank2-shell">
   ${payout?`<div class="bank2-payout">📈 Placement arrivé à terme : <b>+${moneyFmt(payout)}</b></div>`:''}
   <div class="decision-balance"><span>Trésorerie</span><strong>${moneyFmt(p.money)}</strong></div>
   <div class="bank2-grid">
    <button class="bank2-card safe" id="bankCashChoice"><span>💵</span><b>Encaisser</b><strong>+ ${moneyFmt(BANK_CASH_BONUS)}</strong><small>Argent immédiat, aucun risque.</small></button>
    <button class="bank2-card invest" id="bankInvestChoice" ${canInvest?'':'disabled'}><span>📈</span><b>Investir</b><strong>${moneyFmt(BANK_INVESTMENT_DEPOSIT)}</strong><small>+60 % du dépôt initial par tour (+${moneyFmt(BANK_INVESTMENT_GAIN)}). Récupération au prochain retour à la Banque.</small></button>
    <button class="bank2-card robbery" id="bankRobChoice"><span>🥷</span><b>Braquer</b><strong>jusqu’à 250 000 €</strong><small>Quitte avec le butin avant 100 % d’alarme. Sinon : Prison.</small></button>
   </div>
  </div>`;
 modal('🏦 Banque 2.0',body,'bank');
 const row=document.querySelector('#modal .row');row.innerHTML='';
 document.getElementById('bankCashChoice').onclick=()=>chooseBankCash(playerIndex);
 const invest=document.getElementById('bankInvestChoice');if(invest&&!invest.disabled)invest.onclick=()=>chooseBankInvestment(playerIndex);
 document.getElementById('bankRobChoice').onclick=()=>{document.getElementById('modal').classList.remove('open','modal-bank');if(p.isAI)simulateAIBankRobbery(playerIndex);else startBankRobbery(playerIndex)};
 if(p.isAI)setTimeout(()=>{
   if(current!==playerIndex||!document.getElementById('modal')?.classList.contains('open'))return;
   const r=Math.random();
   if(canInvest&&p.money>=90000&&r<.38)document.getElementById('bankInvestChoice')?.click();
   else if(r<.63)document.getElementById('bankRobChoice')?.click();
   else document.getElementById('bankCashChoice')?.click();
 },500);
}

function resolveSpace(){const p=players[current],s=spaces[p.pos];
 if(['property','beach'].includes(s.type)){
   if(s.owner===null){
     status.textContent=`${s.name} est disponible pour ${moneyFmt(purchasePrice(s))}.`;
   } else if(s.owner!==current){
     showRentChoice(s.id);
     return;
   } else status.textContent=`Tu possèdes déjà ${s.name}.`;
 }
 else if(s.type==='start'){status.textContent='Case départ : rien de plus à payer.'}
 else if(s.type==='bank'){
 openBankDecision(current);
 return;
}
 else if(s.type==='jail'){
 enterJail(current);
 return;
}
 else if(s.type==='event'){eventCard(p)} else if(s.type==='global'){globalEvent();}
 checkWin();refresh();}

function buyoutPrice(s){return parcelValue(s)}
function showRentChoice(spaceId){
 const s=spaces[spaceId],visitor=players[current],owner=players[s.owner];
 const rent=currentRent(s),buy=buyoutPrice(s);
 pendingRentDecision=true;
 status.textContent=`${s.name} appartient à ${owner.name} : payer ou racheter ?`;
 const canBuyout=visitor.money>=buy;
 const body=`
  <div class="decision-shell">
   <div class="decision-hero">
    <div class="decision-icon">€</div>
    <div><div class="decision-kicker">PROPRIÉTÉ ADVERSE</div><div class="decision-title">${s.name}</div><div class="decision-sub">Propriétaire : ${owner.name}</div></div>
   </div>
   <div class="decision-balance"><span>Ta trésorerie</span><strong>${moneyFmt(visitor.money)}</strong></div>
   <div class="decision-grid two">
    <div class="decision-card recommended">
      <div class="decision-card-tag">OPTION SÛRE</div>
      <b>Payer le loyer</b>
      <strong>${moneyFmt(rent)}</strong>
      <small>${moneyFmt(rent)} seront versés à ${owner.name}.</small>
    </div>
    <div class="decision-card ${canBuyout?'':'locked'}">
      <div class="decision-card-tag">RACHAT</div>
      <b>Devenir propriétaire</b>
      <strong>${moneyFmt(buy)}</strong>
      <small>Niveau ${s.level} conservé${canBuyout?'.':` · il manque ${moneyFmt(buy-visitor.money)}.`}</small>
    </div>
   </div>
  </div>`;
 modal(`Décision · ${s.name}`,body,'decision');
 const row=document.querySelector('#modal .row');
 row.innerHTML='';
 const pay=document.createElement('button');
 pay.className='primary pay-rent';
 pay.textContent=`💸 Payer ${moneyFmt(rent)}`;
 pay.onclick=()=>payRentChoice(spaceId);
 const buyBtn=document.createElement('button');
 buyBtn.className='primary buyout';
 buyBtn.textContent=`🤝 Racheter ${moneyFmt(buy)}`;
 buyBtn.disabled=visitor.money<buy;
 buyBtn.title=buyBtn.disabled?'Fonds insuffisants':'';
 buyBtn.onclick=()=>buyoutChoice(spaceId);
 row.append(pay,buyBtn);
}
function closeRentChoice(){
 pendingRentDecision=false;
 document.getElementById('modal').classList.remove('open');
 playSfx('close');
 refresh();
 checkWin();
}
function payRentChoice(spaceId){
 const s=spaces[spaceId],visitor=players[current],ownerIndex=s.owner,owner=players[ownerIndex],rent=currentRent(s);
 pendingRentDecision=false;
 document.getElementById('modal').classList.remove('open');
 const full=requestPayment(current,rent,ownerIndex,`Loyer de ${s.name}`);
 if(full){
   status.textContent=`Loyer payé : ${moneyFmt(rent)}.`;playSfx('money');
   animateMoneyFlow(spaceId,current,ownerIndex,rent,'LOYER');
 }else{
   status.textContent=`Fonds insuffisants : liquidation nécessaire pour ${s.name}.`;
 }
 refresh();
 scheduleAI(220);
}
function buyoutChoice(spaceId){
 const s=spaces[spaceId],buyer=players[current];
 const oldOwnerIndex=s.owner,oldOwner=players[oldOwnerIndex],price=buyoutPrice(s);
 if(buyer.money<price)return;
 buyer.money-=price;
 oldOwner.money+=price;

 oldOwner.props=oldOwner.props.filter(id=>id!==s.id);
 buyer.props.push(s.id);
 if(s.type==='beach'){
   oldOwner.beaches=Math.max(0,oldOwner.beaches-1);
   buyer.beaches++;
 }
 s.owner=current;stat('buyouts');

 addLog(`🤝 <b>${buyer.name}</b> rachète <b>${s.name}</b> à <b>${oldOwner.name}</b> pour ${moneyFmt(price)}. Niveau ${s.level} conservé.`);
 status.textContent=`${buyer.name} devient propriétaire de ${s.name}.`;playSfx('buy');
 closeRentChoice();
 animatePurchase(s.id,current);
 pulsePlayerCard(current,'positive');
 scheduleAI(220);
}

function liquidationRate(saleIndex){return Math.max(.50,.90-(saleIndex*.10))}
function registerForcedSale(s){
 const key=zoneKey(s),z=zonePressure[key]||{level:0,roundsLeft:0};
 z.level=Math.min(3,z.level+1);
 z.roundsLeft=3;
 zonePressure[key]=z;
 const info=zonePressureInfo(s);
 addLog(`📉 <b>Pression immobilière — zone ${key}</b> : valeur -${Math.round(info.valuePenalty*100)} %, loyers -${Math.round(info.rentPenalty*100)} % pendant ${info.roundsLeft} tour(s) de table.`);
}
function recoverZonePressure(){
 Object.keys(zonePressure).forEach(key=>{
   const z=zonePressure[key];
   z.roundsLeft--;
   if(z.roundsLeft<=0){
     delete zonePressure[key];
     addLog(`📈 Le marché de la zone <b>${key}</b> est revenu à la normale.`);
   }else{
     const sample=spaces.find(s=>zoneKey(s)===key);
     if(sample){
       const i=zonePressureInfo(sample);
       addLog(`📊 La zone <b>${key}</b> se redresse : valeur -${Math.round(i.valuePenalty*100)} %, loyers -${Math.round(i.rentPenalty*100)} % (${z.roundsLeft} tour(s) restant(s)).`);
     }
   }
 });
}
function totalLiquidationPotential(playerIndex){
 const p=players[playerIndex];
 return p.props.reduce((sum,id,idx)=>{
   const s=spaces[id];
   return sum+Math.round(parcelValue(s)*liquidationRate(idx));
 },0);
}
function queueDebt(playerIndex,amount,creditorIndex=null,reason='Dette',onResolved=null){
 if(amount<=0){if(onResolved)onResolved(true);return}
 stat('debtCases');
 debtQueue.push({playerIndex,amount,creditorIndex,reason,sales:0,onResolved});
 if(!pendingDebt)processNextDebt();
}
function processNextDebt(){
 if(gameOver||pendingDebt||!debtQueue.length)return;
 pendingDebt=debtQueue.shift();
 openLiquidationModal();
}
function openLiquidationModal(){
 const d=pendingDebt;if(!d)return;
 const p=players[d.playerIndex];
 if(!p||!p.active){pendingDebt=null;processNextDebt();return}
 if(d.amount<=0){finishDebtCase();return}
 if(!p.props.length){finalizeBankruptcy(d.playerIndex);return}

 const rate=liquidationRate(d.sales);
 const pct=Math.round(rate*100);
 const assets=p.props.map(id=>{
   const s=spaces[id],value=parcelValue(s),proceeds=Math.round(value*rate),m=zonePressureInfo(s);
   return `<div class="liquidation-asset">
     <div>
       <div class="asset-name">${s.type==='beach'?'🏖️':'🏙️'} ${s.name}</div>
       <div class="asset-meta">Zone ${zoneKey(s)} · valeur marché ${moneyFmt(value)} · niveau ${s.level}${m.level?` · 📉 zone déjà sous pression`:''}</div>
     </div>
     <button class="sell-emergency" data-sell-id="${s.id}">Vendre ${moneyFmt(proceeds)}</button>
   </div>`;
 }).join('');

 const potential=totalLiquidationPotential(d.playerIndex);
 const body=`<div class="liquidation">
   <div class="debt-head">
     <b>🚨 FONDS INSUFFISANTS</b>
     <div class="big">${moneyFmt(d.amount)} à trouver</div>
     <div>${d.reason}${d.creditorIndex!==null?` · dû à ${players[d.creditorIndex]?.name||'un adversaire'}`:''}</div>
   </div>
   <div class="debt-grid">
     <div class="debt-stat"><div class="k">Trésorerie</div><div class="v">${moneyFmt(p.money)}</div></div>
     <div class="debt-stat"><div class="k">Prochaine revente</div><div class="v">${pct} %</div></div>
     <div class="debt-stat"><div class="k">Potentiel estimé</div><div class="v">${moneyFmt(potential)}</div></div>
   </div>
   <div class="liquidation-rule">La première vente d'urgence rapporte 90 % de la valeur du bien. Chaque vente supplémentaire pendant cette même crise perd 10 points, jusqu'à un minimum de 50 %. Les constructions sont incluses dans la valeur.</div>
   <div class="market-panel"><b>📉 Effet sur le marché local</b><div class="market-warning">Chaque vente forcée met la zone concernée sous pression : baisse temporaire de la valeur des biens et des loyers, puis récupération progressive sur 3 tours de table.</div></div>
   <div class="liquidation-assets">${assets}</div>
 </div>`;

 modal('Liquidation d’urgence',body,'danger');
 playSfx('bad');
 const row=document.querySelector('#modal .row');
 row.innerHTML='';
 const bankrupt=document.createElement('button');
 bankrupt.className='secondary danger';
 bankrupt.textContent='💀 Déclarer faillite';
 bankrupt.onclick=()=>finalizeBankruptcy(d.playerIndex);
 row.appendChild(bankrupt);
 document.querySelectorAll('[data-sell-id]').forEach(btn=>{
   btn.onclick=()=>emergencySell(+btn.dataset.sellId);
 });
}
function emergencySell(spaceId){
 const d=pendingDebt;if(!d)return;
 const p=players[d.playerIndex],s=spaces[spaceId];
 if(!s||s.owner!==d.playerIndex)return;
 const rate=liquidationRate(d.sales);
 const before=parcelValue(s);
 const proceeds=Math.round(before*rate);
 const key=zoneKey(s);

 p.props=p.props.filter(id=>id!==spaceId);
 if(s.type==='beach')p.beaches=Math.max(0,p.beaches-1);
 s.owner=null;
 s.level=0;
 d.sales++;stat('emergencySales');

 registerForcedSale(s);

 const applied=Math.min(proceeds,d.amount);
 d.amount-=applied;
 if(d.creditorIndex!==null&&players[d.creditorIndex]?.active)players[d.creditorIndex].money+=applied;
 const excess=proceeds-applied;
 if(excess>0)p.money+=excess;

 addLog(`🏷️ <b>${p.name}</b> vend ${s.name} en urgence à ${Math.round(rate*100)} % : ${moneyFmt(proceeds)}. Zone ${key} sous pression.`);
 playSfx('money');
 refresh();

 if(d.amount<=0){
   finishDebtCase();
 }else if(!p.props.length){
   finalizeBankruptcy(d.playerIndex);
 }else{
   openLiquidationModal();
 }
}
function finishDebtCase(){
 const d=pendingDebt;if(!d)return;
 const p=players[d.playerIndex],callback=d.onResolved;
 addLog(`✅ <b>${p.name}</b> a réglé sa dette et évite la faillite.`);
 status.textContent=`${p.name} évite la faillite après liquidation.`;
 pendingDebt=null;
 document.getElementById('modal').classList.remove('open');
 playSfx('close');
 refresh();checkWin();
 if(callback)callback(true);
 processNextDebt();
 scheduleAI(260);
}
function finalizeBankruptcy(playerIndex){
 const d=pendingDebt;
 const p=players[playerIndex];if(!p||!p.active)return;
 p.props.slice().forEach(id=>{
   const s=spaces[id];
   registerForcedSale(s);
   s.owner=null;s.level=0;
 });
 p.props=[];p.beaches=0;p.active=false;p.money=0;p.wonderMode=null;p.wonderTurnsLeft=0;stat('bankruptcies');
 addLog(`💀 <b>${p.name}</b> ne peut pas couvrir sa dette et fait faillite.`);
 status.textContent=`${p.name} fait faillite.`;
 showCinematic('bankrupt','FAILLITE',p.name,'Les actifs restants retournent sur le marché.',1900);
 const callback=d?.onResolved;
 pendingDebt=null;
 document.getElementById('modal').classList.remove('open');
 playSfx('bad');
 refresh();checkWin();
 if(callback)callback(false);
 if(!gameOver)processNextDebt();
}
function requestPayment(playerIndex,amount,creditorIndex=null,reason='Dette'){
 const p=players[playerIndex];
 if(!p||!p.active||amount<=0)return true;
 const cash=Math.min(p.money,amount);
 p.money-=cash;
 if(creditorIndex!==null&&players[creditorIndex]?.active)players[creditorIndex].money+=cash;
 const remaining=amount-cash;
 if(remaining<=0){
   if(creditorIndex!==null){stat('rentPayments');stat('rentPaid',amount);}
   addLog(`💸 <b>${p.name}</b> règle ${moneyFmt(amount)} — ${reason}.`);
   return true;
 }
 if(creditorIndex!==null){stat('rentPayments');stat('rentPaid',cash);}
 addLog(`🚨 <b>${p.name}</b> paie ${moneyFmt(cash)} mais il manque ${moneyFmt(remaining)} — ${reason}.`);
 queueDebt(playerIndex,remaining,creditorIndex,reason);
 return false;
}
function transfer(from,to,amount,reason){
 const fi=players.indexOf(from),ti=players.indexOf(to);
 return requestPayment(fi,amount,ti,reason);
}
function checkBankruptcy(p){
 if(p.money>=0)return;
 const idx=players.indexOf(p),shortfall=Math.abs(p.money);
 p.money=0;
 queueDebt(idx,shortfall,null,'Solde négatif');
}

function playerPatrimony(p){
 return Math.max(0,p.money)+p.props.reduce((sum,id)=>sum+parcelValue(spaces[id]),0);
}
function chargePlayer(playerIndex,amount,reason,onResolved=null){
 const p=players[playerIndex];
 if(!p||!p.active||amount<=0){if(onResolved)onResolved(true);return}
 stat('moneyRemoved',amount);
 const cash=Math.min(p.money,amount);
 p.money-=cash;
 const missing=amount-cash;
 if(missing<=0){
   addLog(`💸 <b>${p.name}</b> paie ${moneyFmt(amount)} — ${reason}.`);
   refresh();
   if(onResolved)onResolved(true);
 }else{
   addLog(`🚨 <b>${p.name}</b> paie ${moneyFmt(cash)} mais il manque ${moneyFmt(missing)} — ${reason}.`);
   queueDebt(playerIndex,missing,null,reason,onResolved);
 }
}
function scheduleFiscalFollowup(p){
 p.fiscalRollsLeft=2;
 addLog(`🧾 <b>${p.name}</b> aura ${moneyFmt(5000)} de frais de dossier après 2 prochains lancers de dés.`);
}
function scheduleWorks(p){
 p.worksInstallmentsLeft=4;
 addLog(`🚧 <b>${p.name}</b> échelonne les travaux : 4 prélèvements de ${moneyFmt(5000)} sur ses prochains lancers.`);
}
function showWorksChoice(p,idx){
 const body=`<div class="event-result negative">
   <div class="event-icon">🚧</div>
   <div class="event-title">Travaux imprévus</div>
   <div class="event-desc">Les travaux vont peser sur votre trésorerie dans la durée. Vous pouvez régler immédiatement ou étaler la facture sur vos 4 prochains lancers.</div>
   <div class="event-effect">${moneyFmt(20000)} au total</div>
   <div class="balance">${p.name} · ${moneyFmt(p.money)}</div>
 </div>`;
 modal('Travaux imprévus',`<div class="decision-shell"><div class="decision-hero danger"><div class="decision-icon">🚧</div><div><div class="decision-kicker">ÉVÉNEMENT</div><div class="decision-title">Travaux imprévus</div><div class="decision-sub">Choisis comment absorber la dépense.</div></div></div><div class="decision-balance"><span>Trésorerie</span><strong>${moneyFmt(p.money)}</strong></div><div class="decision-grid two"><div class="decision-card"><div class="decision-card-tag">ÉTALER</div><b>4 prélèvements</b><strong>4 × 5 000 €</strong><small>Prélevés sur les 4 prochains lancers.</small></div><div class="decision-card recommended"><div class="decision-card-tag">IMMÉDIAT</div><b>Payer maintenant</b><strong>20 000 €</strong><small>Règle le dossier immédiatement.</small></div></div></div>`,'decision');
 const row=document.querySelector('#modal .row');
 row.innerHTML='';
 const spread=document.createElement('button');
 spread.className='secondary';
 spread.textContent='📆 Échelonner 4 × 5 000 €';
 spread.onclick=()=>{
   scheduleWorks(p);
   document.getElementById('modal').classList.remove('open');
   playSfx('close');refresh();scheduleAI(220);
 };
 const pay=document.createElement('button');
 pay.className='primary';
 pay.textContent='💳 Payer 20 000 € maintenant';
 pay.onclick=()=>{
   document.getElementById('modal').classList.remove('open');
   playSfx('close');
   chargePlayer(idx,20000,'Travaux imprévus');
 };
 row.append(spread,pay);
 playSfx('bad');
}
function processScheduledCharges(playerIndex,onContinue){
 const p=players[playerIndex];
 if(!p||!p.active){onContinue();return}
 const charges=[];

 if((p.fiscalRollsLeft||0)>0){
   p.fiscalRollsLeft--;
   if(p.fiscalRollsLeft===0){
     charges.push({label:'🧾 Frais de dossier du contrôle fiscal',amount:5000});
     p.fiscalRollsLeft=0;
   }
 }
 if((p.worksInstallmentsLeft||0)>0){
   charges.push({label:`🚧 Travaux imprévus — échéance ${5-p.worksInstallmentsLeft}/4`,amount:5000});
   p.worksInstallmentsLeft--;
 }

 if(!charges.length){onContinue();return}
 const total=charges.reduce((s,c)=>s+c.amount,0);
 stat('scheduledCharges',charges.length);

 const details=charges.map(c=>`<div style="padding:6px 0;border-bottom:1px solid #fee2e2"><b>${c.label}</b><br><span>${moneyFmt(c.amount)}</span></div>`).join('');
 const body=`<div class="event-result negative">
   <div class="event-icon">📅</div>
   <div class="event-title">Prélèvement avant le lancer</div>
   <div class="event-desc">${details}</div>
   <div class="event-effect">Total : -${moneyFmt(total)}</div>
   <div class="balance">${p.name} · ${moneyFmt(p.money)}</div>
 </div>`;
 modal('Charge différée',body,'danger');
 const btn=document.getElementById('modalOk');
 btn.textContent='Payer et lancer les dés';
 btn.onclick=()=>{
   document.getElementById('modal').classList.remove('open');
   playSfx('close');
   chargePlayer(playerIndex,total,'Charges différées',ok=>{if(ok&&p.active)onContinue();});
 };
 playSfx('bad');
}
function applyPropertyTax(p,idx){
 const patrimony=playerPatrimony(p);
 const tax=Math.round(patrimony*.35);
 stat('propertyTaxes');
 const desc=`Votre patrimoine total est estimé à ${moneyFmt(patrimony)}. La taxe représente 35 % de cette valeur.`;
 const body=`<div class="event-result negative">
   <div class="event-icon">🏠</div>
   <div class="event-title">Taxe foncière</div>
   <div class="event-desc">${desc}</div>
   <div class="event-effect">À payer : -${moneyFmt(tax)}</div>
   <div class="balance">${p.name} · trésorerie ${moneyFmt(p.money)}</div>
 </div>`;
 modal('Taxe foncière',body,'danger');
 const btn=document.getElementById('modalOk');
 btn.textContent='Régler la taxe';
 btn.onclick=()=>{
   document.getElementById('modal').classList.remove('open');
   playSfx('close');
   chargePlayer(idx,tax,'Taxe foncière');
 };
 playSfx('bad');
}


function openPatrimony(){
 const modalEl=document.getElementById('patrimonyModal'),list=document.getElementById('patrimonyList');
 if(!modalEl||!list)return;
 const ranking=players.map((p,index)=>({
   index,name:p.name,isAI:p.isAI,active:p.active,cash:p.money,
   propertyValue:p.props.reduce((sum,id)=>sum+parcelValue(spaces[id]),0),
   total:playerPatrimony(p),properties:p.props.length,beaches:p.beaches
 })).sort((a,b)=>b.total-a.total);
 list.innerHTML=ranking.map((r,pos)=>`<div class="patrimony-row ${!r.active?'inactive':''}">
   <div class="patrimony-rank">${pos+1}</div>
   ${pawnVisual(r.index,r.name,'patrimony-pawn')}
   <div class="patrimony-copy"><b>${r.name}${r.isAI?' <span>IA</span>':''}</b><small>${r.properties} bien(s) · ${r.beaches} plage(s)</small></div>
   <div class="patrimony-values"><small>Cash ${moneyFmt(r.cash)}</small><small>Biens ${moneyFmt(r.propertyValue)}</small><strong>${moneyFmt(r.total)}</strong></div>
 </div>`).join('');
 modalEl.classList.add('open');modalEl.setAttribute('aria-hidden','false');playSfx('open');
}
function closePatrimony(){
 const el=document.getElementById('patrimonyModal');if(!el)return;
 el.classList.remove('open');el.setAttribute('aria-hidden','true');playSfx('close');
}
function showDisasterFx(kind,title,sub,duration=1800){
 const el=document.getElementById('disasterFx');if(!el)return;
 el.className='disaster-fx show '+kind;
 document.getElementById('disasterFxTitle').textContent=title||'';
 document.getElementById('disasterFxSub').textContent=sub||'';
 el.setAttribute('aria-hidden','false');
 clearTimeout(showDisasterFx._timer);
 showDisasterFx._timer=setTimeout(()=>{el.classList.remove('show','flood','quake');el.setAttribute('aria-hidden','true')},duration);
}
function availableOwnedProperties(){
 return spaces.filter(s=>['property','beach'].includes(s.type)&&s.owner!==null&&players[s.owner]?.active);
}
function earthquakeChoices(affected,index=0){
 if(index>=affected.length){refresh();scheduleAI(250);return}
 const s=affected[index],ownerIndex=s.owner,owner=players[ownerIndex];
 if(!owner?.active){earthquakeChoices(affected,index+1);return}
 const cost=30000;
 const body=`<div class="quake-decision">
   <div class="disaster-visual quake-mini"><span></span><span></span><span></span></div>
   <div class="decision-kicker">SÉISME · PROPRIÉTÉ ENDOMMAGÉE</div>
   <div class="decision-title">${s.name}</div>
   <div class="decision-sub">Le loyer est divisé par 4 jusqu'à la fin des réparations.</div>
   <div class="decision-grid two">
    <div class="decision-card ${owner.money>=cost?'recommended':'locked'}"><div class="decision-card-tag">IMMÉDIAT</div><b>Réparer maintenant</b><strong>${moneyFmt(cost)}</strong><small>Le loyer normal revient immédiatement.</small></div>
    <div class="decision-card"><div class="decision-card-tag">AUTOMATIQUE</div><b>Attendre 2 tours</b><strong>2 tours</strong><small>Le bien reste à 25 % de son loyer pendant la réparation.</small></div>
   </div>
 </div>`;
 modal(`Séisme · ${owner.name}`,body,'decision');
 const row=document.querySelector('#modal .row');row.innerHTML='';
 const repair=document.createElement('button');repair.className='primary quake-repair-now';repair.textContent=`Réparer · ${moneyFmt(cost)}`;repair.disabled=owner.money<cost;
 const wait=document.createElement('button');wait.className='secondary quake-repair-auto';wait.textContent='Réparation automatique · 2 tours';
 const finish=()=>{document.getElementById('modal').classList.remove('open','modal-decision');playSfx('close');refresh();setTimeout(()=>earthquakeChoices(affected,index+1),180)};
 repair.onclick=()=>{if(owner.money<cost)return;owner.money-=cost;stat('moneyRemoved',cost);s.repairTurnsLeft=0;s.repairSkipCountdown=false;addLog(`Réparation : <b>${owner.name}</b> répare <b>${s.name}</b> pour ${moneyFmt(cost)}.`);finish()};
 wait.onclick=()=>{s.repairTurnsLeft=2;s.repairSkipCountdown=(ownerIndex===current);addLog(`Réparation : <b>${s.name}</b> sera réparée automatiquement dans 2 tours de ${owner.name}.`);finish()};
 row.append(repair,wait);
 if(owner.isAI)setTimeout(()=>{if(owner.money-cost>=AI_RESERVE&&!repair.disabled)repair.click();else wait.click()},420);
}
function triggerFlood(p){
 p.floodTurnsLeft=1;p.floodSkipCountdown=true;
 addLog(`Grande inondation : les biens de <b>${p.name}</b> ne génèrent plus de loyer pendant 1 tour.`);
 status.textContent='Grande inondation : loyers suspendus.';
 showDisasterFx('flood','GRANDE INONDATION',`${p.name} · loyers suspendus pendant 1 tour`,1900);
 refresh();
 showEventResult({title:'Grande inondation',icon:'',description:`Les propriétés de ${p.name} ne rapportent aucun loyer pendant 1 tour.`,effect:'LOYERS = 0',tone:'negative'});
}
function triggerEarthquake(){
 const pool=availableOwnedProperties().sort(()=>Math.random()-.5);
 const affected=pool.slice(0,Math.min(4,pool.length));
 if(!affected.length){
   showDisasterFx('quake','SÉISME','Aucune propriété n’a été touchée',1500);
   showEventResult({title:'Séisme',icon:'',description:'Le séisme traverse la ville, mais aucune propriété possédée n’est touchée.',effect:'Aucun dégât',tone:'neutral'});return;
 }
 affected.forEach(s=>{s.repairTurnsLeft=2;s.repairSkipCountdown=(s.owner===current)});
 showDisasterFx('quake','SÉISME',`${affected.length} propriété(s) endommagée(s)`,1900);
 addLog(`Séisme : ${affected.map(s=>`<b>${s.name}</b>`).join(', ')} endommagée(s).`);
 const names=affected.map(s=>s.name).join(' · ');
 showEventResult({
   title:'Séisme',icon:'',
   description:`${affected.length} propriété(s) ont été endommagées : ${names}. Chaque propriétaire choisira entre 30 000 € de réparation immédiate ou 2 tours de réparation automatique.`,
   effect:'Loyers des biens touchés ÷ 4',
   tone:'negative',
   afterClose:()=>earthquakeChoices(affected)
 });
}
function triggerLottery(p){
 const rewards=[10000,20000,40000,60000,100000,200000];
 const reward=rewards[Math.floor(Math.random()*rewards.length)];
 p.money+=reward;stat('moneyInjected',reward);
 addLog(`Loto : <b>${p.name}</b> gagne ${moneyFmt(reward)}.`);
 refresh();
 showEventResult({title:'Loto',icon:'',description:'La roue s’arrête sur votre gain.',effect:`+${moneyFmt(reward)}`,tone:'positive'});
}
function triggerOverconsumption(p,idx){
 const amount=Math.round(playerPatrimony(p)*.15);
 addLog(`Surconsommation : <b>${p.name}</b> doit régler 15 % de son patrimoine, soit ${moneyFmt(amount)}.`);
 status.textContent='Surconsommation : prélèvement exceptionnel.';
 showEventResult({title:'Surconsommation',icon:'',description:'Une facture exceptionnelle représente 15 % de votre patrimoine total.',effect:`-${moneyFmt(amount)}`,tone:'negative',afterClose:()=>chargePlayer(idx,amount,'Surconsommation')});
}
function triggerDoubleChance(p){
 p.doubleChance=true;
 addLog(`Double chance : <b>${p.name}</b> lancera 2 dés à son prochain lancer. Un double offre un lancer supplémentaire.`);
 refresh();
 showEventResult({title:'Double chance',icon:'',description:'Lors de votre prochain lancer, deux dés seront utilisés. Si les deux valeurs sont identiques, vous pourrez relancer.',effect:'2 dés au prochain lancer',tone:'positive'});
}

function eventCard(p){const cards=[
 {t:'Contrat surprise',icon:'💼',desc:'Votre entreprise décroche un contrat inattendu.',kind:'cash',amount:40000,d:'+40 000 €',tone:'positive'},
 {t:'Contrôle fiscal',icon:'🧾',desc:'Le fisc prélève 30 000 € immédiatement. Des frais de dossier de 5 000 € tomberont après vos 2 prochains lancers.',kind:'fiscal',tone:'negative'},
 {t:'Investisseur providentiel',icon:'💰',desc:'Un investisseur décide de soutenir votre développement.',kind:'cash',amount:25000,d:'+25 000 €',tone:'positive'},
 {t:'Travaux imprévus',icon:'🚧',desc:'Une facture de 20 000 € peut être payée maintenant ou répartie sur les 4 prochains lancers.',kind:'works',tone:'negative'},
 {t:'Taxe foncière',icon:'🏠',desc:'Une taxe exceptionnelle de 35 % est calculée sur votre patrimoine total.',kind:'propertyTax',tone:'negative'},
 {t:'Voyage d’affaires',icon:'✈️',desc:'Une opportunité vous fait avancer plus vite.',kind:'move',move:3,d:'Avance de 3 cases',tone:'neutral'},
 {t:'Double chance',icon:'',desc:'Deux dés au prochain lancer. Un double offre un lancer supplémentaire.',kind:'doubleChance',tone:'positive'},
 {t:'Grande inondation',icon:'',desc:'Les propriétés du joueur ne rapportent aucun loyer pendant 1 tour.',kind:'flood',tone:'negative'},
 {t:'Surconsommation',icon:'',desc:'15 % du patrimoine total doit être réglé.',kind:'overconsumption',tone:'negative'},
 {t:'Loto',icon:'',desc:'Une roue attribue un gain entre 10 000 € et 200 000 €.',kind:'lottery',tone:'positive'},
 {t:'Séisme',icon:'',desc:'Jusqu’à 4 propriétés possédées sont endommagées.',kind:'earthquake',tone:'negative'}
 ];
 const c=cards[Math.floor(Math.random()*cards.length)],idx=players.indexOf(p);stat('events');
 if(c.kind==='doubleChance'){triggerDoubleChance(p);return}
 if(c.kind==='flood'){triggerFlood(p);return}
 if(c.kind==='overconsumption'){triggerOverconsumption(p,idx);return}
 if(c.kind==='lottery'){triggerLottery(p);return}
 if(c.kind==='earthquake'){triggerEarthquake();return}
 if(c.kind==='works'){
   addLog(`⚡ Événement pour <b>${p.name}</b> : Travaux imprévus — ${moneyFmt(20000)} à régler.`);
   status.textContent='Événement : Travaux imprévus.';
   refresh();showWorksChoice(p,idx);return;
 }
 if(c.kind==='propertyTax'){
   const patrimony=playerPatrimony(p),tax=Math.round(patrimony*.35);
   addLog(`⚡ Événement pour <b>${p.name}</b> : Taxe foncière — 35 % de ${moneyFmt(patrimony)} = ${moneyFmt(tax)}.`);
   status.textContent='Événement : Taxe foncière.';
   refresh();applyPropertyTax(p,idx);return;
 }
 if(c.kind==='fiscal'){
   scheduleFiscalFollowup(p);
   addLog(`⚡ Événement pour <b>${p.name}</b> : Contrôle fiscal (-${moneyFmt(30000)} maintenant, puis ${moneyFmt(5000)} après 2 lancers).`);
   status.textContent='Événement : Contrôle fiscal.';
   const body=`<div class="event-result negative">
     <div class="event-icon">🧾</div>
     <div class="event-title">Contrôle fiscal</div>
     <div class="event-desc">${c.desc}</div>
     <div class="event-effect">Débit immédiat : -${moneyFmt(30000)}</div>
     <div class="balance">${p.name} · ${moneyFmt(p.money)}</div>
   </div>`;
   modal('Contrôle fiscal',body,'danger');
   const btn=document.getElementById('modalOk');
   btn.textContent='Régler 30 000 €';
   btn.onclick=()=>{
     document.getElementById('modal').classList.remove('open');
     playSfx('close');
     chargePlayer(idx,30000,'Contrôle fiscal');
   };
   playSfx('bad');return;
 }
 let afterClose=null;
 if(c.kind==='move'){
   passStart(p,c.move);p.pos=(p.pos+c.move)%36;
   afterClose=()=>{addLog(`✈️ <b>${p.name}</b> arrive sur <b>${spaces[p.pos].name}</b>.`);resolveSpace();};
 }else if(c.kind==='cash'&&c.amount>=0){
   p.money+=c.amount;stat('moneyInjected',c.amount);
 }
 addLog(`⚡ Événement pour <b>${p.name}</b> : ${c.t} (${c.d}).`);
 status.textContent=`Événement : ${c.t}.`;
 refresh();
 showEventResult({title:`⚡ ${c.t}`,icon:c.icon,description:c.desc,effect:c.d,tone:c.tone,afterClose});
}
function globalEvent(){const events=[
 {t:'Boom économique',icon:'📈',desc:'La conjoncture profite à toutes les entreprises.',d:'Tous les joueurs gagnent 20 000 €',effect:'+ 20 000 € par joueur',tone:'positive',type:'cash',amount:20000},
 {t:'Inflation',icon:'💸',desc:'La hausse des coûts frappe toutes les entreprises.',d:'Tous les joueurs perdent 15 000 €',effect:'- 15 000 € par joueur',tone:'negative',type:'cash',amount:-15000},
 {t:'Tourisme record',icon:'🏖️',desc:'Les destinations balnéaires connaissent une fréquentation exceptionnelle.',d:'Chaque propriétaire de plage gagne 30 000 € par plage',effect:'+ 30 000 € par plage',tone:'positive',type:'beach'}
 ];
 const e=events[Math.floor(Math.random()*events.length)],queued=[];stat('globalEvents');
 players.forEach((p,idx)=>{
   if(!p.active)return;
   if(e.type==='beach'){const gain=p.beaches*30000;p.money+=gain;stat('moneyInjected',gain);return}
   if(e.amount>=0){p.money+=e.amount;stat('moneyInjected',e.amount);return}
   const due=Math.abs(e.amount);stat('moneyRemoved',due);
   if(p.money>=due)p.money-=due;
   else{const cash=p.money;p.money=0;queued.push({idx,shortfall:due-cash});}
 });
 addLog(`🌍 <b>Événement mondial :</b> ${e.t} — ${e.d}.`);
 status.textContent=`Événement mondial : ${e.t}.`;refresh();
 showEventResult({
   title:`🌍 ${e.t}`,icon:e.icon,description:e.desc,effect:e.effect,tone:e.tone,
   afterClose:queued.length?()=>{queued.forEach(x=>debtQueue.push({playerIndex:x.idx,amount:x.shortfall,creditorIndex:null,reason:e.t,sales:0}));processNextDebt();}:null
 });
}


function simOneGame(profile='current'){
 const useNewEvents=profile==='current';
 const P=4;
 const ps=Array.from({length:P},()=>({money:200000,pos:0,active:true,props:[],beaches:0,fiscal:0,works:0,wonder:null,wonderLeft:0,wonderSkip:false,flood:0,floodSkip:false,doubleChance:false,bankInvestment:0,bankSkip:false,jailed:0,escapedBefore:false}));
 const ss=spaces.map(s=>({type:s.type,price:s.price,baseRent:s.baseRent,owner:null,level:0,repair:0,repairSkip:false}));
 const simDistricts=[[1,5,8,31],[2,7,10,11],[14,16,23,29],[3,19,21,33],[13,17,24,35],[20,26,28,30]];
 let actions=0,purchases=0,rentsPaid=0,buyouts=0,liquidations=0,bankruptcies=0,upgrades=0,propertyTaxes=0,scheduledCharges=0,wondersStarted=0,wonderWins=0,eventCount=0,bankVisits=0,bankCash=0,bankInvestments=0,bankRobberies=0,bankCaught=0,bankInjected=0;
 let winnerReason='timeout';
 const bugs=[];
 const collective=()=>ps.some(p=>p.active&&p.wonder==='communist'&&p.wonderLeft>0);
 const simUpgradeCost=(s,l)=>s.type==='property'?roundPriceStep(Math.round(s.price*([0,.25,.35,.50][l]||0))):0;
 const simValue=s=>{let v=s.price;for(let l=1;l<=s.level;l++)v+=simUpgradeCost(s,l);return v};
 const patrimony=p=>p.money+p.props.reduce((sum,id)=>sum+simValue(ss[id]),0);
 const fullDistrict=pi=>simDistricts.some(ids=>ids.every(id=>ss[id].owner===pi));
 const simRent=s=>{
   const owner=s.owner!==null?ps[s.owner]:null;
   if(owner?.flood>0)return 0;
   return Math.round(rentForPrice(s.price,s.level,s.type)*(collective()?.35:1)*((s.repair||0)>0?.25:1));
 };
 function auditState(){
   for(let i=0;i<ps.length;i++){
     const p=ps[i];
     if(!Number.isFinite(p.money)||p.money<0)bugs.push('cash');
     if(p.beaches<0||p.beaches>4)bugs.push('beaches');
     if(new Set(p.props).size!==p.props.length)bugs.push('duplicate-prop');
     for(const sid of p.props)if(ss[sid]?.owner!==i)bugs.push('owner-link');
   }
   for(const s of ss){
     if(s.level<0||s.level>3)bugs.push('level');
     if(s.owner!==null&&(s.owner<0||s.owner>=P))bugs.push('owner-index');
     if((s.repair||0)<0)bugs.push('repair');
   }
 }
 function liquidate(pi,need,creditor=null){
   const p=ps[pi];let sale=0;
   while(need>0&&p.props.length){
     let bestIndex=0,bestValue=-1;
     p.props.forEach((sid,idx)=>{const v=simValue(ss[sid]);if(v>bestValue){bestValue=v;bestIndex=idx}});
     const sid=p.props.splice(bestIndex,1)[0],s=ss[sid];
     const proceeds=Math.round(simValue(s)*Math.max(.5,.9-sale*.1));sale++;liquidations++;
     if(s.type==='beach')p.beaches=Math.max(0,p.beaches-1);
     s.owner=null;s.level=0;s.repair=0;s.repairSkip=false;
     const used=Math.min(proceeds,need);need-=used;
     if(creditor!==null&&ps[creditor]?.active)ps[creditor].money+=used;
     p.money+=proceeds-used;
   }
   if(need>0){
     p.active=false;p.money=0;p.wonder=null;p.wonderLeft=0;bankruptcies++;
     p.props.forEach(sid=>{ss[sid].owner=null;ss[sid].level=0;ss[sid].repair=0;ss[sid].repairSkip=false});
     p.props=[];p.beaches=0;return false;
   }
   return true;
 }
 function pay(pi,amt,creditor=null){
   const p=ps[pi];if(!p?.active)return false;
   const cash=Math.min(p.money,amt);p.money-=cash;
   if(creditor!==null&&ps[creditor]?.active)ps[creditor].money+=cash;
   const rem=amt-cash;
   return rem>0?liquidate(pi,rem,creditor):true;
 }
 function move(pi,steps){
   const p=ps[pi];
   if(p.pos+steps>=36)p.money+=30000;
   p.pos=(p.pos+steps)%36;
 }
 function earthquake(currentPi){
   const owned=ss.map((s,i)=>({s,i})).filter(x=>['property','beach'].includes(x.s.type)&&x.s.owner!==null&&ps[x.s.owner]?.active);
   for(let i=owned.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[owned[i],owned[j]]=[owned[j],owned[i]]}
   owned.slice(0,4).forEach(({s})=>{
     const owner=ps[s.owner];
     if(owner.money-30000>=AI_RESERVE){owner.money-=30000;s.repair=0;s.repairSkip=false}
     else{s.repair=2;s.repairSkip=(s.owner===currentPi)}
   });
 }
 function event(pi){
   eventCount++;
   const p=ps[pi],count=useNewEvents?11:6,r=Math.floor(Math.random()*count);
   if(r===0)p.money+=40000;
   else if(r===1){p.fiscal=2;pay(pi,30000,null)}
   else if(r===2)p.money+=25000;
   else if(r===3){if(p.money>=65000&&Math.random()<.35)pay(pi,20000,null);else p.works=4}
   else if(r===4){propertyTaxes++;pay(pi,Math.round(patrimony(p)*.35),null)}
   else if(r===5)move(pi,3);
   else if(r===6)p.doubleChance=true;
   else if(r===7){p.flood=1;p.floodSkip=true}
   else if(r===8)pay(pi,Math.round(patrimony(p)*.15),null);
   else if(r===9){const rewards=[10000,20000,40000,60000,100000,200000];p.money+=rewards[Math.floor(Math.random()*rewards.length)]}
   else if(r===10)earthquake(pi);
 }
 for(let step=0;step<1200;step++){
   const pi=step%P,p=ps[pi];if(!p.active)continue;actions++;
   if(p.bankInvestment){
     if(p.bankSkip)p.bankSkip=false;
     else{p.bankInvestment+=BANK_INVESTMENT_GAIN;bankInjected+=BANK_INVESTMENT_GAIN}
   }
   if(p.jailed>0){
     if(p.money>=260000){pay(pi,150000,null);p.jailed=0}
     else if(p.money>=100000){
       pay(pi,100000,null);
       if(Math.random()<.74){p.jailed=0;p.escapedBefore=true}
       else{pay(pi,50000,null);p.jailed++}
     }else{
       p.jailed=Math.max(0,p.jailed-1);
     }
     continue;
   }

   if(p.flood>0){if(p.floodSkip)p.floodSkip=false;else p.flood=Math.max(0,p.flood-1)}
   p.props.forEach(id=>{const s=ss[id];if(s.repair>0){if(s.repairSkip)s.repairSkip=false;else s.repair=Math.max(0,s.repair-1)}});

   if(p.wonder){
     if(p.wonderSkip)p.wonderSkip=false;
     else if(--p.wonderLeft<=0){wonderWins++;winnerReason='wonder';break}
   }
   if(!p.wonder&&fullDistrict(pi)){
     if(p.money>=400000){p.money-=400000;p.wonder='fast';p.wonderLeft=5;p.wonderSkip=true;wondersStarted++}
     else{p.wonder='communist';p.wonderLeft=8;p.wonderSkip=true;wondersStarted++}
   }

   if(p.fiscal>0){p.fiscal--;if(p.fiscal===0){scheduledCharges++;if(!pay(pi,5000,null))continue}}
   if(p.works>0){scheduledCharges++;p.works--;if(!pay(pi,5000,null))continue}

   let roll=1+Math.floor(Math.random()*6);
   if(useNewEvents&&p.doubleChance){
     const second=1+Math.floor(Math.random()*6),first=roll;
     p.doubleChance=false;roll=first+second;
     if(first===second)roll+=1+Math.floor(Math.random()*6);
   }
   move(pi,roll);
   const s=ss[p.pos];

   if(s.type==='property'||s.type==='beach'){
     if(s.owner===null){
       if(p.money>=s.price+45000){p.money-=s.price;s.owner=pi;p.props.push(p.pos);if(s.type==='beach')p.beaches++;purchases++}
     }else if(s.owner!==pi&&ps[s.owner]?.active){
       const price=simValue(s),rent=simRent(s);
       if(p.money>price*1.6&&Math.random()<.18){
         const old=s.owner;p.money-=price;ps[old].money+=price;
         ps[old].props=ps[old].props.filter(x=>x!==p.pos);p.props.push(p.pos);
         if(s.type==='beach'){ps[old].beaches--;p.beaches++}
         s.owner=pi;buyouts++;
       }else{rentsPaid++;pay(pi,rent,s.owner)}
     }else if(s.owner===pi&&s.type==='property'&&s.level<3){
       const cost=upgradeCost(s,s.level+1);
       if(p.money>=cost+70000&&Math.random()<.34){p.money-=cost;s.level++;upgrades++}
     }
   }else if(s.type==='bank'){
     bankVisits++;
     if(p.bankInvestment){p.money+=p.bankInvestment;p.bankInvestment=0;p.bankSkip=false}
     const r=Math.random();
     if(p.money>=90000&&r<.38){
       p.money-=BANK_INVESTMENT_DEPOSIT;p.bankInvestment=BANK_INVESTMENT_DEPOSIT;p.bankSkip=true;bankInvestments++;
     }else if(r<.63){
       bankRobberies++;
       const rr=Math.random();
       if(rr<.12){bankCaught++;p.jailed=3}
       else{
         const loot=rr<.42?50000:rr<.70?100000:rr<.90?175000:250000;
         p.money+=loot;bankInjected+=loot;
       }
     }else{p.money+=BANK_CASH_BONUS;bankCash++;bankInjected+=BANK_CASH_BONUS}
   }
   else if(s.type==='jail'){
     p.jailed=3;
     if(p.escapedBefore)pay(pi,50000,null);
   }
   else if(s.type==='airport'){
     const hubs=[1,5,11,13,33,35];
     const destination=hubs[Math.floor(Math.random()*hubs.length)];
     if(p.money>=35000+55000)p.money-=35000;
     p.pos=destination;
     const dest=ss[destination];
     if(dest.type==='property'||dest.type==='beach'){
       if(dest.owner===null){
         if(p.money>=dest.price+45000){p.money-=dest.price;dest.owner=pi;p.props.push(destination);if(dest.type==='beach')p.beaches++;purchases++}
       }else if(dest.owner!==pi&&ps[dest.owner]?.active){
         rentsPaid++;pay(pi,simRent(dest),dest.owner);
       }
     }
   }
   else if(s.type==='event')event(pi);
   else if(s.type==='global'){
     const r=Math.floor(Math.random()*3);
     ps.forEach((q,qi)=>{if(!q.active)return;if(r===0)q.money+=20000;else if(r===1)pay(qi,15000,null);else q.money+=q.beaches*30000});
   }

   auditState();
   const alive=ps.filter(x=>x.active);
   if(alive.length<=1){winnerReason='bankruptcy';break}
   if(ps.some(x=>x.active&&x.beaches===4)){winnerReason='beaches';break}
 }
 auditState();
 return {profile,actions,rounds:actions/P,winnerReason,purchases,rentsPaid,buyouts,liquidations,bankruptcies,upgrades,propertyTaxes,scheduledCharges,wondersStarted,wonderWins,eventCount,bankVisits,bankCash,bankInvestments,bankRobberies,bankCaught,bankInjected,bugs:[...new Set(bugs)],finished:winnerReason!=='timeout'};
}
function summarizeSim(arr){
 const avg=k=>arr.reduce((a,x)=>a+(x[k]||0),0)/arr.length;
 const sorted=arr.map(x=>x.actions).sort((a,b)=>a-b);
 const med=sorted[Math.floor(sorted.length*.5)]||0;
 const p90=sorted[Math.floor(sorted.length*.9)]||0;
 const pct=reason=>arr.filter(x=>x.winnerReason===reason).length/arr.length*100;
 return {
   med,p90,minutes:med*12/60,finish:arr.filter(x=>x.finished).length/arr.length*100,
   bankruptcy:pct('bankruptcy'),beaches:pct('beaches'),wonder:pct('wonder'),timeout:pct('timeout'),
   bankruptcies:avg('bankruptcies'),purchases:avg('purchases'),upgrades:avg('upgrades'),liquidations:avg('liquidations'),events:avg('eventCount'),bankVisits:avg('bankVisits'),bankCash:avg('bankCash'),bankInvestments:avg('bankInvestments'),bankRobberies:avg('bankRobberies'),bankCaught:avg('bankCaught'),bankInjected:avg('bankInjected'),
   bugGames:arr.filter(x=>x.bugs.length).length,
   bugTypes:[...new Set(arr.flatMap(x=>x.bugs))]
 };
}
function runDevSimulation(count){
 const result=document.getElementById('simResult');if(!result)return;
 result.textContent='Simulation comparative de '+count.toLocaleString('fr-FR')+' parties par version…';
 setTimeout(()=>{
   const legacy=[],current=[];
   for(let i=0;i<count;i++){legacy.push(simOneGame('legacy'));current.push(simOneGame('current'))}
   const a=summarizeSim(legacy),b=summarizeSim(current);
   const deltaMin=b.minutes-a.minutes,deltaBank=b.bankruptcy-a.bankruptcy;
   const trend=(v,unit='')=>(v>0?'+':'')+v.toFixed(1)+unit;
   result.innerHTML='<b>Comparatif '+count.toLocaleString('fr-FR')+' + '+count.toLocaleString('fr-FR')+' parties · 4 joueurs</b><br>'+
   '<b>Durée médiane :</b> avant '+a.med+' actions (~'+a.minutes.toFixed(1)+' min) → actuelle '+b.med+' actions (~'+b.minutes.toFixed(1)+' min) · <b>'+trend(deltaMin,' min')+'</b><br>'+
   '<b>90 % des parties :</b> terminées avant '+b.p90+' actions (~'+(b.p90*12/60).toFixed(0)+' min)<br><br>'+
   '<b>Types de victoire V0.51 :</b><br>'+
   'Faillite : <b>'+b.bankruptcy.toFixed(2)+' %</b> ('+trend(deltaBank,' pt')+') · Plages : <b>'+b.beaches.toFixed(2)+' %</b> · Merveille : <b>'+b.wonder.toFixed(2)+' %</b> · Limite : <b>'+b.timeout.toFixed(2)+' %</b><br>'+
   'Parties terminées : <b>'+b.finish.toFixed(2)+' %</b><br><br>'+
   'Moyennes actuelles : '+b.purchases.toFixed(1)+' achats · '+b.upgrades.toFixed(1)+' améliorations · '+b.liquidations.toFixed(1)+' liquidations · '+b.bankruptcies.toFixed(2)+' faillites · '+b.events.toFixed(1)+' événements.<br>'+ 'Banque 2.0 : '+b.bankVisits.toFixed(1)+' visites · '+b.bankCash.toFixed(1)+' cash · '+b.bankInvestments.toFixed(1)+' placements · '+b.bankRobberies.toFixed(1)+' braquages · '+b.bankCaught.toFixed(2)+' arrestations · '+moneyFmt(Math.round(b.bankInjected))+' injectés en moyenne.<br>'+
   '<b>Audit :</b> '+(b.bugGames===0?'✅ aucune incohérence détectée':'⚠️ '+b.bugGames+' partie(s) avec anomalie : '+b.bugTypes.join(', '))+'<br>'+
   '<span style="font-size:10px">Estimation temps = 12 s par action. Bots simplifiés : comparaison d’équilibrage, pas prédiction parfaite des humains.</span>';
 },20);
}
function runDevAudit(count=5000){
 const result=document.getElementById('simResult');if(!result)return;
 result.textContent='Audit de '+count.toLocaleString('fr-FR')+' parties V0.51…';
 setTimeout(()=>{
   const arr=[];for(let i=0;i<count;i++)arr.push(simOneGame('current'));
   const s=summarizeSim(arr);
   const bugLine=s.bugGames ? ('⚠️ Types : '+s.bugTypes.join(', ')) : '✅ Propriétaires, niveaux, cash, plages et réparations cohérents.';
   result.innerHTML='<b>Audit QA · '+count.toLocaleString('fr-FR')+' parties</b><br>'+
   'États invalides : <b>'+s.bugGames+'</b> / '+count.toLocaleString('fr-FR')+'<br>'+
   bugLine+'<br>'+
   'Terminaison : <b>'+s.finish.toFixed(2)+' %</b> · médiane '+s.med+' actions · P90 '+s.p90+' actions.<br>'+
   'Victoires : faillite '+s.bankruptcy.toFixed(2)+' % · plages '+s.beaches.toFixed(2)+' % · Merveille '+s.wonder.toFixed(2)+' %.';
 },20);
}

function resetTransientUI(){
 initiativeActive=false;initiativeScores=[];
 const init=document.getElementById('initiativeOverlay');
 if(init){init.classList.remove('open');init.setAttribute('aria-hidden','true');}
 const modalEl=document.getElementById('modal');
 if(modalEl)modalEl.classList.remove('open','event-positive','event-negative','event-neutral');
 ['journalModal','updatesModal','settingsModal','patrimonyModal'].forEach(id=>{
   const el=document.getElementById(id);
   if(el){el.classList.remove('open');el.setAttribute('aria-hidden','true');}
 });
 closeJailEscapeGame();
 const disaster=document.getElementById('disasterFx');if(disaster)disaster.classList.remove('show','flood','quake');
 const cine=document.getElementById('cinematicOverlay');
 if(cine){cine.classList.remove('show');cine.setAttribute('aria-hidden','true');}
}
function showCinematic(kind,kicker,title,sub='',duration=1750){
 const el=document.getElementById('cinematicOverlay');if(!el)return;
 const iconMap={
   start:'➜',bank:'€',build:'▲',wonder:'★',bankrupt:'×',victory:'◆',level3:'III'
 };
 document.getElementById('cinematicIcon').textContent=iconMap[kind]||'◆';
 document.getElementById('cinematicKicker').textContent=kicker||'BUSINESS FAST';
 document.getElementById('cinematicTitle').textContent=title||'';
 document.getElementById('cinematicSub').textContent=sub||'';
 el.className='cinematic-overlay '+kind;
 el.setAttribute('aria-hidden','false');
 void el.offsetWidth;el.classList.add('show');
 clearTimeout(showCinematic._timer);
 showCinematic._timer=setTimeout(()=>{
   el.classList.remove('show');
   el.setAttribute('aria-hidden','true');
 },duration);
}
function showWonderProgress(playerIndex){
 const p=players[playerIndex];if(!p?.wonderMode)return;
 const total=p.wonderMode==='communist'?8:5;
 const done=Math.max(0,total-p.wonderTurnsLeft);
 if(done>0&&p.wonderTurnsLeft>0){
   showCinematic('wonder','CHANTIER MERVEILLE',`Étape ${Math.min(3,Math.ceil((done/total)*3))} / 3`,`${p.name} · ${p.wonderTurnsLeft} tour(s) restant(s)`,1250);
 }
}
function declareWinner(winner,reason='remporte Business Fast'){
 if(gameOver||!winner)return;
 gameOver=true;
 showCinematic('victory','VICTOIRE',winner.name,`${reason} · BUSINESS FAST`,2600);
 modal('🏆 Victoire !',`<div class="winner visual-alpha-winner"><img src="assets/wonder/final.svg" alt=""><strong>${winner.name}</strong></div><p>${reason} et remporte Business Fast !</p>`);
 addLog(`🏆 <b>${winner.name}</b> ${reason} et gagne la partie !`);
 refresh();
}
function checkWin(){if(gameOver)return; const active=players.filter(p=>p.active); let winner=null,reason=''; if((winMode==='both'||winMode==='bankrupt')&&active.length===1){winner=active[0];reason='reste le dernier joueur solvable'} if(!winner&&(winMode==='both'||winMode==='beaches')){winner=players.find(p=>p.active&&p.beaches===4);if(winner)reason='contrôle les 4 plages'} if(winner)declareWinner(winner,reason);}
function pulsePlayerCard(playerIndex,tone='positive'){
 const cards=playerBox.querySelectorAll('.player');
 const el=cards[playerIndex];if(!el)return;
 el.classList.remove('money-positive','money-negative','turn-pulse');
 void el.offsetWidth;
 el.classList.add(tone==='negative'?'money-negative':tone==='turn'?'turn-pulse':'money-positive');
 setTimeout(()=>el.classList.remove('money-positive','money-negative','turn-pulse'),900);
}
function animateLanding(spaceId){
 const tile=board.querySelector(`.space[data-space-id="${spaceId}"]`);if(!tile)return;
 tile.classList.remove('landing-hit');void tile.offsetWidth;tile.classList.add('landing-hit');
 const ring=document.createElement('div');ring.className='landing-ring';tile.appendChild(ring);
 setTimeout(()=>{tile.classList.remove('landing-hit');ring.remove()},760);
}
function animateMoneyFlow(spaceId,fromIndex,toIndex,amount,label='LOYER'){
 const tile=board.querySelector(`.space[data-space-id="${spaceId}"]`);if(!tile)return;
 const layer=document.createElement('div');layer.className='money-flow';
 layer.innerHTML=`<div class="money-flow-label">${label}</div><div class="money-chip minus">-${shortMoneyFmt(amount)}</div>${toIndex!==null?'<div class="money-stream"><i></i><i></i><i></i><i></i><i></i></div>':''}${toIndex!==null?`<div class="money-chip plus">+${shortMoneyFmt(amount)}</div>`:''}`;
 tile.appendChild(layer);
 pulsePlayerCard(fromIndex,'negative');
 if(toIndex!==null)pulsePlayerCard(toIndex,'positive');
 setTimeout(()=>layer.remove(),1350);
}
function animateBankGain(spaceId,playerIndex,amount){
 const tile=board.querySelector(`.space[data-space-id="${spaceId}"]`);if(!tile)return;
 const burst=document.createElement('div');burst.className='cash-burst';
 burst.innerHTML=`<span>+${shortMoneyFmt(amount)}</span><i></i><i></i><i></i><i></i><i></i><i></i>`;
 tile.appendChild(burst);pulsePlayerCard(playerIndex,'positive');
 setTimeout(()=>burst.remove(),1150);
}
function animateTurnChange(playerIndex){
 document.querySelector('.center-face')?.classList.remove('turn-swap');
 void document.querySelector('.center-face')?.offsetWidth;
 document.querySelector('.center-face')?.classList.add('turn-swap');
 pulsePlayerCard(playerIndex,'turn');
 setTimeout(()=>document.querySelector('.center-face')?.classList.remove('turn-swap'),760);
}
function animatePurchase(spaceId, ownerIndex){
 const tile=board.querySelector(`.space[data-space-id="${spaceId}"]`); if(!tile) return;
 const flash=document.createElement('div'); flash.className='buy-flash'; flash.style.setProperty('--flash-color', colors[ownerIndex]);
 tile.appendChild(flash);
 setTimeout(()=>flash.remove(), 920);
}
function animateBuild(spaceId){
 const tile=board.querySelector(`.space[data-space-id="${spaceId}"]`); if(!tile) return;
 const badge=document.createElement('div'); badge.className='build-pop'; badge.textContent='🏠 Maison construite';
 (tile.querySelector('.tile-face')||tile).appendChild(badge);
 setTimeout(()=>badge.remove(), 820);
}
async function executeRoll(){
 if(rolled||gameOver||animating||pendingRentDecision||pendingDebt)return;
 const p=players[current];
 rolled=true;animating=true;stat('rolls');
 const first=1+Math.floor(Math.random()*6);
 const useDouble=!!p.doubleChance;
 const second=useDouble?1+Math.floor(Math.random()*6):0;
 lastRoll=useDouble?first+second:first;
 try{
   status.textContent=useDouble?'Double chance : les deux dés roulent...':'Les dés roulent...';updateActions();await animateDice(first);
   if(useDouble){
     await sleep(110);
     document.getElementById('dice').dataset.face=String(second);
     addLog(`Double chance : <b>${p.name}</b> obtient ${first} + ${second} = ${lastRoll}.`);
     p.doubleChance=false;
   }
   status.textContent=`${p.name} avance de ${lastRoll} case(s)...`;
   await movePlayer(lastRoll);
   if(useDouble&&first===second&&!gameOver){
     rolled=false;
     addLog(`Double : <b>${p.name}</b> gagne un lancer supplémentaire.`);
     status.textContent='Double : lancer supplémentaire disponible.';
   }
 }catch(err){
   console.error('[Business Fast] erreur pendant le lancer',err);
   status.textContent='Le tour a été récupéré après une erreur d’animation.';
 }finally{
   animating=false;
   refresh();
   repairTurnState();
   scheduleAI(280);
 }
}
rollBtn.onclick=()=>{if(rolled||gameOver||animating||pendingRentDecision||pendingDebt)return;processScheduledCharges(current,()=>executeRoll())};
buyBtn.onclick=()=>{const p=players[current],s=spaces[p.pos],price=purchasePrice(s);if(s.owner!==null||p.money<price)return;p.money-=price;s.owner=current;p.props.push(s.id);if(s.type==='beach')p.beaches++;stat('purchases');addLog(`🏙️ <b>${p.name}</b> achète <b>${s.name}</b> pour ${moneyFmt(price)}. Loyer de départ : ${moneyFmt(currentRent(s))}.`);status.textContent=`${s.name} acheté · loyer ${moneyFmt(currentRent(s))}.`;refresh();animatePurchase(s.id,current);checkWin();requestAnimationFrame(()=>repairTurnState());};
buildBtn.onclick=()=>{const s=spaces[players[current].pos];upgradeProperty(s.id);};
wonderBtn.onclick=openWonderModal;
endBtn.onclick=()=>{if(animating&&!document.getElementById('modal')?.classList.contains('open'))animating=false;if(!rolled||gameOver||pendingRentDecision||pendingDebt||animating)return;playSfx('turn');rolled=false;stat('turns');
 const previous=current;
 const previousPlayer=players[previous];
 if(previousPlayer){
   if(previousPlayer.floodTurnsLeft>0){
     if(previousPlayer.floodSkipCountdown)previousPlayer.floodSkipCountdown=false;
     else{
       previousPlayer.floodTurnsLeft=Math.max(0,previousPlayer.floodTurnsLeft-1);
       if(previousPlayer.floodTurnsLeft===0)addLog(`Fin de l'inondation : les loyers de <b>${previousPlayer.name}</b> reviennent à la normale.`);
     }
   }
   previousPlayer.props.forEach(id=>{
     const prop=spaces[id];
     if((prop.repairTurnsLeft||0)>0){
       if(prop.repairSkipCountdown)prop.repairSkipCountdown=false;
       else{
         prop.repairTurnsLeft=Math.max(0,prop.repairTurnsLeft-1);
         if(prop.repairTurnsLeft===0)addLog(`Réparation terminée : <b>${prop.name}</b> retrouve son loyer normal.`);
       }
     }
   });
 }
 accrueBankInvestment(previous);
 if(advanceWonderForPlayer(previous))return;
 do{current=(current+1)%players.length}while(!players[current].active);
 if(current<=previous){roundNumber++;recoverZonePressure();}
 document.getElementById('dice').dataset.face='1';status.textContent=`${players[current].name}, à toi de jouer.`;addLog(`➡️ Tour de <b>${players[current].name}</b> · tour de table ${roundNumber}.`);refresh();animateTurnChange(current)};

const initiativeOverlay=document.getElementById('initiativeOverlay');
const initiativePlayers=document.getElementById('initiativePlayers');
const initiativeDice=document.getElementById('initiativeDice');
const initiativeMessage=document.getElementById('initiativeMessage');
const initiativeContinue=document.getElementById('initiativeContinue');

function renderInitiativePlayers(scores=initiativeScores){
 if(!initiativePlayers)return;
 initiativePlayers.innerHTML=players.map((p,index)=>{
   const score=scores[index]??'—';
   return `<div class="initiative-player" data-initiative-player="${index}">
     ${pawnVisual(index,p.name,'initiative-pawn')}
     <div class="initiative-player-copy">
       <div class="initiative-player-name">${p.name}</div>
       <div class="initiative-player-type">${p.isAI?'🤖 IA difficile':'👤 Humain'}</div>
     </div>
     <div class="initiative-score" data-initiative-score="${index}">${score}</div>
   </div>`;
 }).join('');
}

async function animateInitiativeDie(finalRoll){
 if(!initiativeDice)return;
 initiativeDice.classList.add('rolling');
 const start=performance.now(),duration=520;
 let last=-1;
 await new Promise(resolve=>{
  function frame(now){
   const step=Math.floor((now-start)/85);
   if(step!==last){last=step;initiativeDice.dataset.face=String(1+Math.floor(Math.random()*6));if(step%3===0)playSfx('dice')}
   if(now-start<duration)requestAnimationFrame(frame);else resolve();
  }
  requestAnimationFrame(frame);
 });
 initiativeDice.dataset.face=String(finalRoll);
 initiativeDice.classList.remove('rolling');
 await sleep(140);
}

async function rollInitiativeFor(index){
 const player=players[index];
 document.querySelectorAll('.initiative-player').forEach(el=>el.classList.remove('current'));
 document.querySelector(`[data-initiative-player="${index}"]`)?.classList.add('current');
 if(initiativeMessage)initiativeMessage.textContent=`${player.name} lance le dé…`;
 await sleep(220);
 const roll=1+Math.floor(Math.random()*6);
 await animateInitiativeDie(roll);
 initiativeScores[index]=roll;
 const scoreEl=document.querySelector(`[data-initiative-score="${index}"]`);
 if(scoreEl)scoreEl.textContent=roll;
 if(initiativeMessage)initiativeMessage.textContent=`${player.name} obtient ${roll}.`;
 playSfx(roll>=5?'money':'turn');
 await sleep(430);
 return roll;
}

async function resolveInitiativeTie(playerIndexes){
 let remaining=[...playerIndexes];
 while(remaining.length>1){
   if(initiativeMessage)initiativeMessage.textContent=`Égalité ! Relance entre ${remaining.map(i=>players[i].name).join(', ')}.`;
   await sleep(700);
   const roundScores=[];
   for(const index of remaining){
     const score=await rollInitiativeFor(index);
     roundScores.push({index,score});
   }
   const best=Math.max(...roundScores.map(x=>x.score));
   remaining=roundScores.filter(x=>x.score===best).map(x=>x.index);
 }
 return remaining[0];
}

async function startInitiative(){
 initiativeActive=true;
 rolled=false;
 animating=true;
 initiativeScores=new Array(players.length).fill(null);
 if(initiativeOverlay){
   initiativeOverlay.classList.add('open');
   initiativeOverlay.setAttribute('aria-hidden','false');
 }
 if(initiativeContinue)initiativeContinue.hidden=true;
 if(initiativeDice)initiativeDice.dataset.face='1';
 renderInitiativePlayers();
 if(initiativeMessage)initiativeMessage.textContent='Tirage de l’ordre de départ…';
 updateActions();
 await sleep(500);

 for(let i=0;i<players.length;i++)await rollInitiativeFor(i);

 const bestScore=Math.max(...initiativeScores);
 const leaders=initiativeScores.map((score,index)=>({score,index})).filter(x=>x.score===bestScore).map(x=>x.index);
 const winnerIndex=leaders.length===1?leaders[0]:await resolveInitiativeTie(leaders);
 current=winnerIndex;

 document.querySelectorAll('.initiative-player').forEach(el=>el.classList.remove('current','winner'));
 document.querySelector(`[data-initiative-player="${winnerIndex}"]`)?.classList.add('winner');
 if(initiativeMessage)initiativeMessage.innerHTML=`🏆 <b>${players[winnerIndex].name}</b> commence la partie !`;
 addLog(`🎲 <b>${players[winnerIndex].name}</b> remporte le lancer d’initiative et commence la partie.`);
 animating=false;
 if(initiativeContinue)initiativeContinue.hidden=false;
}

if(initiativeContinue){
 initiativeContinue.onclick=()=>{
   initiativeOverlay?.classList.remove('open');
   initiativeOverlay?.setAttribute('aria-hidden','true');
   initiativeActive=false;
   rolled=false;
   animating=false;
   const die=document.getElementById('dice');if(die)die.dataset.face='1';
   status.textContent=`${players[current].name}, tu commences la partie.`;
   refresh();
   animateTurnChange(current);
   scheduleAI(650);
 };
}

function startGame(){
 resetTransientUI();pendingRentDecision=false;pendingDebt=null;debtQueue=[];zonePressure={};roundNumber=1;resetDevStats();
 ensureAudio();stopLobbyMusic();playSfx('start');startAmbient();
 const n=+document.getElementById('playerCount').value;winMode=document.getElementById('winMode').value;
 players=[];
 const usedNames=[];
 for(let i=0;i<n;i++){
   const typeBtn=document.querySelector(`[data-player-type="${i+1}"]`);
   const isAI=typeBtn?.dataset.mode==='ai';
   const input=document.getElementById('p'+(i+1));
   let playerName=(input?.value||'').trim();
   if(isAI){
     if(!playerName||/^Joueur \d+$/i.test(playerName))playerName=randomAiName(usedNames);
   }else if(!playerName){
     playerName=`Joueur ${i+1}`;
   }
   usedNames.push(playerName);
   players.push({name:playerName,isAI,characterId:document.getElementById('character'+(i+1))?.value||characterIds[i%characterIds.length],aiDifficulty:isAI?'hard':null,money:200000,pos:0,props:[],beaches:0,active:true,fiscalRollsLeft:0,worksInstallmentsLeft:0,wonderMode:null,wonderTurnsLeft:0,wonderLine:null,wonderSkipCountdown:false,floodTurnsLeft:0,floodSkipCountdown:false,doubleChance:false,bankInvestment:0,bankInvestmentSkip:false,jailed:false,jailTurnsLeft:0,jailJustEntered:false,hasEscapedJail:false,jailRecidiveCount:0});
 }
 spaces.forEach(s=>{s.owner=null;s.level=0;s.rent=rents[s.id];s.baseRent=rents[s.id];s.repairTurnsLeft=0;s.repairSkipCountdown=false});
 current=0;rolled=false;gameOver=false;animating=false;initiativeActive=true;initiativeScores=[];logBox.innerHTML='';
 document.getElementById('startScreen').classList.remove('active');document.getElementById('gameScreen').classList.add('active');
 const aiCount=players.filter(p=>p.isAI).length;
 addLog(`🚀 Partie créée avec ${n} joueurs · ${aiCount} IA difficile(s). Chacun commence avec ${moneyFmt(200000)}.`);
 status.textContent='Lancer d’initiative…';
 drawBoard();renderPlayers();updateActions();refreshDevStats();
 setTimeout(()=>startInitiative(),420);
}document.getElementById('startBtn').onclick=startGame;
document.getElementById('restartBtn').onclick=()=>{if(confirm('Recommencer la partie ?')){playSfx('close');stopAmbient();resetTransientUI();pendingRentDecision=false;pendingDebt=null;debtQueue=[];animating=false;rolled=false;lastRoll=0;const resetDie=document.getElementById('dice');if(resetDie){resetDie.classList.remove('rolling');resetDie.dataset.face='1';}if(typeof setDevMode==='function')setDevMode(false);document.getElementById('gameScreen').classList.remove('active');document.getElementById('startScreen').classList.add('active');stopAmbient();setTimeout(startLobbyMusic,120)}};


const devPanel=document.getElementById('devPanel');
const devToggle=document.getElementById('devToggle');
const devClose=document.getElementById('devClose');
function setDevMode(open){
 devMode=!!open;
 devPanel.style.display=devMode?'block':'none';
 devPanel.classList.toggle('open',devMode);
 devPanel.setAttribute('aria-hidden',devMode?'false':'true');
 devToggle.textContent=devMode?'✕ Fermer DEV':'🧪 DEV';
 devToggle.setAttribute('aria-expanded',devMode?'true':'false');
 if(devMode){
   refreshDevStats();
   if(!devTimer)devTimer=setInterval(refreshDevStats,1000);
   requestAnimationFrame(()=>{devPanel.scrollTop=0;});
 }else if(devTimer){
   clearInterval(devTimer);devTimer=null;
 }
}
devToggle.onclick=()=>setDevMode(!devMode);
if(devClose)devClose.onclick=()=>setDevMode(false);
document.getElementById('devCash').onclick=()=>{
 if(!players[current]||gameOver)return;players[current].money+=50000;stat('moneyInjected',50000);
 addLog(`🧪 DEV : +${moneyFmt(50000)} à <b>${players[current].name}</b>.`);refresh();
};
document.getElementById('devDebt').onclick=()=>{
 if(!players[current]||gameOver||pendingDebt)return;
 const p=players[current],amount=250000,cash=Math.min(p.money,amount);p.money-=cash;const missing=amount-cash;
 addLog(`🧪 DEV : dette test de ${moneyFmt(amount)} pour <b>${p.name}</b>.`);
 if(missing>0)queueDebt(current,missing,null,'Dette test développeur');else stat('moneyRemoved',amount);
 refresh();
};
document.getElementById('devEvent').onclick=()=>{if(players[current]&&!pendingDebt&&!pendingRentDecision&&!gameOver)eventCard(players[current])};
document.getElementById('devJail').onclick=()=>{
 if(!players[current]||pendingDebt||pendingRentDecision||gameOver)return;
 const jailSpace=spaces.find(s=>s.type==='jail');if(jailSpace)players[current].pos=jailSpace.id;
 addLog('DEV : test Prison 2.0 pour <b>'+players[current].name+'</b>.');drawBoard();enterJail(current);
};
document.getElementById('devAirport').onclick=()=>{
 if(!players[current]||pendingDebt||pendingRentDecision||gameOver)return;
 const airport=spaces.find(s=>s.type==='airport');if(airport)players[current].pos=airport.id;
 addLog('DEV : test Aéroport pour <b>'+players[current].name+'</b>.');drawBoard();openAirportDecision(current);
};
document.getElementById('devFiscal').onclick=()=>{
 if(!players[current]||pendingDebt||pendingRentDecision||gameOver)return;
 const p=players[current];scheduleFiscalFollowup(p);
 showEventResult({title:'🧾 Test contrôle fiscal',icon:'🧾',description:'Test DEV : 30 000 € maintenant puis 5 000 € après 2 lancers.',effect:'-30 000 € maintenant',tone:'negative',afterClose:()=>chargePlayer(current,30000,'Contrôle fiscal DEV')});
};
document.getElementById('devWorks').onclick=()=>{if(players[current]&&!pendingDebt&&!pendingRentDecision&&!gameOver)showWorksChoice(players[current],current)};
document.getElementById('devTax').onclick=()=>{if(players[current]&&!pendingDebt&&!pendingRentDecision&&!gameOver)applyPropertyTax(players[current],current)};
document.getElementById('devWonderLine').onclick=()=>{
 if(!players[current]||gameOver)return;
 const district=wonderDistricts[0];
 district.ids.forEach(id=>{
   const s=spaces[id];
   if(s.owner!==null&&s.owner!==current){
     const old=players[s.owner];old.props=old.props.filter(x=>x!==id);
   }
   s.owner=current;
   if(!players[current].props.includes(id))players[current].props.push(id);
 });
 addLog(`🧪 DEV : <b>${players[current].name}</b> reçoit les 3 propriétés du <b>${district.name}</b>.`);
 refresh();
};
document.getElementById('devFinishWonder').onclick=()=>{
 const target=players.find(p=>p.active&&p.wonderMode&&p.wonderTurnsLeft>0);
 if(!target){addLog('🧪 DEV : aucune Merveille active à terminer.');return}
 addLog(`🧪 DEV : la construction de la Merveille de <b>${target.name}</b> est terminée instantanément.`);
 declareWinner(target,'achève sa Merveille');
};
document.getElementById('devGlobal').onclick=()=>{if(players[current]&&!pendingDebt&&!pendingRentDecision&&!gameOver)globalEvent()};
document.getElementById('sim100').onclick=()=>runDevSimulation(100);
document.getElementById('sim1000').onclick=()=>runDevSimulation(1000);
document.getElementById('simDebug').onclick=()=>runDevAudit(5000);

document.querySelectorAll('[data-character-select]').forEach(select=>{
 select.addEventListener('change',()=>{
  const slot=select.dataset.characterSelect;
  const preview=document.querySelector('[data-character-preview="'+slot+'"]');
  if(preview){preview.src='assets/characters/'+select.value+'.svg';preview.alt=characterNames[characterIds.indexOf(select.value)]||'Personnage'}
 });
});
const playerCountSelect=document.getElementById('playerCount');
const lobbyPlayerSummary=document.getElementById('lobbyPlayerSummary');
const lobbyAiSummary=document.getElementById('lobbyAiSummary');
function refreshLobbySetup(){
 const count=+playerCountSelect.value;
 document.querySelectorAll('[data-player-slot]').forEach(slot=>{
   const idx=+slot.dataset.playerSlot;
   slot.classList.toggle('slot-hidden',idx>count);
 });
 const active=[...document.querySelectorAll('[data-player-type]')].filter(b=>+b.dataset.playerType<=count);
 const aiCount=active.filter(b=>b.dataset.mode==='ai').length;
 if(lobbyPlayerSummary)lobbyPlayerSummary.textContent=`${count} joueur${count>1?'s':''}`;
 if(lobbyAiSummary)lobbyAiSummary.textContent=`${aiCount} IA · ${count-aiCount} humain${count-aiCount>1?'s':''}`;
}
document.querySelectorAll('[data-player-type]').forEach(btn=>{
 btn.dataset.mode='human';
 btn.onclick=()=>{
   ensureAudio();startLobbyMusic();playSfx('click');
   const idx=+btn.dataset.playerType;
   const input=document.getElementById('p'+idx);
   const toAI=btn.dataset.mode!=='ai';
   btn.dataset.mode=toAI?'ai':'human';
   btn.classList.toggle('ai',toAI);btn.classList.toggle('human',!toAI);
   btn.setAttribute('aria-pressed',toAI?'true':'false');
   btn.querySelector('.type-icon').textContent=toAI?'🤖':'👤';
   btn.querySelector('.type-copy b').textContent=toAI?'IA difficile':'Humain';
   btn.querySelector('.type-copy small').textContent=toAI?'Stratégique':'Contrôle manuel';
   if(toAI){
     const used=[...document.querySelectorAll('[data-player-type][data-mode="ai"]')].map(b=>document.getElementById('p'+b.dataset.playerType)?.value).filter(Boolean);
     input.value=randomAiName(used.filter(n=>n!==input.value));
     input.readOnly=true;
     input.closest('.player-slot')?.classList.add('is-ai');
   }else{
     input.readOnly=false;
     if(AI_NAMES.includes(input.value))input.value=`Joueur ${idx}`;
     input.closest('.player-slot')?.classList.remove('is-ai');
   }
   refreshLobbySetup();
 };
});
playerCountSelect.addEventListener('change',refreshLobbySetup);
document.getElementById('startScreen')?.addEventListener('pointerdown',()=>{ensureAudio();startLobbyMusic()},{once:true});
document.getElementById('startScreen')?.addEventListener('keydown',()=>{ensureAudio();startLobbyMusic()},{once:true});
refreshLobbySetup();

const settingsModal=document.getElementById('settingsModal');
document.getElementById('settingsBtn').onclick=()=>{ensureAudio();syncAudioUI();settingsModal.classList.add('open');settingsModal.setAttribute('aria-hidden','false');playSfx('open')};
document.getElementById('settingsClose').onclick=()=>{settingsModal.classList.remove('open');settingsModal.setAttribute('aria-hidden','true');playSfx('close')};
document.getElementById('musicToggle').onclick=()=>{audioSettings.music=!audioSettings.music;applyAudioSettings();playSfx('click')};
document.getElementById('sfxToggle').onclick=()=>{audioSettings.sfx=!audioSettings.sfx;applyAudioSettings();if(audioSettings.sfx)playSfx('click')};
document.getElementById('musicVolume').oninput=e=>{audioSettings.musicVolume=+e.target.value/100;applyAudioSettings()};
document.getElementById('sfxVolume').oninput=e=>{audioSettings.sfxVolume=+e.target.value/100;applyAudioSettings();playSfx('click')};
settingsModal.addEventListener('click',e=>{if(e.target===settingsModal){settingsModal.classList.remove('open');settingsModal.setAttribute('aria-hidden','true');playSfx('close')}});
syncAudioUI();
