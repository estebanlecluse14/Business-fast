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
const diceFaces=['','⚀','⚁','⚂','⚃','⚄','⚅'];

/* --- Moteur audio synthétique, sans fichier externe --- */
let audioCtx=null,musicGain=null,sfxGain=null,musicTimer=null,musicStep=0;
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
 [110.00,146.83,164.81,220.00],
 [98.00,130.81,164.81,196.00],
 [116.54,146.83,174.61,233.08]
];
function playAmbientChord(){
 if(!audioSettings.music||!ensureAudio())return;
 const chord=musicChords[musicStep++%musicChords.length];
 chord.forEach((f,i)=>{
  const now=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=i===0?'sine':'triangle';o.frequency.value=f;
  g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(i===0?.055:.025,now+.7);g.gain.exponentialRampToValueAtTime(.0001,now+3.1);
  o.connect(g);g.connect(musicGain);o.start(now);o.stop(now+3.2);
 });
}
function startAmbient(){if(!audioSettings.music||musicTimer)return;ensureAudio();playAmbientChord();musicTimer=setInterval(playAmbientChord,3200)}
function stopAmbient(){if(musicTimer){clearInterval(musicTimer);musicTimer=null}}
function applyAudioSettings(){updateAudioGains();if(audioSettings.music)startAmbient();else stopAmbient();saveAudioSettings();syncAudioUI()}
function syncAudioUI(){
 const mt=document.getElementById('musicToggle'),st=document.getElementById('sfxToggle'),mv=document.getElementById('musicVolume'),sv=document.getElementById('sfxVolume');
 if(mt){mt.textContent=audioSettings.music?'Activée':'Désactivée';mt.classList.toggle('on',audioSettings.music)}
 if(st){st.textContent=audioSettings.sfx?'Activés':'Désactivés';st.classList.toggle('on',audioSettings.sfx)}
 if(mv)mv.value=Math.round(audioSettings.musicVolume*100);if(sv)sv.value=Math.round(audioSettings.sfxVolume*100);
}

