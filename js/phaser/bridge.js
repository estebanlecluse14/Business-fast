/* Business Fast — Phaser France map renderer
   Gameplay remains in game.js. Phaser renders the new readable 2.5D France board. */
(function(){
 if(typeof window==="undefined")return;
 const state={enabled:false,game:null,scene:null,snapshot:null,revision:0};
 const isCompact=()=>window.innerWidth<760;
 const W=1280,H=720;
 const ROUTE=[
  [380,92],[458,74],[540,66],[624,64],[708,70],[790,82],[868,104],[938,136],[998,178],
  [1044,230],[1074,288],[1088,350],[1084,414],[1062,476],[1024,532],[972,578],[910,612],
  [842,636],[770,650],[696,656],[620,654],[546,646],[474,630],[406,604],[346,570],[294,526],
  [254,474],[226,416],[212,354],[216,292],[234,234],[266,184],[310,144],[344,116],[362,104]
 ];
 const FRANCE=[
  [500,74],[566,88],[620,72],[684,98],[748,92],[820,132],[858,184],[922,216],[940,286],
  [918,340],[934,402],[890,450],[860,520],[792,548],[742,610],[674,620],[624,660],[558,628],
  [494,640],[446,594],[390,578],[358,520],[304,488],[300,420],[264,372],[286,310],[270,252],
  [322,210],[340,152],[406,136],[448,94]
 ];
 function hex(v,f=0x64748b){if(typeof v!=="string")return f;const h=v.replace("#","");return /^[0-9a-f]{6}$/i.test(h)?parseInt(h,16):f}
 function specialColor(type,theme){
  return {start:0x22c55e,event:0xf59e0b,global:0xef4444,bank:0x38bdf8,jail:0xa78bfa,airport:0x0ea5e9,beach:0x06b6d4}[type]||hex(theme,0x64748b);
 }
 function icon(type){return {start:"D",event:"?",global:"!",bank:"€",jail:"P",airport:"✈",beach:"≈"}[type]||""}
 class FranceBoard extends Phaser.Scene{
  constructor(){super("FranceBoard");this.lastRevision=-1}
  create(){
   state.scene=this;this.cameras.main.setBackgroundColor("#071525");
   this.world=this.add.container(0,0);
   this.drawBase();
   this.dynamic=this.add.container(0,0);
   this.renderSnapshot();
  }
  drawBase(){
   const g=this.add.graphics();this.world.add(g);
   g.fillStyle(0x08243a,1);g.fillRect(0,0,W,H);
   // restrained water lines
   g.lineStyle(1,0x1e6b8e,.16);
   for(let y=70;y<700;y+=42){g.beginPath();g.moveTo(70,y);g.lineTo(1210,y+12);g.strokePath()}
   // France shadow + land mass
   g.fillStyle(0x020617,.34);g.fillPoints(FRANCE.map(([x,y])=>new Phaser.Geom.Point(x+13,y+18)),true);
   g.fillStyle(0x244d36,1);g.fillPoints(FRANCE.map(([x,y])=>new Phaser.Geom.Point(x,y)),true);
   g.lineStyle(5,0x78a879,.8);g.strokePoints(FRANCE.map(([x,y])=>new Phaser.Geom.Point(x,y)),true);
   // simple terrain patches
   g.fillStyle(0x315f3f,.75);g.fillEllipse(520,300,330,230);g.fillEllipse(690,390,300,230);
   g.fillStyle(0x465d45,.55);g.fillTriangle(770,185,808,122,846,190);g.fillTriangle(804,205,846,142,884,214);
   // route
   g.lineStyle(28,0x111827,.72);g.strokePoints(ROUTE.map(p=>new Phaser.Geom.Point(...p)),true);
   g.lineStyle(18,0xd7dee7,1);g.strokePoints(ROUTE.map(p=>new Phaser.Geom.Point(...p)),true);
   g.lineStyle(3,0xffffff,.22);g.strokePoints(ROUTE.map(p=>new Phaser.Geom.Point(...p)),true);
   this.add.text(118,596,"OCÉAN\nATLANTIQUE",{fontFamily:"Arial",fontSize:"18px",fontStyle:"bold",color:"#4cc9f0",align:"center"}).setAlpha(.62);
   this.add.text(910,626,"MÉDITERRANÉE",{fontFamily:"Arial",fontSize:"18px",fontStyle:"bold",color:"#4cc9f0"}).setAlpha(.62);
   this.add.text(606,332,"BUSINESS\nFAST",{fontFamily:"Arial",fontSize:"36px",fontStyle:"bold",align:"center",color:"#ffffff",stroke:"#071525",strokeThickness:8}).setOrigin(.5).setAlpha(.16);
  }
  makeBuilding(x,y,color,level=0){
   const c=this.add.container(x,y-25),g=this.add.graphics();c.add(g);
   const compact=isCompact(),floors=level+1,h=(compact?8:12)+floors*(compact?5:7);
   g.fillStyle(0x0b1220,.25);g.fillEllipse(0,compact?14:22,compact?24:36,compact?8:12);
   g.fillStyle(color,.92);g.fillRoundedRect(compact?-9:-13,-h,compact?18:26,h,4);
   g.fillStyle(0xffffff,.28);g.fillRect(compact?-6:-8,-h+5,compact?3:5,compact?3:5);g.fillRect(compact?2:3,-h+5,compact?3:5,compact?3:5);
   if(level>0){g.fillStyle(0xf8fafc,.88);g.fillTriangle(-10,-h,-1,-h-10,8,-h)}
   return c;
  }
  renderSnapshot(){
   if(!this.dynamic)return;
   this.dynamic.removeAll(true);
   const s=state.snapshot;if(!s?.spaces)return;
   s.spaces.forEach((space,i)=>{
    const [x,y]=ROUTE[i%ROUTE.length],owner=space.owner;
    const color=owner!==null&&owner!==undefined?hex(space.ownerColor):specialColor(space.type,space.themeColor);
    const compact=isCompact(),g=this.add.graphics();this.dynamic.add(g);
    g.fillStyle(0x020617,.34);const tw=compact?42:58,th=compact?28:36;
    g.fillRoundedRect(x-tw/2,y-th/2+5,tw,th,compact?7:9);
    g.fillStyle(owner!==null&&owner!==undefined?color:0xf8fafc,1);g.fillRoundedRect(x-tw/2,y-th/2,tw,th,compact?7:9);
    g.lineStyle(owner!==null&&owner!==undefined?4:3,color,1);g.strokeRoundedRect(x-tw/2,y-th/2,tw,th,compact?7:9);
    if(owner!==null&&owner!==undefined||space.type==="property")this.dynamic.add(this.makeBuilding(x,y,color,space.level||0));
    const mark=icon(space.type);
    if(mark)this.dynamic.add(this.add.text(x,y,mark,{fontFamily:"Arial",fontSize:compact?"13px":"17px",fontStyle:"bold",color:space.type==="property"?"#0f172a":"#0f172a"}).setOrigin(.5));
    // labels are deliberately sparse to keep the board readable
    const important=["start","bank","jail","airport"].includes(space.type);
    if((compact&&important)||(!compact&&(space.type!=="property"||i%4===1))){
      const label=this.add.text(x,y+25,space.name,{fontFamily:"Arial",fontSize:compact?"9px":"11px",fontStyle:"bold",color:"#f8fafc",backgroundColor:"#071525",padding:{x:5,y:3}}).setOrigin(.5,0);
      this.dynamic.add(label);
    }
   });
   (s.players||[]).filter(p=>p.active).forEach((p,slot)=>{
    const [x,y]=ROUTE[(p.pos||0)%ROUTE.length],color=hex(p.color,0xffffff);
    const pawn=this.add.container(x+(slot-1.5)*8,y-31);
    const g=this.add.graphics();pawn.add(g);
    g.fillStyle(0x020617,.28);g.fillEllipse(2,17,18,7);
    g.fillStyle(color,1);g.fillCircle(0,0,7);g.fillRoundedRect(-6,6,12,15,5);
    if(p.index===s.current){g.lineStyle(3,0xffffff,.9);g.strokeCircle(0,3,13);this.tweens.add({targets:pawn,y:pawn.y-5,duration:650,yoyo:true,repeat:-1,ease:"Sine.easeInOut"})}
    this.dynamic.add(pawn);
   });
  }
  update(){if(this.lastRevision!==state.revision){this.lastRevision=state.revision;this.renderSnapshot()}}
 }
 function boot(){
  if(state.game||typeof Phaser==="undefined"||!document.getElementById("phaserMount"))return;
  state.game=new Phaser.Game({type:Phaser.AUTO,parent:"phaserMount",width:W,height:H,backgroundColor:"#071525",
   render:{antialias:true,pixelArt:false,roundPixels:true,powerPreference:"high-performance"},
   scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[FranceBoard]});
  state.enabled=true;document.documentElement.classList.add("phaser-ready","phaser-france");
 }
 function sync(snapshot){state.snapshot=snapshot||null;state.revision++;if(state.scene)state.scene.renderSnapshot()}
 function enable(){boot();state.enabled=true;document.documentElement.classList.add("phaser-ready","phaser-france")}
 function disable(){state.enabled=false;document.documentElement.classList.remove("phaser-ready","phaser-france")}
 window.BusinessFastPhaser={state,boot,sync,enable,disable};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();