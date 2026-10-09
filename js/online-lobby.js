/* Business Fast — V0.57. Salons en temps réel uniquement; moteur de jeu non synchronisé. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const overlay=$('onlineLobbyModal'),status=$('onlineLobbyStatus');
if(!overlay)return;
const config=window.BUSINESS_FAST_FIREBASE_CONFIG||{};
let app=null,auth=null,db=null,uid=null,roomCode=null,roomRef=null,roomListener=null;
const setStatus=(message,error=false)=>{status.textContent=message;status.classList.toggle('error',error)};
const configured=()=>Boolean(config.apiKey&&config.projectId&&config.databaseURL&&config.appId);
async function connect(){
 if(!configured())throw Error('Firebase n’est pas encore configuré. Ajoute les informations de ton projet dans js/firebase-config.js.');
 if(!window.firebase)throw Error('Impossible de charger Firebase. Vérifie ta connexion.');
 if(!app){app=firebase.apps.length?firebase.app():firebase.initializeApp(config);auth=firebase.auth(app);db=firebase.database(app)}
 if(!auth.currentUser)await auth.signInAnonymously();
 uid=auth.currentUser.uid;
}
function open(){overlay.hidden=false;overlay.setAttribute('aria-hidden','false');setStatus(configured()?'Prêt à créer ou rejoindre un salon.':'Configuration Firebase requise pour activer les salons.')}
function close(){overlay.hidden=true;overlay.setAttribute('aria-hidden','true')}
function name(){return ($('onlineNickname').value||'').trim().slice(0,22)}
function code(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const bytes=new Uint8Array(6);crypto.getRandomValues(bytes);return Array.from(bytes,n=>alphabet[n%alphabet.length]).join('')}
function displayRoom(data){
 $('onlineSetupPanel').hidden=true;$('onlineRoomPanel').hidden=false;
 $('onlineRoomCodeDisplay').textContent=roomCode;
 const members=Object.values(data?.members||{});
 const list=$('onlineRoomMembers');list.replaceChildren();
 for(const member of members){const item=document.createElement('div');item.textContent=(member.name||'Joueur')+(member.uid===data.host?' 👑 Hôte':'');list.appendChild(item)}
 setStatus('Salon connecté · '+members.length+'/4 joueur(s).');
}
function listen(){
 roomRef=db.ref('rooms/'+roomCode);
 roomListener=roomRef.on('value',snapshot=>{
  if(!snapshot.exists()){setStatus('Le salon a été fermé.',true);leave(false);return}
  displayRoom(snapshot.val());
 },error=>setStatus('Connexion interrompue : '+error.message,true));
}
async function create(){
 try{
  if(!name())throw Error('Saisis ton pseudo.');
  setStatus('Connexion…');await connect();
  let created=false;
  for(let i=0;i<5&&!created;i++){
   const candidate=code(),ref=db.ref('rooms/'+candidate);
   const result=await ref.transaction(old=>old===null?{host:uid,createdAt:firebase.database.ServerValue.TIMESTAMP,status:'waiting',members:{[uid]:{uid,name:name()}}}:undefined,undefined,false);
   if(result.committed){roomCode=candidate;created=true}
  }
  if(!created)throw Error('Impossible de générer un salon. Réessaie.');
  await db.ref('rooms/'+roomCode+'/members/'+uid).onDisconnect().remove();
  listen();
 }catch(e){setStatus(e.message||'Erreur de création.',true)}
}
async function join(){
 try{
  if(!name())throw Error('Saisis ton pseudo.');
  const candidate=($('onlineRoomCode').value||'').toUpperCase().trim();
  if(!/^[A-Z2-9]{6}$/.test(candidate))throw Error('Le code doit contenir 6 caractères.');
  setStatus('Connexion…');await connect();
  const ref=db.ref('rooms/'+candidate);
  const result=await ref.transaction(old=>{
   if(!old||old.status!=='waiting')return;
   if(!old.members)old.members={};
   if(!old.members[uid]&&Object.keys(old.members).length>=4)return;
   old.members[uid]={uid,name:name()};return old;
  },undefined,false);
  if(!result.committed)throw Error('Salon introuvable, fermé ou complet.');
  roomCode=candidate;
  await db.ref('rooms/'+roomCode+'/members/'+uid).onDisconnect().remove();
  listen();
 }catch(e){setStatus(e.message||'Impossible de rejoindre le salon.',true)}
}
async function leave(show=true){
 const oldCode=roomCode;roomCode=null;
 if(roomRef&&roomListener){roomRef.off('value',roomListener);roomListener=null}
 roomRef=null;
 if(oldCode&&db&&uid){try{
  const ref=db.ref('rooms/'+oldCode);
  const snap=await ref.child('host').get();
  if(snap.val()===uid)await ref.remove();else await ref.child('members/'+uid).remove();
 }catch(e){setStatus('Erreur lors de la sortie du salon.',true)}}
 $('onlineRoomPanel').hidden=true;$('onlineSetupPanel').hidden=false;
 if(show)setStatus('Tu as quitté le salon.');
}
$('mainOnlineBtn')?.addEventListener('click',open);
$('onlineLobbyClose')?.addEventListener('click',close);
overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
$('onlineCreateBtn')?.addEventListener('click',create);
$('onlineJoinBtn')?.addEventListener('click',join);
$('onlineLeaveBtn')?.addEventListener('click',()=>leave());
$('onlineCopyBtn')?.addEventListener('click',()=>navigator.clipboard?.writeText(roomCode||'').then(()=>setStatus('Code copié !')).catch(()=>setStatus('Copie indisponible.',true)));
})();