const names=[
'DÉPART','Paris','Lyon','Marseille','Événement','Nice','Plage Azur','Toulouse','Bordeaux','Banque',
'Nantes','Lille','Événement mondial','Strasbourg','Montpellier','Plage Atlantique','Rennes','Reims','Prison','Le Havre',
'Saint-Étienne','Toulon','Événement','Grenoble','Dijon','Plage Manche','Angers','Nîmes','Banque','Villeurbanne',
'Clermont-Ferrand','Aix-en-Provence','Événement mondial','Brest','Plage Méditerranée','Caen'];
const types=names.map((n,i)=> i===0?'start': n.includes('Plage')?'beach': n==='Prison'?'jail': n==='Banque'?'bank': n==='Événement'?'event': n==='Événement mondial'?'global':'property');
const ECONOMY_VALUE_BOOST=1.15;
const basePrices=names.map((n,i)=> types[i]==='property'? roundPriceStep(Math.round((32000 + ((i*7000)%36000))*ECONOMY_VALUE_BOOST)) : types[i]==='beach'?roundPriceStep(Math.round(75000*ECONOMY_VALUE_BOOST)):0);
const RENT_BOOST=1.20;
const rents=basePrices.map((p,i)=> p?roundRentStep(p*0.18*RENT_BOOST):0);
const upgradeCosts=[0,30000,20000,55000];
const rentMultipliers=[1,1.5,2.1,3];
function baseParcelValue(s){
  if(!s.price)return 0;
  let v=s.price;
  for(let lvl=1;lvl<=s.level;lvl++)v+=upgradeCosts[lvl];
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
  const raw=(s.baseRent ?? s.rent ?? 0) * (rentMultipliers[s.level] || 1);
  const m=zonePressureInfo(s);
  const wonderMultiplier=communistWonderActive()?.35:1;
  return roundRentStep(raw*(1-m.rentPenalty)*wonderMultiplier);
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
 beach:{label:'Vacances',emoji:'🌊',color:'#0891b2'}
};
const wonderDistricts=[
 {name:'Quartier Tech',label:'Tech',emoji:'💻',color:'#7c3aed',ids:[1,23,29]},
 {name:'Quartier Luxe',label:'Luxe',emoji:'💎',color:'#e11d48',ids:[5,8,31]},
 {name:'Quartier Port',label:'Port',emoji:'⚓',color:'#0f766e',ids:[3,19,33]},
 {name:'Quartier Culture',label:'Culture',emoji:'🎭',color:'#c2410c',ids:[2,13,14]},
 {name:'Quartier Nature',label:'Nature',emoji:'🌿',color:'#15803d',ids:[10,16,30]},
 {name:'Quartier Business',label:'Business',emoji:'💼',color:'#0369a1',ids:[7,11,17]},
 {name:'Quartier Gourmet',label:'Gourmet',emoji:'🍷',color:'#7f1d1d',ids:[24,26,27]},
 {name:'Quartier Tourisme',label:'Tourisme',emoji:'📸',color:'#d97706',ids:[20,21,35]}
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
let pendingDebt=null,debtQueue=[],zonePressure={},roundNumber=1;
let devMode=false,devTimer=null;
let devStats={startedAt:0,rolls:0,turns:0,purchases:0,upgrades:0,rentPayments:0,rentPaid:0,buyouts:0,emergencySales:0,bankruptcies:0,events:0,globalEvents:0,bankVisits:0,jailVisits:0,debtCases:0,moneyInjected:0,moneyRemoved:0,scheduledCharges:0,propertyTaxes:0,wondersStarted:0,wonderWins:0};
function resetDevStats(){
 devStats={startedAt:performance.now(),rolls:0,turns:0,purchases:0,upgrades:0,rentPayments:0,rentPaid:0,buyouts:0,emergencySales:0,bankruptcies:0,events:0,globalEvents:0,bankVisits:0,jailVisits:0,debtCases:0,moneyInjected:0,moneyRemoved:0,scheduledCharges:0,propertyTaxes:0,wondersStarted:0,wonderWins:0};
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
  ['Événements',devStats.events],['Mondiaux',devStats.globalEvents],['Joueurs actifs',active],['Zones en crise',pressure],
  ['Charges différées',devStats.scheduledCharges],['Taxes foncières',devStats.propertyTaxes],['Merveilles lancées',devStats.wondersStarted],['Victoires Merveille',devStats.wonderWins],['Cash total',moneyFmt(totalCash)],['Argent injecté',moneyFmt(devStats.moneyInjected)]
 ];
 el.innerHTML=rows.map(([k,v])=>`<div class="dev-stat"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
}
const board=document.getElementById('board'), playerBox=document.getElementById('players'), logBox=document.getElementById('log'), status=document.getElementById('status');
const rollBtn=document.getElementById('rollBtn'),buyBtn=document.getElementById('buyBtn'),buildBtn=document.getElementById('buildBtn'),endBtn=document.getElementById('endBtn'),wonderBtn=document.getElementById('wonderBtn');


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
 const body=`<div class="wonder-choice">
   <div class="wonder-intro">
     <b>🏛️ Quartier complet !</b>
     <div class="wonder-line">${district.emoji} ${district.name}</div>
     <div style="margin-top:5px;font-size:12px">Vous contrôlez les 3 propriétés du quartier : ${list}.</div>
   </div>
   <div class="wonder-options">
     <div class="wonder-option">
       <h3>💎 Construction accélérée</h3>
       <p>Payez <b>${moneyFmt(400000)}</b>. La Merveille sera terminée après <b>5 de vos tours complets</b>.</p>
       <div class="big">5 tours</div>
       <button id="wonderFast" class="wonder-capitalist" ${p.money<400000?'disabled':''}>Payer 400 000 €</button>
       ${p.money<400000?`<div style="font-size:10px;color:#991b1b;margin-top:6px">Trésorerie insuffisante.</div>`:''}
     </div>
     <div class="wonder-option">
       <h3>☭ Construction collective</h3>
       <p>Aucun paiement initial. Pendant la construction, <b>tous les loyers de la partie baissent de 65 %</b>. Victoire après <b>8 de vos tours complets</b>.</p>
       <div class="big">8 tours · loyers -65 %</div>
       <button id="wonderCollective" class="wonder-communist">Lancer le projet</button>
     </div>
   </div>
 </div>`;
 modal('🏛️ Construire une Merveille',body);
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
 playSfx('build');refresh();
}
function advanceWonderForPlayer(playerIndex){
 const p=players[playerIndex];
 if(!p?.active||!p.wonderMode||p.wonderTurnsLeft<=0)return false;
 if(p.wonderSkipCountdown){p.wonderSkipCountdown=false;return false}
 p.wonderTurnsLeft--;
 addLog(`🏗️ Merveille de <b>${p.name}</b> : ${p.wonderTurnsLeft} tour(s) restant(s).`);
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
function houseVisual(level){
 return `<div class="houses clean-houses">${Array.from({length:level},()=>'<span class="mini-building"></span>').join('')}</div>`;
}
function buildingVisual(s){
 if(s.type==='beach'){
   return `<div class="case-visual beach-card-visual">
      <span class="beach-sun"></span><span class="beach-water"></span><span class="beach-sand"></span>
      <span class="beach-palm"><i></i></span>
      <span class="case-zone-label">${s.theme?.label||'Plage'}</span>
   </div>`;
 }
 const slug=themeSlug(s.theme?.label||'quartier');
 return `<div class="case-visual building-card-visual theme-${slug}">
    <div class="lot-shadow"></div>
    <div class="lot-pad"></div>
    <div class="skyline">
      <span class="tower tower-a"></span>
      <span class="tower tower-b"></span>
      <span class="tower tower-c"></span>
    </div>
    <span class="district-mark">${(s.theme?.label||'Q').slice(0,1)}</span>
    <span class="case-zone-label">${s.theme?.label||'Quartier'}</span>
  </div>`;
}
function drawBoard(){
  board.querySelectorAll('.space').forEach(e=>e.remove());
  spaces.forEach(s=>{
    const d=document.createElement('div');
    const p=boardPos(s.id);
    const posClass=((p.r===1&&p.c===1)||(p.r===1&&p.c===10)||(p.r===10&&p.c===10)||(p.r===10&&p.c===1))?' corner':(p.r===1?' side-top':p.c===10?' side-right':p.r===10?' side-bottom':' side-left');
    d.className='space '+s.type+posClass+(s.owner!==null?' owned':'')+(zonePressureInfo(s).level?' market-stress':'');
    d.dataset.spaceId=s.id;
    d.style.gridRow=p.r;
    d.style.gridColumn=p.c;
    d.style.setProperty('--theme-color', s.theme?.color || '#64748b');
    if(s.owner!==null)d.style.setProperty('--owner-color',colors[s.owner]);

    const ownerName=s.owner!==null?(players[s.owner]?.name||'Joueur'):'';
    const mp=zonePressureInfo(s);
    const district=s.district?wonderDistricts.find(d=>d.name===s.district):null;
    const districtState=(district&&s.owner!==null)?districtProgress(s.owner,district):null;
    const tokensHtml=players.map((pl,idx)=>pl.active&&pl.pos===s.id?`<span class="token" title="${pl.name}" style="background:${colors[idx]}"></span>`:'').join('');

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
      const houses=s.type==='property'&&s.level>0?houseVisual(s.level):'<div class="houses clean-houses"></div>';

      d.innerHTML=`<div class="tile-face property-layout">
        <div class="case-pawn-slot">${tokensHtml}</div>
        ${buildingVisual(s)}
        ${ownerBand}
        <div class="case-economy">
          <div class="case-economy-label">${economyTitle}</div>
          <div class="case-economy-value">${economyValue}</div>
          <div class="case-economy-sub">${valueLine}</div>
          ${stressBadge}
          ${houses}
        </div>
        <div class="case-city"><span>${s.name}</span>${districtReady}</div>
      </div>`;
      d.dataset.clickable='true';
      d.addEventListener('click',()=>openPropertyModal(s.id));
      board.appendChild(d);
      return;
    }

    const icon={start:'🚀',event:'⚡',global:'🌍',bank:'🏦',jail:'🚔'}[s.type]||'';
    const districtBadge=`<div class="theme"><span class="theme-emoji">${s.theme?.emoji||''}</span><span>${s.theme?.label||'Case'}</span></div>`;
    let mainInfo='';
    if(s.type==='start')mainInfo=`<div class="compact-main compact-buy">+ ${shortMoneyFmt(30000)}</div>`;
    else if(s.type==='bank')mainInfo=`<div class="compact-main compact-buy">+ ${shortMoneyFmt(25000)}</div>`;
    else if(s.type==='jail')mainInfo=`<div class="compact-main compact-buy">Amende ${shortMoneyFmt(20000)}</div>`;
    else if(s.type==='event')mainInfo=`<div class="compact-main compact-buy">Effet surprise</div>`;
    else if(s.type==='global')mainInfo=`<div class="compact-main compact-buy">Tous les joueurs</div>`;

    d.innerHTML=`<div class="tile-face">
      <div class="tile-top">
        <div class="name">${icon} ${s.name}</div>
        ${districtBadge}
      </div>
      <div class="tile-bottom">${mainInfo}</div>
      <div class="tokens">${tokensHtml}</div>
    </div>`;
    board.appendChild(d);
  });
}

function renderWonderSite(){
 const slot=document.getElementById('wonderSiteInner');
 if(!slot)return;
 const activeWonder=players.find(p=>p.active&&p.wonderMode&&p.wonderTurnsLeft>0);
 if(!activeWonder){
   slot.innerHTML=`<div class="wonder-placeholder">Aucune Merveille en chantier pour le moment.<br><small>Complétez un quartier de 3 propriétés pour lancer la construction.</small></div>`;
   document.getElementById('wonderSite').classList.remove('live');
   return;
 }
 document.getElementById('wonderSite').classList.add('live');
 const totalTurns=activeWonder.wonderMode==='communist'?8:5;
 const done=Math.max(0,totalTurns-activeWonder.wonderTurnsLeft);
 const bars=Array.from({length:totalTurns},(_,i)=>`<span class="wonder-step ${i<done?'done':''} ${i===done?'current':''}"></span>`).join('');
 slot.innerHTML=`<div class="wonder-live-card ${activeWonder.wonderMode}">
   <div class="wonder-hero">🏛️</div>
   <div class="wonder-live-copy">
     <div class="wonder-live-title">${activeWonder.name} construit une Merveille</div>
     <div class="wonder-live-sub">${activeWonder.wonderLine} · ${activeWonder.wonderMode==='communist'?'collective':'accélérée'} · ${activeWonder.wonderTurnsLeft} tour(s) restant(s)</div>
     <div class="wonder-progress-bar">${bars}</div>
   </div>
 </div>`;
}
function renderPlayers(){
 playerBox.innerHTML=players.map((p,i)=>`<div class="player ${i===current&&p.active?'active':''}"><span class="dot" style="background:${colors[i]}"></span><div class="pmeta"><div class="pname">${p.name}${!p.active?' 💀':''}</div><div class="pmoney">${moneyFmt(p.money)} · ${p.props.length} biens · ${p.beaches} plage(s)</div>${p.wonderMode&&p.active?`<div class="wonder-progress">🏛️ ${p.wonderLine} · ${p.wonderTurnsLeft} tour(s) · ${p.wonderMode==='communist'?'collective':'accélérée'}</div>`:''}</div></div>`).join('');
 const activeWonder=players.find(p=>p.active&&p.wonderMode&&p.wonderTurnsLeft>0);
 document.getElementById('turnText').innerHTML=gameOver?'Partie terminée':`Tour de ${players[current]?.name||''}${communistWonderActive()?'<div class="global-rent-alert">☭ Construction collective : tous les loyers -65 %</div>':activeWonder?`<div class="wonder-banner">🏛️ ${activeWonder.name} construit une Merveille · ${activeWonder.wonderTurnsLeft} tour(s)</div>`:''}`;
 document.getElementById('centerTokens').innerHTML=players.filter(p=>p.active).map((p,i)=>`<span class="token" title="${p.name}" style="background:${colors[players.indexOf(p)]}"></span>`).join('');
 renderWonderSite();
}

function addLog(msg){const d=document.createElement('div'); d.innerHTML=msg; logBox.prepend(d)}
function modal(title,html){
 document.getElementById('modalTitle').textContent=title;
 document.getElementById('modalBody').innerHTML=html;
 const row=document.querySelector('#modal .row');
 row.innerHTML='<button id="modalOk" class="primary">Fermer</button>';
 document.getElementById('modalOk').onclick=closeModal;
 document.getElementById('modal').classList.add('open');
 playSfx('open');
}
function closeModal(){
 if(pendingRentDecision)return;
 document.getElementById('modal').classList.remove('open');
 playSfx('close');
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
 modal(title,body);
 const btn=document.getElementById('modalOk');
 btn.textContent='Continuer';
 if(afterClose)btn.onclick=()=>{document.getElementById('modal').classList.remove('open');playSfx('close');afterClose();};
 playSfx(tone==='positive'?'money':tone==='negative'?'bad':'open');
}

function openPropertyModal(spaceId){
 const s=spaces[spaceId];
 if(!s||!['property','beach'].includes(s.type))return;
 const owner=s.owner!==null?players[s.owner]:null;
 const canUpgrade=s.type==='property'&&s.owner===current&&s.level<3&&!gameOver&&!animating&&players[current].active;
 const nextLevel=Math.min(3,s.level+1);
 const cost=upgradeCosts[nextLevel]||0;
 const rentNow=s.owner!==null?currentRent(s):s.baseRent;
 const rentNext=s.level<3?roundRentStep(s.baseRent*(rentMultipliers[nextLevel]||1)):rentNow;
 const valueNow=s.owner!==null?parcelValue(s):purchasePrice(s);
 const ownerName=owner?owner.name:'Aucun propriétaire';
 const market=zonePressureInfo(s);
 const district=s.district?wonderDistricts.find(d=>d.name===s.district):null;
 const dp=district?districtProgress(current,district):null;
 const dots=[1,2,3].map(n=>`<span class="level-dot ${s.level>=n?'on':''}"></span>`).join('');
 const body=`
  <div class="property-card">
   <div class="hero">
    <div class="hero-icon">${s.type==='beach'?'🏖️':'🏙️'}</div>
    <div><div class="hero-title">${s.name}</div><div class="hero-sub">${s.theme?.emoji||''} ${s.theme?.label||''} · Propriétaire : ${ownerName}</div></div>
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
 modal(`🏢 ${s.name}`,body);
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
 const cost=upgradeCosts[s.level+1];
 if(p.money<cost){status.textContent='Fonds insuffisants pour cette amélioration.';return}
 p.money-=cost;
 s.level++;
 addLog(`🏠 <b>${p.name}</b> améliore <b>${s.name}</b> au niveau ${s.level} pour ${moneyFmt(cost)}. Valeur : ${moneyFmt(parcelValue(s))}, loyer : ${moneyFmt(currentRent(s))}.`);
 status.textContent=`${s.name} passe au niveau ${s.level} · loyer ${moneyFmt(currentRent(s))}.`;
 closeModal();
 refresh();
 animateBuild(s.id);
 playSfx('build');
}
document.getElementById('modalOk').onclick=closeModal;
function refresh(){drawBoard();renderPlayers();updateActions();refreshDevStats();renderWonderSite();}
function updateActions(){if(gameOver||animating||pendingDebt){[rollBtn,buyBtn,buildBtn,endBtn,wonderBtn].forEach(b=>b.disabled=true);return} const p=players[current],s=spaces[p.pos]; rollBtn.disabled=rolled; buyBtn.disabled=!rolled||!['property','beach'].includes(s.type)||s.owner!==null||p.money<purchasePrice(s); buildBtn.disabled=!rolled||s.type!=='property'||s.owner!==current||s.level>=3||p.money<upgradeCosts[s.level+1]; endBtn.disabled=!rolled; wonderBtn.disabled=!canLaunchWonder(current)||pendingRentDecision;}
function passStart(p,steps){if(p.pos+steps>=36){p.money+=30000;stat('moneyInjected',30000);addLog(`💰 <b>${p.name}</b> passe par DÉPART : +${moneyFmt(30000)}`)}}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function animateDice(finalRoll){
 const dice=document.getElementById('dice');
 dice.classList.add('rolling');
 const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const duration=reduced?180:760, start=performance.now();
 while(performance.now()-start<duration){
   dice.textContent=diceFaces[1+Math.floor(Math.random()*6)];
   playSfx('dice');
   await sleep(reduced?90:75);
 }
 dice.textContent=diceFaces[finalRoll];
 dice.classList.remove('rolling');
 if(!reduced) await sleep(180);
}
async function animateTokenStep(playerIndex,from,to){
 const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const fromEl=board.querySelector(`.space[data-space-id="${from}"]`);
 const toEl=board.querySelector(`.space[data-space-id="${to}"]`);
 if(!fromEl||!toEl||reduced){players[playerIndex].pos=to;drawBoard();await sleep(reduced?30:0);return}
 const dot=document.createElement('div'); dot.className='moving-token'; dot.style.setProperty('--token-color', colors[playerIndex]);
 const x1=fromEl.offsetLeft+fromEl.offsetWidth/2-15, y1=fromEl.offsetTop+fromEl.offsetHeight/2-15;
 const x2=toEl.offsetLeft+toEl.offsetWidth/2-15, y2=toEl.offsetTop+toEl.offsetHeight/2-15;
 dot.style.left=x1+'px';dot.style.top=y1+'px';board.appendChild(dot);
 const anim=dot.animate([
   {transform:'translate(0,0) scale(1)'},
   {transform:`translate(${x2-x1}px,${y2-y1}px) scale(1.26)`}
 ],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'});
 try{await anim.finished}catch(e){}
 dot.remove(); players[playerIndex].pos=to; drawBoard(); playSfx('step'); await sleep(45);
}
async function movePlayer(steps){
 const p=players[current],idx=current,initial=p.pos;
 passStart(p,steps);
 for(let n=0;n<steps;n++){
   const from=p.pos,to=(from+1)%36;
   await animateTokenStep(idx,from,to);
 }
 addLog(`🎲 <b>${p.name}</b> avance de ${steps} case(s) de <b>${spaces[initial].name}</b> vers <b>${spaces[p.pos].name}</b>.`);
 resolveSpace();
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
 const amount=25000;
 p.money+=amount;stat('bankVisits');stat('moneyInjected',amount);
 addLog(`🏦 La banque verse ${moneyFmt(amount)} à <b>${p.name}</b>.`);
 status.textContent='Prime bancaire reçue.';
 showEventResult({title:'🏦 Banque',icon:'🏦',description:'La banque vous accorde une prime exceptionnelle.',effect:`+ ${moneyFmt(amount)}`,tone:'positive'});
}
 else if(s.type==='jail'){
 const fine=20000;stat('jailVisits');stat('moneyRemoved',fine);
 const canPay=p.money>=fine;
 if(canPay){
   p.money-=fine;
   addLog(`🚔 <b>${p.name}</b> paie une amende de ${moneyFmt(fine)}.`);
   status.textContent='Amende de prison.';
   showEventResult({title:'🚔 Prison',icon:'🚔',description:'Vous devez régler une amende avant de continuer.',effect:`- ${moneyFmt(fine)}`,tone:'negative'});
 }else{
   const cash=p.money;
   p.money=0;
   const shortfall=fine-cash;
   addLog(`🚔 <b>${p.name}</b> doit ${moneyFmt(fine)} mais ne dispose que de ${moneyFmt(cash)}.`);
   showEventResult({
     title:'🚔 Prison',icon:'🚔',
     description:`L'amende est de ${moneyFmt(fine)}. Votre trésorerie ne suffit pas : une liquidation d'urgence va être nécessaire.`,
     effect:`Il manque ${moneyFmt(shortfall)}`,tone:'negative',
     afterClose:()=>queueDebt(current,shortfall,null,'Amende de prison')
   });
 }
}
 else if(s.type==='event'){eventCard(p)} else if(s.type==='global'){globalEvent();}
 checkWin();refresh();}

function buyoutPrice(s){return parcelValue(s)}
function showRentChoice(spaceId){
 const s=spaces[spaceId],visitor=players[current],owner=players[s.owner];
 const rent=currentRent(s),buy=buyoutPrice(s);
 pendingRentDecision=true;
 status.textContent=`${s.name} appartient à ${owner.name} : payer ou racheter ?`;
 const body=`
  <div class="rent-choice">
   <div class="players">
    <div class="person"><b>🎲 ${visitor.name}</b><small>${moneyFmt(visitor.money)} disponibles</small></div>
    <div class="arrow">➡️</div>
    <div class="person"><b>🏠 ${owner.name}</b><small>Propriétaire de ${s.name}</small></div>
   </div>
   <div class="summary">Loyer demandé<strong>${moneyFmt(rent)}</strong></div>
   <div class="options">
    <div class="option"><b>💸 Payer le loyer</b><small>${moneyFmt(rent)} seront versés à ${owner.name}.</small></div>
    <div class="option"><b>🤝 Racheter la parcelle</b><small>Prix : ${moneyFmt(buy)}. Tu récupères aussi le niveau ${s.level}.</small></div>
   </div>
  </div>`;
 modal(`💰 ${s.name} — que veux-tu faire ?`,body);
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
 }else{
   status.textContent=`Fonds insuffisants : liquidation nécessaire pour ${s.name}.`;
 }
 refresh();
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
 if(pendingDebt||!debtQueue.length)return;
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

 modal('🚨 Liquidation d’urgence',body);
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
 const callback=d?.onResolved;
 pendingDebt=null;
 document.getElementById('modal').classList.remove('open');
 playSfx('bad');
 refresh();checkWin();
 if(callback)callback(false);
 processNextDebt();
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
 modal('⚡ Travaux imprévus',body);
 const row=document.querySelector('#modal .row');
 row.innerHTML='';
 const spread=document.createElement('button');
 spread.className='secondary';
 spread.textContent='📆 Échelonner 4 × 5 000 €';
 spread.onclick=()=>{
   scheduleWorks(p);
   document.getElementById('modal').classList.remove('open');
   playSfx('close');refresh();
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
 modal('📅 Charge différée',body);
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
 modal('⚡ Taxe foncière',body);
 const btn=document.getElementById('modalOk');
 btn.textContent='Régler la taxe';
 btn.onclick=()=>{
   document.getElementById('modal').classList.remove('open');
   playSfx('close');
   chargePlayer(idx,tax,'Taxe foncière');
 };
 playSfx('bad');
}

function eventCard(p){const cards=[
 {t:'Contrat surprise',icon:'💼',desc:'Votre entreprise décroche un contrat inattendu.',kind:'cash',amount:40000,d:'+40 000 €',tone:'positive'},
 {t:'Contrôle fiscal',icon:'🧾',desc:'Le fisc prélève 30 000 € immédiatement. Des frais de dossier de 5 000 € tomberont après vos 2 prochains lancers.',kind:'fiscal',tone:'negative'},
 {t:'Investisseur providentiel',icon:'💰',desc:'Un investisseur décide de soutenir votre développement.',kind:'cash',amount:25000,d:'+25 000 €',tone:'positive'},
 {t:'Travaux imprévus',icon:'🚧',desc:'Une facture de 20 000 € peut être payée maintenant ou répartie sur les 4 prochains lancers.',kind:'works',tone:'negative'},
 {t:'Taxe foncière',icon:'🏠',desc:'Une taxe exceptionnelle de 35 % est calculée sur votre patrimoine total.',kind:'propertyTax',tone:'negative'},
 {t:'Voyage d’affaires',icon:'✈️',desc:'Une opportunité vous fait avancer plus vite.',kind:'move',move:3,d:'Avance de 3 cases',tone:'neutral'}
 ];
 const c=cards[Math.floor(Math.random()*cards.length)],idx=players.indexOf(p);stat('events');
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
   modal('⚡ Contrôle fiscal',body);
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

function simOneGame(){
 const P=4,ps=Array.from({length:P},()=>({money:200000,pos:0,active:true,props:[],beaches:0,fiscal:0,works:0,wonder:null,wonderLeft:0,wonderSkip:false}));
 const ss=spaces.map(s=>({type:s.type,price:s.price,baseRent:s.baseRent,owner:null,level:0}));
 const simDistricts=[[1,23,29],[5,8,31],[3,19,33],[2,13,14],[10,16,30],[7,11,17],[24,26,27],[20,21,35]];
 let actions=0,purchases=0,rentsPaid=0,buyouts=0,liquidations=0,bankruptcies=0,upgrades=0,propertyTaxes=0,scheduledCharges=0,wondersStarted=0,wonderWins=0;
 const collective=()=>ps.some(p=>p.active&&p.wonder==='communist'&&p.wonderLeft>0);
 const simRent=s=>Math.round(s.baseRent*(rentMultipliers[s.level]||1)*(collective()?.35:1));
 const simValue=s=>{let v=s.price;for(let l=1;l<=s.level;l++)v+=upgradeCosts[l];return v};
 const patrimony=p=>p.money+p.props.reduce((sum,id)=>sum+simValue(ss[id]),0);
 const fullDistrict=pi=>simDistricts.some(ids=>ids.every(id=>ss[id].owner===pi));
 function liquidate(pi,need,creditor=null){
   const p=ps[pi];let sale=0;
   while(need>0&&p.props.length){
     let bestIndex=0,bestValue=-1;
     p.props.forEach((sid,idx)=>{const v=simValue(ss[sid]);if(v>bestValue){bestValue=v;bestIndex=idx}});
     const sid=p.props.splice(bestIndex,1)[0],s=ss[sid];
     const proceeds=Math.round(simValue(s)*Math.max(.5,.9-sale*.1));sale++;liquidations++;
     if(s.type==='beach')p.beaches=Math.max(0,p.beaches-1);
     s.owner=null;s.level=0;
     const used=Math.min(proceeds,need);need-=used;
     if(creditor!==null&&ps[creditor]?.active)ps[creditor].money+=used;
     p.money+=proceeds-used;
   }
   if(need>0){p.active=false;p.money=0;p.wonder=null;p.wonderLeft=0;bankruptcies++;p.props.forEach(sid=>{ss[sid].owner=null;ss[sid].level=0});p.props=[];p.beaches=0;return false}
   return true;
 }
 function pay(pi,amt,creditor=null){
   const p=ps[pi],cash=Math.min(p.money,amt);p.money-=cash;
   if(creditor!==null&&ps[creditor]?.active)ps[creditor].money+=cash;
   const rem=amt-cash;if(rem>0)return liquidate(pi,rem,creditor);return true;
 }
 for(let step=0;step<1200;step++){
   const pi=step%P,p=ps[pi];if(!p.active)continue;actions++;

   if(p.wonder){
     if(p.wonderSkip)p.wonderSkip=false;
     else if(--p.wonderLeft<=0){wonderWins++;break}
   }
   if(!p.wonder&&fullDistrict(pi)){
     if(p.money>=400000){p.money-=400000;p.wonder='fast';p.wonderLeft=5;p.wonderSkip=true;wondersStarted++}
     else{p.wonder='communist';p.wonderLeft=8;p.wonderSkip=true;wondersStarted++}
   }

   if(p.fiscal>0){p.fiscal--;if(p.fiscal===0){scheduledCharges++;if(!pay(pi,5000,null))continue}}
   if(p.works>0){scheduledCharges++;p.works--;if(!pay(pi,5000,null))continue}
   const roll=1+Math.floor(Math.random()*6);
   if(p.pos+roll>=36)p.money+=30000;
   p.pos=(p.pos+roll)%36;let s=ss[p.pos];
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
       const cost=upgradeCosts[s.level+1];
       if(p.money>=cost+70000&&Math.random()<.34){p.money-=cost;s.level++;upgrades++}
     }
   }else if(s.type==='bank'){p.money+=25000}
   else if(s.type==='jail'){pay(pi,20000,null)}
   else if(s.type==='event'){
     const r=Math.floor(Math.random()*6);
     if(r===0)p.money+=40000;
     else if(r===1){p.fiscal=2;pay(pi,30000,null)}
     else if(r===2)p.money+=25000;
     else if(r===3){if(p.money>=65000&&Math.random()<.35)pay(pi,20000,null);else p.works=4}
     else if(r===4){propertyTaxes++;pay(pi,Math.round(patrimony(p)*.35),null)}
     else{if(p.pos+3>=36)p.money+=30000;p.pos=(p.pos+3)%36}
   }else if(s.type==='global'){
     const r=Math.floor(Math.random()*3);
     ps.forEach((q,qi)=>{if(!q.active)return;if(r===0)q.money+=20000;else if(r===1)pay(qi,15000,null);else q.money+=q.beaches*30000});
   }
   const alive=ps.filter(x=>x.active);
   if(alive.length<=1||ps.some(x=>x.active&&x.beaches===4))break;
 }
 return {actions,rounds:actions/P,purchases,rentsPaid,buyouts,liquidations,bankruptcies,upgrades,propertyTaxes,scheduledCharges,wondersStarted,wonderWins,finished:ps.filter(x=>x.active).length<=1||ps.some(x=>x.active&&x.beaches===4)||wonderWins>0};
}
function runDevSimulation(count){
 const result=document.getElementById('simResult');if(!result)return;
 result.textContent=`Simulation de ${count.toLocaleString('fr-FR')} parties…`;
 setTimeout(()=>{
   const arr=[];for(let i=0;i<count;i++)arr.push(simOneGame());
   const avg=k=>arr.reduce((a,x)=>a+x[k],0)/arr.length;
   const sorted=arr.map(x=>x.actions).sort((a,b)=>a-b);
   const med=sorted[Math.floor(sorted.length/2)];
   const finish=arr.filter(x=>x.finished).length/arr.length;
   const estimatedMinutes=med*12/60;
   result.innerHTML=`<b>${count.toLocaleString('fr-FR')} parties · 4 joueurs</b><br>
   Médiane : <b>${med} actions</b> (~${(med/4).toFixed(0)} tours de table)<br>
   Temps humain indicatif à 12 s/action : <b>~${estimatedMinutes.toFixed(0)} min</b><br>
   Parties terminées avant limite : <b>${Math.round(finish*100)} %</b><br>
   Moyennes : ${avg('purchases').toFixed(1)} achats · ${avg('upgrades').toFixed(1)} constructions · ${avg('rentsPaid').toFixed(1)} loyers · ${avg('buyouts').toFixed(1)} rachats · ${avg('liquidations').toFixed(1)} ventes d'urgence · ${avg('bankruptcies').toFixed(1)} faillites · ${avg('propertyTaxes').toFixed(1)} taxes foncières · ${avg('scheduledCharges').toFixed(1)} charges différées · ${avg('wondersStarted').toFixed(2)} Merveille(s) lancée(s) · ${avg('wonderWins').toFixed(2)} victoire(s) Merveille.<br>
   <span style="font-size:10px">⚠️ Bots simplifiés : utile pour comparer l'équilibrage, pas pour prédire exactement le comportement humain.</span>`;
 },20);
}

