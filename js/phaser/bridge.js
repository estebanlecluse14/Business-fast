/* Business Fast — Phaser bootstrap
   Progressive migration layer. The HTML/CSS version remains authoritative for gameplay. */
(function(){
  if(typeof window==="undefined") return;

  const state={
    enabled:false,
    game:null,
    scene:null
  };

  function canBoot(){
    return typeof Phaser!=="undefined" && document.getElementById("phaserMount");
  }

  class BusinessFastPreviewScene extends Phaser.Scene{
    constructor(){super("BusinessFastPreview")}
    create(){
      this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");
      this.add.rectangle(0,0,10,10,0x000000,0).setOrigin(0);
      state.scene=this;
    }
  }

  function boot(){
    if(!canBoot() || state.game) return;
    const mount=document.getElementById("phaserMount");
    const config={
      type:Phaser.AUTO,
      parent:"phaserMount",
      width:1280,
      height:720,
      transparent:true,
      backgroundColor:"rgba(0,0,0,0)",
      render:{
        antialias:true,
        pixelArt:false,
        roundPixels:true,
        powerPreference:"high-performance"
      },
      scale:{
        mode:Phaser.Scale.FIT,
        autoCenter:Phaser.Scale.CENTER_BOTH
      },
      scene:[BusinessFastPreviewScene]
    };
    state.game=new Phaser.Game(config);
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

  window.BusinessFastPhaser={
    state,
    boot,
    enable,
    disable
  };

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }
})();