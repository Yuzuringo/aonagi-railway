(function(root){'use strict';
// Simulation uses tenth-second steps. Visible-frame delays become catch-up
// work rather than lost time; paused/hidden intervals never become game time.
class GameClock{
 constructor(){this.last=null;this.active=false;this.station=null;this.debt=0;}
 reset(now=null){this.last=now;this.active=false;this.debt=0;}
 advance(station,active,speed,now){if(this.station!==station){this.station=station;this.reset(now);}const elapsed=this.last===null?0:Math.max(0,(now-this.last)/1000);this.last=now;
 if(!active){this.active=false;return 0;}if(!this.active){this.active=true;return 0;}
 let remaining=elapsed;const virtualTime=station.time+this.debt;if(virtualTime<0){const preparation=Math.min(remaining,-virtualTime);this.debt+=preparation;remaining-=preparation;}this.debt+=remaining*(Number(speed)||1);
 const steps=Math.min(20,Math.floor((this.debt+1e-8)/.1));if(!steps)return 0;const advance=steps*.1;station.tick(advance);this.debt=Math.max(0,this.debt-advance);if(station.finished)this.debt=0;return advance;
 }
}
if(typeof module!=='undefined')module.exports=GameClock;else root.RailClock=GameClock;
})(typeof window!=='undefined'?window:globalThis);