function declareWinner(winner,reason='remporte Business Fast'){
 if(gameOver||!winner)return;
 gameOver=true;
 modal('🏆 Victoire !',`<div class="winner">${winner.name}</div><p>${reason} et remporte Business Fast !</p>`);
 addLog(`🏆 <b>${winner.name}</b> ${reason} et gagne la partie !`);
 refresh();
}
function checkWin(){if(gameOver)return; const active=players.filter(p=>p.active); let winner=null,reason=''; if((winMode==='both'||winMode==='bankrupt')&&active.length===1){winner=active[0];reason='reste le dernier joueur solvable'} if(!winner&&(winMode==='both'||winMode==='beaches')){winner=players.find(p=>p.active&&p.beaches===4);if(winner)reason='contrôle les 4 plages'} if(winner)declareWinner(winner,reason);}
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
 rolled=true;animating=true;stat('rolls');lastRoll=1+Math.floor(Math.random()*6);
 status.textContent='Les dés roulent...';updateActions();await animateDice(lastRoll);
 status.textContent=`${players[current].name} avance de ${lastRoll} case(s)...`;
 await movePlayer(lastRoll);animating=false;refresh();
}
rollBtn.onclick=()=>{if(rolled||gameOver||animating||pendingRentDecision||pendingDebt)return;processScheduledCharges(current,()=>executeRoll())};
buyBtn.onclick=()=>{const p=players[current],s=spaces[p.pos],price=purchasePrice(s);if(s.owner!==null||p.money<price)return;p.money-=price;s.owner=current;p.props.push(s.id);if(s.type==='beach')p.beaches++;stat('purchases');addLog(`🏙️ <b>${p.name}</b> achète <b>${s.name}</b> pour ${moneyFmt(price)}. Loyer de départ : ${moneyFmt(currentRent(s))}.`);status.textContent=`${s.name} acheté · loyer ${moneyFmt(currentRent(s))}.`;refresh();animatePurchase(s.id,current);checkWin();};
buildBtn.onclick=()=>{const s=spaces[players[current].pos];upgradeProperty(s.id);};
wonderBtn.onclick=openWonderModal;
endBtn.onclick=()=>{if(!rolled||gameOver||pendingRentDecision||pendingDebt)return;playSfx('turn');rolled=false;stat('turns');
 const previous=current;
 if(advanceWonderForPlayer(previous))return;
 do{current=(current+1)%players.length}while(!players[current].active);
 if(current<=previous){roundNumber++;recoverZonePressure();}
 document.getElementById('dice').textContent='🎲';status.textContent='Lance les dés.';addLog(`➡️ Tour de <b>${players[current].name}</b> · tour de table ${roundNumber}.`);refresh()};
