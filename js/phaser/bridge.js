/* Business Fast — Phaser France map renderer
   Gameplay remains in game.js. Phaser renders the new readable 2.5D France board. */
(function(){
 if(typeof window==="undefined")return;
 const state={enabled:false,game:null,scene:null,snapshot:null,revision:0};
 const isCompact=()=>window.innerWidth<760;
 const ISO_SKEW=.28, ISO_LIFT=16;
 const isoPoint=([x,y])=>{
  const compact=isCompact(),sx=compact?.96:1.02,sy=compact?.76:.82;
  return [640+(x-640)*sx,360+(y-360)*sy+(x-640)*(compact?.055:.04)];
 };
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
  constructor(){super("FranceBoard");this.lastRevision=-1;this.hoveredSpace=null;this.selectedSpace=null}
  preload(){
   // Real sprite pipeline. Missing files never block the board: coded assets remain the fallback.
   const sprites={
    ...(window.BusinessFastAssetPipeline?.sprites||{}),
    forest:"assets/phaser/forest.png",mountain:"assets/phaser/mountain.png",
    village:"assets/phaser/village.png",field:"assets/phaser/field.png",
    lake:"assets/phaser/lake.png",lighthouse:"assets/phaser/lighthouse.png",
    station:"assets/phaser/station.png",stadium:"assets/phaser/stadium.png"
   };
   this.spriteKeys=new Set();
   Object.entries(sprites).forEach(([key,url])=>{
    this.load.image(key,url);this.spriteKeys.add(key);
   });
   this.load.on("loaderror",file=>this.spriteKeys.delete(file.key));
  }
  hasSprite(key){return !!(this.textures&&this.textures.exists(key)&&this.spriteKeys&&this.spriteKeys.has(key))}
  sprite(key,x,y,scale=1){
   if(!this.hasSprite(key))return null;
   return this.add.image(x,y,key).setOrigin(.5,1).setScale(scale);
  }
  create(){
   state.scene=this;this.cameras.main.setBackgroundColor("#071525");
   this.world=this.add.container(0,0);
   this.cameras.main.setZoom(1);
   this.cameras.main.centerOn(W/2,H/2);
      this.drawBase();
   this.dynamic=this.add.container(0,0);
   this.fx=this.add.container(0,0);
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
   // richer illustrated terrain, while keeping the centre gameplay-safe
   g.fillStyle(0x3b6b3d,.48);g.fillEllipse(500,330,270,150);g.fillEllipse(710,420,310,170);
   g.fillStyle(0x7a9a4d,.28);g.fillEllipse(610,250,230,105);g.fillEllipse(455,455,180,90);
   g.fillStyle(0xd0ad63,.22);
   [[470,365,95,38],[720,315,110,42],[565,500,90,34]].forEach(([x,y,w,h])=>g.fillEllipse(x,y,w,h));
   // Sprite terrain layer: independent assets replace procedural scenery as they land.
   const scenery=[
    ["forest",455,270,.38],["forest",520,450,.34],["forest",735,305,.36],
    ["mountain",815,255,.44],["mountain",850,295,.36],
    ["village",500,390,.32],["village",700,455,.30],
    ["field",535,315,.34],["field",690,390,.34],["lake",705,350,.34]
   ];
   scenery.forEach(([key,x,y,s])=>{const a=this.sprite(key,x,y,s);if(a){a.setDepth(y-100);this.world.add(a)}});
   // readable regional scenery: sparse enough to preserve city labels
   const tree=(x,y,s=1)=>{g.fillStyle(0x102a20,.35);g.fillEllipse(x+6*s,y+8*s,20*s,8*s);g.fillStyle(0x173d2b,1);g.fillTriangle(x-10*s,y+7*s,x,y-18*s,x+10*s,y+7*s);g.fillStyle(0x245c3b,1);g.fillTriangle(x-8*s,y,x,y-24*s,x+8*s,y)};
   [[430,250,.8],[470,280,1],[560,450,.9],[720,300,.8],[760,430,1],[650,250,.7]].forEach(p=>tree(...p));
   // mountain ridge / Alps
   [[790,238,34],[825,250,27],[855,266,22]].forEach(([x,y,s])=>{g.fillStyle(0x324b43,.9);g.fillTriangle(x-s,y+s,x,y-s,x+s,y+s);g.fillStyle(0xdde8e5,.72);g.fillTriangle(x-10,y-5,x,y-s,x+10,y-5)});
   // subtle river ribbon
   g.lineStyle(5,0x38bdf8,.24);g.beginPath();g.moveTo(610,180);g.lineTo(625,245);g.lineTo(600,315);g.lineTo(635,390);g.lineTo(620,500);g.strokePath();
   // villages, fields and lakes make the centre feel like a miniature France
   const house=(x,y,s=1)=>{g.fillStyle(0xf3e7ce,1);g.fillRect(x-7*s,y-3*s,14*s,10*s);g.fillStyle(0xb4532a,1);g.fillTriangle(x-9*s,y-3*s,x,y-11*s,x+9*s,y-3*s);g.fillStyle(0x7c4a2b,1);g.fillRect(x-2*s,y+1*s,4*s,6*s)};
   [[470,390,.75],[505,410,.65],[690,270,.7],[730,455,.75],[545,255,.65]].forEach(p=>house(...p));
   g.fillStyle(0x4ab6d8,.32);g.fillEllipse(705,350,86,35);g.fillEllipse(510,305,58,24);
   g.lineStyle(2,0xd8c17b,.28);[[430,340,520,365],[670,470,770,445],[520,500,600,470]].forEach(([x1,y1,x2,y2])=>{g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.strokePath()});
   // raised route: dark lower edge creates a readable 2.5D slab
   g.lineStyle(32,0x050b12,.65);g.strokePoints(ROUTE.map(([x,y])=>new Phaser.Geom.Point(x+7,y+11)),true);
   // route
   g.lineStyle(28,0x111827,.72);g.strokePoints(ROUTE.map(p=>new Phaser.Geom.Point(...p)),true);
   g.lineStyle(18,0xd7dee7,1);g.strokePoints(ROUTE.map(p=>new Phaser.Geom.Point(...p)),true);
   g.lineStyle(3,0xffffff,.22);g.strokePoints(ROUTE.map(p=>new Phaser.Geom.Point(...p)),true);
   // Central landmarks make France feel inhabited without obscuring the route.
   const landmarks=[
    ["forest",505,300,.72],["forest",552,326,.58],["mountain",690,250,.70],
    ["mountain",736,276,.56],["village",612,390,.66],["field",704,420,.62],
    ["lake",535,445,.70],["station",782,365,.58],["stadium",662,505,.58]
   ];
   landmarks.forEach(([key,x,y,scale])=>{const a=this.sprite(key,x,y,scale);if(a){a.setDepth(y-120);this.world.add(a)}});
   // Fine internal roads visually connect the landscape.
   g.lineStyle(4,0xe8dcc1,.32);
   [[470,345,610,390],[610,390,775,365],[610,390,665,505],[535,445,610,390]].forEach(([x1,y1,x2,y2])=>{g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.strokePath()});
   this.add.text(118,596,"OCÉAN\nATLANTIQUE",{fontFamily:"Arial",fontSize:"18px",fontStyle:"bold",color:"#4cc9f0",align:"center"}).setAlpha(.62);
   this.add.text(910,626,"MÉDITERRANÉE",{fontFamily:"Arial",fontSize:"18px",fontStyle:"bold",color:"#4cc9f0"}).setAlpha(.62);
  }
  makeBuilding(x,y,color,level=0,variant=0){
   const c=this.add.container(x,y-22),g=this.add.graphics();c.add(g);
   const lvl=Math.max(0,Math.min(3,level||0)),kind=variant%4;
   const w=42+lvl*5,d=15+lvl*2,h=34+lvl*19;
   // long soft shadow anchors every city to the board
   g.fillStyle(0x020617,.34);g.fillEllipse(10,13,w+30,15);
   // podium appears from level 1
   if(lvl>0){g.fillStyle(0x172033,.92);g.fillPoints([
    new Phaser.Geom.Point(-w/2-5,2),new Phaser.Geom.Point(w/2+8,8),
    new Phaser.Geom.Point(w/2+17,16),new Phaser.Geom.Point(-w/2+3,10)
   ],true)}
   // main front / side
   g.fillStyle(color,.96);g.fillPoints([
    new Phaser.Geom.Point(-w/2,-h),new Phaser.Geom.Point(w/2,-h+d),
    new Phaser.Geom.Point(w/2,d),new Phaser.Geom.Point(-w/2,0)
   ],true);
   g.fillStyle(0x08111f,.42);g.fillPoints([
    new Phaser.Geom.Point(w/2,-h+d),new Phaser.Geom.Point(w/2+d,-h),
    new Phaser.Geom.Point(w/2+d,0),new Phaser.Geom.Point(w/2,d)
   ],true);
   // roof family: residential, office, tower, landmark
   if(kind===0){
    g.fillStyle(0xeaf2f5,1);g.fillPoints([
     new Phaser.Geom.Point(-w/2,-h),new Phaser.Geom.Point(-4,-h-d-10),
     new Phaser.Geom.Point(w/2+d,-h),new Phaser.Geom.Point(w/2,-h+d)
    ],true);
   }else if(kind===1){
    g.fillStyle(0xdbeafe,1);g.fillPoints([
     new Phaser.Geom.Point(-w/2,-h),new Phaser.Geom.Point(-w/2+d,-h-d),
     new Phaser.Geom.Point(w/2+d,-h),new Phaser.Geom.Point(w/2,-h+d)
    ],true);
    g.fillStyle(0x0f172a,.55);g.fillRect(-w/2+4,-h-6,w-5,6);
   }else if(kind===2){
    g.fillStyle(0xcbd5e1,1);g.fillTriangle(-w/2,-h,2,-h-d-13,w/2+d,-h);
   }else{
    g.fillStyle(0xf8fafc,1);g.fillPoints([
     new Phaser.Geom.Point(-w/2,-h),new Phaser.Geom.Point(0,-h-d-8),
     new Phaser.Geom.Point(w/2+d,-h),new Phaser.Geom.Point(w/2,-h+d)
    ],true);
    if(lvl>=2){g.fillStyle(0x38bdf8,.9);g.fillRect(-4,-h-d-17,8,12)}
   }
   // window grid scales with development level
   const rows=2+lvl*2;g.fillStyle(0xc9f1ff,.82);
   for(let r=0;r<rows;r++){
    const yy=-h+9+r*9;if(yy>-3)break;
    for(let xx=-w/2+6;xx<w/2-3;xx+=11)g.fillRect(xx,yy,5,4);
   }
   // visible progression markers
   if(lvl>=1){g.fillStyle(0x22c55e,.9);g.fillRect(-w/2-4,1,9,5)}
   if(lvl>=2){g.fillStyle(0xf8fafc,.95);g.fillRect(-2,-h-d-7,4,8)}
   if(lvl>=3){g.lineStyle(2,0x7dd3fc,.95);g.beginPath();g.moveTo(0,-h-d-8);g.lineTo(0,-h-d-27);g.strokePath();g.fillStyle(0xfbbf24,1);g.fillCircle(0,-h-d-29,3)}
   return c;
  }
  makeSpecialAsset(type,x,y,color){
   const compact=isCompact(),c=this.add.container(x,y-22),g=this.add.graphics();c.add(g);
   const s=compact?1.02:1.48;
   g.fillStyle(0x020617,.28);g.fillEllipse(8*s,18*s,54*s,14*s);
   if(type==="bank"){
    g.fillStyle(0xe2e8f0,1);g.fillPoints([[-26,0],[0,-18],[26,0]].map(p=>new Phaser.Geom.Point(p[0]*s,p[1]*s)),true);
    g.fillStyle(0x94a3b8,1);g.fillRect(-23*s,0,46*s,7*s);
    [-14,0,14].forEach(px=>{g.fillStyle(0xf8fafc,1);g.fillRect((px-4)*s,7*s,8*s,24*s)});
    g.fillStyle(0x64748b,1);g.fillRect(-31*s,31*s,62*s,5*s);g.fillStyle(0x38bdf8,1);g.fillRect(-27*s,36*s,54*s,6*s);
    c.add(this.add.text(0,11*s,"€",{fontFamily:"Arial",fontSize:(compact?13:17)+"px",fontStyle:"bold",color:"#0f172a"}).setOrigin(.5));
   }else if(type==="jail"){
    g.fillStyle(0x475569,1);g.fillRoundedRect(-25*s,-8*s,50*s,42*s,5*s);
    g.fillStyle(0x0f172a,1);[-14,0,14].forEach(px=>g.fillRect((px-3)*s,-2*s,6*s,27*s));
    g.fillStyle(0x1e293b,1);g.fillRect(-31*s,29*s,62*s,7*s);g.fillStyle(0xa78bfa,1);g.fillRect(-28*s,36*s,56*s,6*s);
    g.fillStyle(0xef4444,.95);g.fillCircle(-8*s,-13*s,5*s);g.fillStyle(0x3b82f6,.95);g.fillCircle(8*s,-13*s,5*s);
   }else if(type==="airport"){
    g.fillStyle(0x334155,1);g.fillRoundedRect(-29*s,8*s,58*s,25*s,5*s);
    g.fillStyle(0x0ea5e9,1);g.fillRect(-29*s,26*s,58*s,7*s);g.fillStyle(0xffffff,.8);[-18,0,18].forEach(px=>g.fillRect((px-5)*s,29*s,10*s,2*s));
    g.lineStyle(6*s,0xe2e8f0,1);g.beginPath();g.moveTo(-20*s,3*s);g.lineTo(22*s,-13*s);g.strokePath();
    g.fillStyle(0xe2e8f0,1);g.fillTriangle(22*s,-13*s,9*s,-15*s,17*s,-4*s);
   }else if(type==="beach"){
    g.fillStyle(0xf5d98b,1);g.fillEllipse(0,12*s,58*s,27*s);
    g.fillStyle(0x22d3ee,.9);g.fillEllipse(10*s,20*s,48*s,12*s);
    g.fillStyle(0xf43f5e,1);g.fillTriangle(-17*s,8*s,-5*s,-14*s,7*s,8*s);
    g.lineStyle(2*s,0x7c4a21,1);g.beginPath();g.moveTo(-5*s,-13*s);g.lineTo(-5*s,22*s);g.strokePath();
    g.lineStyle(3*s,0x7c4a21,1);g.beginPath();g.moveTo(19*s,18*s);g.lineTo(22*s,-4*s);g.strokePath();g.fillStyle(0x22c55e,1);g.fillTriangle(22*s,-5*s,9*s,-2*s,21*s,4*s);g.fillTriangle(22*s,-5*s,34*s,-1*s,23*s,4*s);
   }else if(type==="start"){
    g.fillStyle(0x22c55e,1);g.fillRoundedRect(-26*s,-3*s,52*s,35*s,7*s);
    c.add(this.add.text(0,14*s,"GO",{fontFamily:"Arial",fontSize:(compact?13:18)+"px",fontStyle:"bold",color:"#ffffff"}).setOrigin(.5));
   }else return null;
   c.setDepth(y+20);return c;
  }
  renderSnapshot(){
   if(!this.dynamic)return;
   this.dynamic.removeAll(true);
   if(this.fx)this.fx.removeAll(true);
   const s=state.snapshot;if(!s?.spaces)return;
   [...s.spaces].sort((a,b)=>ROUTE[a.id][1]-ROUTE[b.id][1]).forEach((space)=>{
    const i=space.id;
    const [x,y]=ROUTE[i%ROUTE.length],owner=space.owner;
    const routePrev=ROUTE[(i+35)%36],routeNext=ROUTE[(i+1)%36];
    const color=owner!==null&&owner!==undefined?hex(space.ownerColor):specialColor(space.type,space.themeColor);
    const compact=isCompact(),g=this.add.graphics();this.dynamic.add(g);
    // PC property card: chunky 2.5D tile inspired by a physical board-game deed space.
    const isProp=space.type==="property",isPriced=isProp||space.type==="beach",tw=isPriced?88:62,th=isPriced?52:38,depth=isPriced?12:8;
    const tileColor=isProp?(space.themeColor?hex(space.themeColor):color):(space.type==="beach"?0x08bde8:color);
    g.fillStyle(0x020617,.38);g.fillEllipse(x+7,y+depth+13,tw+20,18);
    // dark extruded side
    g.fillStyle(0x050b12,.98);g.fillRoundedRect(x-tw/2+6,y-th/2+depth,tw,th,10);
    g.fillStyle(0x0b1725,.72);g.fillRoundedRect(x-tw/2+3,y-th/2+5,tw,th+depth-2,10);
    // coloured top face
    g.fillStyle(isPriced?tileColor:0xf1f5f9,1);g.fillRoundedRect(x-tw/2,y-th/2,tw,th,10);
    if(isPriced){g.fillStyle(0x071525,.30);g.fillRoundedRect(x-tw/2+4,y+3,tw-8,th/2-7,6);}
    g.lineStyle(3,isPriced?0xffffff:tileColor,.34);g.strokeRoundedRect(x-tw/2,y-th/2,tw,th,9);
    g.lineStyle(2,0xffffff,.30);g.beginPath();g.moveTo(x-tw/2+9,y-th/2+5);g.lineTo(x+tw/2-9,y-th/2+5);g.strokePath();
    // Interactive hit area stays invisible until hover/selection.
    const hit=this.add.rectangle(x,y,tw+8,th+8,0xffffff,0).setInteractive({useHandCursor:true}).setDepth(y+2200);
    hit.on("pointerover",()=>{this.hoveredSpace=i;hit.setFillStyle(0xffffff,.10);hit.setStrokeStyle(2,0xffffff,.72)});
    hit.on("pointerout",()=>{this.hoveredSpace=null;if(this.selectedSpace!==i){hit.setFillStyle(0xffffff,0);hit.setStrokeStyle()}});
    hit.on("pointerdown",()=>{
      this.selectedSpace=this.selectedSpace===i?null:i;
      this.renderSnapshot();
      window.dispatchEvent(new CustomEvent("businessfast:space-selected",{detail:{spaceId:i,space}}));
    });
    if(this.selectedSpace===i){hit.setFillStyle(0xffffff,.13);hit.setStrokeStyle(3,0xfbbf24,.95)}
    this.dynamic.add(hit);
    if(space.type==="property"){
      const level=Math.max(0,Math.min(3,space.level||0));
      const scale=window.BusinessFastAssetPipeline?.cityScale?.[level]||.48;
      const b=this.sprite("city_"+level,x,y-10,scale)||this.makeBuilding(x,y-18,color,level,i);
      b.setDepth(y+50);this.dynamic.add(b);
      const price=Number(space.price||0);
      const title=this.add.text(x,y-4,space.name.toUpperCase(),{
       fontFamily:"Arial",fontSize:"12px",fontStyle:"bold",color:"#ffffff",stroke:"#06101b",strokeThickness:4,
       align:"center",wordWrap:{width:74}
      }).setOrigin(.5,.5).setDepth(y+2100);
      const priceTxt=price?price.toLocaleString("fr-FR")+" €":"";
      const ptxt=this.add.text(x,y+13,priceTxt,{
       fontFamily:"Arial",fontSize:"11px",fontStyle:"bold",color:"#ffffff",stroke:"#06101b",strokeThickness:3
      }).setOrigin(.5,.5).setDepth(y+2100);
      this.dynamic.add(title);this.dynamic.add(ptxt);
      if(owner!==null&&owner!==undefined){
       const og=this.add.graphics().setDepth(y+2090);
       og.fillStyle(hex(space.ownerColor),1);og.fillCircle(x-tw/2+9,y-th/2+9,5);
       this.dynamic.add(og);
      }
      if(level>0){
       const badge=this.add.text(x+tw/2-8,y-th/2+8,"N"+level,{fontFamily:"Arial",fontSize:"8px",fontStyle:"bold",color:"#ffffff",backgroundColor:"#071525",padding:{x:3,y:2}}).setOrigin(.5).setDepth(y+2110);
       this.dynamic.add(badge);
      }
    }
    if(space.type==="beach"){
      const price=Number(space.price||0);
      const bt=this.add.text(x,y-5,space.name.toUpperCase(),{fontFamily:"Arial",fontSize:"10px",fontStyle:"bold",color:"#ffffff",stroke:"#06435a",strokeThickness:3,align:"center",wordWrap:{width:76}}).setOrigin(.5).setDepth(y+2100);
      const bp=this.add.text(x,y+13,price?price.toLocaleString("fr-FR")+" €":"",{fontFamily:"Arial",fontSize:"10px",fontStyle:"bold",color:"#ffffff",stroke:"#06435a",strokeThickness:3}).setOrigin(.5).setDepth(y+2100);
      this.dynamic.add(bt);this.dynamic.add(bp);
    }
    const spriteKey={bank:"bank",jail:"jail",airport:"airport",beach:"beach"}[space.type];
    const special=(spriteKey&&this.sprite(spriteKey,x,y-12,window.BusinessFastAssetPipeline?.specialScale||.48))||this.makeSpecialAsset(space.type,x,y-20,color);
    if(special){special.setDepth(y+80);this.dynamic.add(special);}
    const mark=icon(space.type);
    if(mark)this.dynamic.add(this.add.text(x,y,mark,{fontFamily:"Arial",fontSize:compact?"13px":"17px",fontStyle:"bold",color:space.type==="property"?"#0f172a":"#0f172a"}).setOrigin(.5));
    // Every property keeps its city name visible; secondary data stays out of the map.
    const isCity=space.type==="property",important=["start","bank","jail","airport"].includes(space.type);
    if((!isCity)&&important){
      // Put labels toward the inside of the loop so edge labels are never clipped.
      const cx=640,cy=360,dx=cx-x,dy=cy-y,len=Math.max(1,Math.hypot(dx,dy));
      const inwardX=dx/len,inwardY=dy/len;
      const offset=isCity?(compact?27:34):(compact?39:48);
      let lx=x+inwardX*offset,ly=y+inwardY*offset;
      // Stagger neighbours to prevent long city names from colliding.
      const tangentX=-inwardY,tangentY=inwardX,stagger=((i%3)-1)*(compact?7:10);
      lx+=tangentX*stagger;ly+=tangentY*stagger;
      const maxW=isCity?(compact?92:148):(compact?105:158);
      const label=this.add.text(lx,ly,space.name.toUpperCase(),{
       fontFamily:"Arial",fontSize:isCity?(compact?"10px":"15px"):(compact?"10px":"14px"),
       fontStyle:"bold",color:"#ffffff",backgroundColor:"#071525",
       padding:{x:compact?5:7,y:compact?3:4},align:"center",
       wordWrap:{width:maxW,useAdvancedWrap:false}
      }).setOrigin(.5,.5).setDepth(y+2000);
      this.dynamic.add(label);
    }
   });
   (s.players||[]).filter(p=>p.active).forEach((p,slot)=>{
    const [x,y]=ROUTE[(p.pos||0)%ROUTE.length],color=hex(p.color,0xffffff);
    const pawn=this.add.container(x+(slot-1.5)*8,y-31);
    const g=this.add.graphics();pawn.add(g);
    g.fillStyle(0x020617,.28);g.fillEllipse(2,17,18,7);
    g.fillStyle(0xffffff,.32);g.fillCircle(-2,-2,8);
    g.fillStyle(color,1);g.fillCircle(0,0,7);g.fillRoundedRect(-7,6,14,16,6);
    g.fillStyle(0xffffff,.22);g.fillRoundedRect(-4,8,3,10,2);
    if(p.index===s.current){g.lineStyle(3,0xffffff,.9);g.strokeCircle(0,3,13);this.tweens.add({targets:pawn,y:pawn.y-5,duration:650,yoyo:true,repeat:-1,ease:"Sine.easeInOut"})}
    pawn.setDepth(y+1000);
    pawn.setScale(.96);
    this.tweens.add({targets:pawn,scaleX:1,scaleY:1,duration:240,ease:"Back.easeOut"});
    this.dynamic.add(pawn);
   });
  }
  update(){if(this.lastRevision!==state.revision){this.lastRevision=state.revision;this.renderSnapshot()}}
 }
 function boot(){
  if(state.game||typeof Phaser==="undefined"||!document.getElementById("phaserMount"))return;
  state.game=new Phaser.Game({type:Phaser.WEBGL,parent:"phaserMount",width:W,height:H,transparent:true,backgroundColor:"rgba(0,0,0,0)",
   render:{antialias:true,pixelArt:false,roundPixels:true,powerPreference:"high-performance",premultipliedAlpha:true},
   scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[FranceBoard]});
  state.enabled=true;document.documentElement.classList.add("phaser-ready","phaser-france");
 }
 function sync(snapshot){state.snapshot=snapshot||null;state.revision++;if(state.scene)state.scene.renderSnapshot()}
 function enable(){boot();state.enabled=true;document.documentElement.classList.add("phaser-ready","phaser-france")}
 function disable(){state.enabled=false;document.documentElement.classList.remove("phaser-ready","phaser-france")}
 window.BusinessFastPhaser={state,boot,sync,enable,disable};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();