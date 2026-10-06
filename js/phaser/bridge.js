/* Business Fast — Phaser rendering bridge
   Phase 1: Phaser owns the animated board FX layer while legacy HTML remains the
   authoritative gameplay/UI layer. This bridge consumes a serializable snapshot
   published by game.js so the renderer can be replaced progressively. */
(function(){
  if(typeof window==="undefined") return;

  const state={enabled:false,game:null,scene:null,snapshot:null,revision:0};

  function canBoot(){
    return typeof Phaser!=="undefined" && !!document.getElementById("phaserMount");
  }

  function cssColor(value,fallback=0x64748b){
    if(typeof value!=="string") return fallback;
    const hex=value.trim().replace("#","");
    return /^[0-9a-f]{6}$/i.test(hex)?parseInt(hex,16):fallback;
  }

  class BusinessFastBoardScene extends Phaser.Scene{
    constructor(){super("BusinessFastBoard")}
    create(){
      state.scene=this;
      this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");
      this.fx=this.add.graphics();
      this.tokenFx=this.add.graphics();
      this.title=this.add.text(640,360,"BUSINESS CITY",{
        fontFamily:"Arial, sans-serif",fontSize:"44px",fontStyle:"bold",
        color:"#ffffff",stroke:"#06101b",strokeThickness:8
      }).setOrigin(.5).setAlpha(.07);
      this.tweens.add({targets:this.title,alpha:{from:.045,to:.10},duration:2400,yoyo:true,repeat:-1,ease:"Sine.easeInOut"});
      this.renderSnapshot();
    }
    renderSnapshot(){
      if(!this.fx||!this.tokenFx)return;
      const snap=state.snapshot;
      this.fx.clear(); this.tokenFx.clear();
      if(!snap||!snap.spaces)return;

      // Soft animated ownership lights. The HTML tiles remain readable above this
      // layer while Phaser starts owning the board atmosphere and movement FX.
      snap.spaces.forEach((s,i)=>{
        if(s.owner===null||s.owner===undefined)return;
        const a=(i/36)*Math.PI*2, radius=265;
        const x=640+Math.cos(a)*radius, y=360+Math.sin(a)*radius*.72;
        const color=cssColor(s.ownerColor,0x22c55e);
        this.fx.fillStyle(color,.10);
        this.fx.fillCircle(x,y,24+(s.level||0)*4);
      });

      (snap.players||[]).filter(p=>p.active).forEach((p,i)=>{
        const a=((p.pos||0)/36)*Math.PI*2, radius=285;
        const x=640+Math.cos(a)*radius, y=360+Math.sin(a)*radius*.72;
        const color=cssColor(p.color,0xffffff);
        this.tokenFx.lineStyle(i===snap.current?5:3,color,i===snap.current?.75:.32);
        this.tokenFx.strokeCircle(x,y,i===snap.current?18:13);
      });
    }
    update(){
      if(state.revision!==this.lastRevision){
        this.lastRevision=state.revision;
        this.renderSnapshot();
      }
    }
  }

  function boot(){
    if(!canBoot()||state.game)return;
    state.game=new Phaser.Game({
      type:Phaser.AUTO,parent:"phaserMount",width:1280,height:720,
      transparent:true,backgroundColor:"rgba(0,0,0,0)",
      render:{antialias:true,pixelArt:false,roundPixels:true,powerPreference:"high-performance"},
      scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
      scene:[BusinessFastBoardScene]
    });
    enable();
  }

  function sync(snapshot){
    state.snapshot=snapshot||null;
    state.revision++;
    if(state.scene)state.scene.renderSnapshot();
  }

  function enable(){
    boot();
    state.enabled=true;
    document.documentElement.classList.add("phaser-ready");
  }
  function disable(){
    state.enabled=false;
    document.documentElement.classList.remove("phaser-ready");
  }

  window.BusinessFastPhaser={state,boot,sync,enable,disable};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();