function startGame(){pendingRentDecision=false;pendingDebt=null;debtQueue=[];zonePressure={};roundNumber=1;resetDevStats();ensureAudio();playSfx('start');startAmbient();const n=+document.getElementById('playerCount').value;winMode=document.getElementById('winMode').value;players=[];for(let i=0;i<n;i++){players.push({name:(document.getElementById('p'+(i+1)).value||`Joueur ${i+1}`).trim(),money:200000,pos:0,props:[],beaches:0,active:true,fiscalRollsLeft:0,worksInstallmentsLeft:0,wonderMode:null,wonderTurnsLeft:0,wonderLine:null,wonderSkipCountdown:false})}spaces.forEach(s=>{s.owner=null;s.level=0;s.rent=rents[s.id];s.baseRent=rents[s.id]});current=0;rolled=false;gameOver=false;logBox.innerHTML='';document.getElementById('startScreen').classList.remove('active');document.getElementById('gameScreen').classList.add('active');addLog(`🚀 Partie lancée avec ${n} joueurs. Chacun commence avec ${moneyFmt(200000)}.`);refresh()}
document.getElementById('startBtn').onclick=startGame;
document.getElementById('restartBtn').onclick=()=>{if(confirm('Recommencer la partie ?')){playSfx('close');document.getElementById('gameScreen').classList.remove('active');document.getElementById('startScreen').classList.add('active')}};


