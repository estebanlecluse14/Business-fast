/* Business Fast — Phaser France map renderer
   Gameplay remains in game.js. Phaser renders the new readable 2.5D France board. */
(function(){
 if(typeof window==="undefined")return;
 const state={enabled:false,game:null,scene:null,snapshot:null,revision:0};
 const isCompact=()=>window.innerWidth<760;
 const ISO_SKEW=.28, ISO_LIFT=16;
 const isoPoint=([x,y])=>[640+(x-640)*.96,360+(y-360)*.76+(x-640)*.055];
 const W=1280,H=720;
 const ROUTE_ANCHORS=[
  [380,92],[540,66],[708,70],[868,104],[998,178],[1074,288],[1084,414],[1024,532],[910,612],
  [770,650],[620,654],[474,630],[346,570],[254,474],[212,354],[234,234],[310,144]
 ];
 function buildEvenRoute(points,count){
  const seg=[],cum=[0];let total=0;
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length],d=Math.hypot(b[0]-a[0],b[1]-a[1]);
   seg.push(d);total+=d;cum.push(total);
  }
  return Array.from({length:count},(_,n)=>{
   const target=total*n/count;
   let i=0;while(i<seg.length-1&&cum[i+1]<target)i++;
   const a=points[i],b=points[(i+1)%points.length],t=(target-cum[i])/seg[i];
   return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  });
 }
 const ROUTE=buildEvenRoute(ROUTE_ANCHORS,36).map(isoPoint);
 const FRANCE_RAW=[
  [500,74],[566,88],[620,72],[684,98],[748,92],[820,132],[858,184],[922,216],[940,286],
  [918,340],[934,402],[890,450],[860,520],[792,548],[742,610],[674,620],[624,660],[558,628],
  [494,640],[446,594],[390,578],[358,520],[304,488],[300,420],[264,372],[286,310],[270,252],
  [322,210],[340,152],[406,136],[448,94]
 ];
 const FRANCE=FRANCE_RAW.map(isoPoint);
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
   this.cameras.main.setZoom(isCompact()?1.03:1.0);
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
   // extruded land edge: first visible depth, then top surface
   g.fillStyle(0x102d23,1);g.fillPoints(FRANCE.map(([x,y])=>new Phaser.Geom.Point(x,y+ISO_LIFT)),true);
   g.lineStyle(4,0x0a2019,.9);g.strokePoints(FRANCE.map(([x,y])=>new Phaser.Geom.Point(x,y+ISO_LIFT)),true);
   g.fillStyle(0x244d36,1);g.fillPoints(FRANCE.map(([x,y])=>new Phaser.Geom.Point(x,y)),true);
   g.lineStyle(5,0x78a879,.8);g.strokePoints(FRANCE.map(([x,y])=>new Phaser.Geom.Point(x,y)),true);
   // simple terrain patches
   g.fillStyle(0x315f3f,.75);g.fillEllipse(520,320,330,170);g.fillEllipse(690,390,300,170);
   g.fillStyle(0x465d45,.55);g.fillTriangle(770,185,808,122,846,190);g.fillTriangle(804,205,846,142,884,214);
   // raised route: dark lower edge creates a readable 2.5D slab
   g.lineStyle(32,0x050b12,.65);g.strokePoints(ROUTE.map(([x,y])=>new Phaser.Geom.Point(x+7,y+11)),true);
   // route
   g.lineStyle(28,0x111827,.72);g.strokePoints(ROUTE.map(p=>new Phaser.Geom.Point(...p)),true);
   g.lineStyle(18,0xd7dee7,1);g.strokePoints(ROUTE.map(p=>new Phaser.Geom.Point(...p)),true);
   g.lineStyle(3,0xffffff,.22);g.strokePoints(ROUTE.map(p=>new Phaser.Geom.Point(...p)),true);
   this.add.text(118,596,"OCÉAN\nATLANTIQUE",{fontFamily:"Arial",fontSize:"18px",fontStyle:"bold",color:"#4cc9f0",align:"center"}).setAlpha(.62);
   this.add.text(910,626,"MÉDITERRANÉE",{fontFamily:"Arial",fontSize:"18px",fontStyle:"bold",color:"#4cc9f0"}).setAlpha(.62);
   this.add.text(606,332,"BUSINESS\nFAST",{fontFamily:"Arial",fontSize:"36px",fontStyle:"bold",align:"center",color:"#ffffff",stroke:"#071525",strokeThickness:8}).setOrigin(.5).setAlpha(.16);
  }
  makeBuilding(x,y,color,level=0){
   const compact=isCompact(),c=this.add.container(x,y-20),g=this.add.graphics();c.add(g);
   const w=compact?18:27,d=compact?8:12,h=(compact?15:23)+(level||0)*(compact?8:12);
   // cast shadow
   g.fillStyle(0x020617,.30);g.fillPoints([
    new Phaser.Geom.Point(-w/2+8,8),new Phaser.Geom.Point(w/2+15,8),
    new Phaser.Geom.Point(w/2+25,16),new Phaser.Geom.Point(-w/2+14,16)
   ],true);
   // front face
   g.fillStyle(color,.94);g.fillPoints([
    new Phaser.Geom.Point(-w/2,-h),new Phaser.Geom.Point(w/2,-h+d),
    new Phaser.Geom.Point(w/2,d),new Phaser.Geom.Point(-w/2,0)
   ],true);
   // darker side face
   g.fillStyle(0x0b1724,.48);g.fillPoints([
    new Phaser.Geom.Point(w/2,-h+d),new Phaser.Geom.Point(w/2+d,-h),
    new Phaser.Geom.Point(w/2+d,0),new Phaser.Geom.Point(w/2,d)
   ],true);
   // bright roof
   g.fillStyle(0xe8f2f5,.95);g.fillPoints([
    new Phaser.Geom.Point(-w/2,-h),new Phaser.Geom.Point(-w/2+d,-h-d),
    new Phaser.Geom.Point(w/2+d,-h),new Phaser.Geom.Point(w/2,-h+d)
   ],true);
   // windows on the front plane
   g.fillStyle(0xbcecff,.72);
   for(let yy=-h+8;yy<-3;yy+=8){g.fillRect(-w/2+4,yy,4,3);if(w>20)g.fillRect(2,yy+2,4,3)}
   // rooftop accent grows with property level
   if(level>=2){g.fillStyle(0xf8fafc,.9);g.fillRect(-2,-h-d-5,4,6)}
   if(level>=3){g.lineStyle(2,0xbcecff,.8);g.beginPath();g.moveTo(w/2+d,-h);g.lineTo(w/2+d+7,-h-7);g.strokePath()}
   return c;
  }
  renderSnapshot(){
   if(!this.dynamic)return;
   this.dynamic.removeAll(true);
   const s=state.snapshot;if(!s?.spaces)return;
   [...s.spaces].sort((a,b)=>ROUTE[a.id][1]-ROUTE[b.id][1]).forEach((space)=>{
    const i=space.id;
    const [x,y]=ROUTE[i%ROUTE.length],owner=space.owner;
    const color=owner!==null&&owner!==undefined?hex(space.ownerColor):specialColor(space.type,space.themeColor);
    const compact=isCompact(),g=this.add.graphics();this.dynamic.add(g);
    const tw=compact?42:58,th=compact?25:32,depth=compact?5:8;
    // tile thickness + top plate
    g.fillStyle(0x07111c,.72);g.fillRoundedRect(x-tw/2+4,y-th/2+depth,tw,th,compact?7:9);
    g.fillStyle(owner!==null&&owner!==undefined?color:0xf8fafc,1);g.fillRoundedRect(x-tw/2,y-th/2,tw,th,compact?7:9);
    g.lineStyle(owner!==null&&owner!==undefined?4:3,color,1);g.strokeRoundedRect(x-tw/2,y-th/2,tw,th,compact?7:9);
    // top highlight / bottom shade reinforces elevation
    g.lineStyle(2,0xffffff,.28);g.beginPath();g.moveTo(x-tw/2+7,y-th/2+3);g.lineTo(x+tw/2-7,y-th/2+3);g.strokePath();
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
    pawn.setDepth(y+1000);
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