const devPanel=document.getElementById('devPanel');
document.getElementById('devToggle').onclick=()=>{
 devMode=!devMode;devPanel.style.display=devMode?'block':'none';
 document.getElementById('devToggle').textContent=devMode?'🧪 Fermer mode développeur':'🧪 Mode développeur';
 if(devMode){refreshDevStats();if(!devTimer)devTimer=setInterval(refreshDevStats,1000)}
 else if(devTimer){clearInterval(devTimer);devTimer=null}
};
document.getElementById('devCash').onclick=()=>{
 if(!players[current]||gameOver)return;players[current].money+=50000;stat('moneyInjected',50000);
 addLog(`🧪 DEV : +${moneyFmt(30000)} à <b>${players[current].name}</b>.`);refresh();
};
document.getElementById('devDebt').onclick=()=>{
 if(!players[current]||gameOver||pendingDebt)return;
 const p=players[current],amount=250000,cash=Math.min(p.money,amount);p.money-=cash;const missing=amount-cash;
 addLog(`🧪 DEV : dette test de ${moneyFmt(amount)} pour <b>${p.name}</b>.`);
 if(missing>0)queueDebt(current,missing,null,'Dette test développeur');else stat('moneyRemoved',amount);
 refresh();
};
document.getElementById('devEvent').onclick=()=>{if(players[current]&&!pendingDebt&&!pendingRentDecision&&!gameOver)eventCard(players[current])};
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

const settingsModal=document.getElementById('settingsModal');
document.getElementById('settingsBtn').onclick=()=>{ensureAudio();syncAudioUI();settingsModal.classList.add('open');settingsModal.setAttribute('aria-hidden','false');playSfx('open')};
document.getElementById('settingsClose').onclick=()=>{settingsModal.classList.remove('open');settingsModal.setAttribute('aria-hidden','true');playSfx('close')};
document.getElementById('musicToggle').onclick=()=>{audioSettings.music=!audioSettings.music;applyAudioSettings();playSfx('click')};
document.getElementById('sfxToggle').onclick=()=>{audioSettings.sfx=!audioSettings.sfx;applyAudioSettings();if(audioSettings.sfx)playSfx('click')};
document.getElementById('musicVolume').oninput=e=>{audioSettings.musicVolume=+e.target.value/100;applyAudioSettings()};
document.getElementById('sfxVolume').oninput=e=>{audioSettings.sfxVolume=+e.target.value/100;applyAudioSettings();playSfx('click')};
settingsModal.addEventListener('click',e=>{if(e.target===settingsModal){settingsModal.classList.remove('open');settingsModal.setAttribute('aria-hidden','true');playSfx('close')}});
syncAudioUI();
