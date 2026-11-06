(function(root){'use strict';
const NOTES={W:[520],E:[390]};
class SoundBus{
 constructor(player){this.player=player;this.volume=.4;this.muted=false;this.paused=true;this.approaches={W:{id:null,ack:false,next:0},E:{id:null,ack:false,next:0}};}
 approach(side,id){const a=this.approaches[side];if(a.id===id)return;this.player.cancel(side);a.id=id;a.ack=false;a.next=0;}
 silence(side){const a=this.approaches[side];a.ack=true;this.player.cancel(side);}
 pause(value){if(this.paused===value)return;this.paused=value;if(value){this.player.cancel('W');this.player.cancel('E');this.player.cancel('effect');}else for(const a of Object.values(this.approaches))a.next=0;}
 mute(value){this.muted=value;this.player.volume(this.muted?0:this.volume);if(value){this.player.cancel('W');this.player.cancel('E');this.player.cancel('effect');}else for(const a of Object.values(this.approaches))a.next=0;}
 level(value){this.volume=Math.max(0,Math.min(1,Number(value)||0));this.player.volume(this.muted?0:this.volume);}
 tick(dt){if(this.paused||this.muted||this.volume===0)return;for(const[side,a]of Object.entries(this.approaches)){if(!a.id||a.ack)continue;if(side==='W'){if(a.next!==Infinity&&this.player.sustain(side,NOTES[side][0])!==false)a.next=Infinity;continue;}a.next-=dt;if(a.next<=0){this.player.chime(side,NOTES[side]);a.next=.5;}}}
 reset(){for(const side of ['W','E'])this.approach(side,null);this.player.cancel('effect');}
}
class Renderer{
 constructor(Context){this.Context=Context;this.ctx=null;this.master=null;this.groups=new Map();this.noiseBuffers=new Map();this.level=.4;}
 ready(){if(!this.Context)return false;if(!this.ctx){this.ctx=new this.Context();this.master=this.ctx.createGain();this.master.gain.value=this.level;this.master.connect(this.ctx.destination);}if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});return true;}
 volume(value){this.level=value;if(this.ctx)this.master.gain.setTargetAtTime(value,this.ctx.currentTime,.015);}
 remember(tag,node){if(!this.groups.has(tag))this.groups.set(tag,new Set());this.groups.get(tag).add(node);node.onended=()=>{this.groups.get(tag)?.delete(node);try{node.disconnect()}catch{}};}
 cancel(tag){for(const node of this.groups.get(tag)||[]){try{node.stop()}catch{}}this.groups.delete(tag);}
 tone(tag,hz,start,length,gain=.1,type='sine',pan=0){if(!this.ctx||this.ctx.state!=='running')return;const t=this.ctx.currentTime+start,osc=this.ctx.createOscillator(),env=this.ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(hz,t);env.gain.setValueAtTime(.0001,t);env.gain.exponentialRampToValueAtTime(gain,t+.008);env.gain.exponentialRampToValueAtTime(.0001,t+length);osc.connect(env);if(this.ctx.createStereoPanner){const p=this.ctx.createStereoPanner();p.pan.value=pan;env.connect(p);p.connect(this.master)}else env.connect(this.master);this.remember(tag,osc);osc.start(t);osc.stop(t+length+.02);}
 noise(tag,start,length,gain,frequency){if(!this.ctx||this.ctx.state!=='running')return;const t=this.ctx.currentTime+start,n=Math.max(1,Math.floor(this.ctx.sampleRate*length));let buffer=this.noiseBuffers.get(n);if(!buffer){buffer=this.ctx.createBuffer(1,n,this.ctx.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<n;i++)data[i]=(Math.random()*2-1);if(this.noiseBuffers.size>=8)this.noiseBuffers.delete(this.noiseBuffers.keys().next().value);this.noiseBuffers.set(n,buffer);}const src=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),env=this.ctx.createGain();src.buffer=buffer;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.8;env.gain.setValueAtTime(.0001,t);env.gain.linearRampToValueAtTime(gain,t+.006);env.gain.exponentialRampToValueAtTime(.0001,t+length);src.connect(filter);filter.connect(env);env.connect(this.master);this.remember(tag,src);src.start(t);src.stop(t+length+.02);}
 lever(){if(!this.ctx)return;this.noise('effect',0,.045,.27,1600);this.tone('effect',145,0,.075,.16,'triangle');this.noise('effect',.055,.04,.18,2800);this.tone('effect',230,.055,.06,.06,'triangle');}
 point(duration){if(!this.ctx)return;const d=Math.max(.18,duration);this.noise('effect',.015,d,.028,680);this.tone('effect',196,.015,d,.018,'sine');this.tone('effect',392,.015,d,.006,'sine');this.noise('effect',Math.max(.02,d-.03),.055,.045,1450);this.tone('effect',480,Math.max(.02,d-.03),.045,.012,'sine');}

 buzzer(side,hz,duration=null){if(!this.ctx||this.ctx.state!=='running')return false;const t=this.ctx.currentTime,osc=this.ctx.createOscillator(),env=this.ctx.createGain();osc.type='square';osc.frequency.setValueAtTime(hz,t);env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(.035,t+.001);if(duration!==null){env.gain.setValueAtTime(.035,t+duration-.001);env.gain.linearRampToValueAtTime(0,t+duration);}osc.connect(env);if(this.ctx.createStereoPanner){const p=this.ctx.createStereoPanner();p.pan.value=0;env.connect(p);p.connect(this.master)}else env.connect(this.master);this.remember(side,osc);osc.start(t);if(duration!==null)osc.stop(t+duration+.002);return true;}
 sustain(side,hz){return this.buzzer(side,hz)}
 chime(side,notes){return this.buzzer(side,notes[0],.3)}

}
if(typeof module!=='undefined')module.exports={SoundBus,Renderer,NOTES};
root.RailSound={SoundBus,Renderer,NOTES};
if(typeof document==='undefined'||['terminal','minase','boundary'].includes(document.body.dataset.station))return;
const renderer=new Renderer(root.AudioContext||root.webkitAudioContext),bus=new SoundBus(renderer);let runtime=null,rate=1;
const byId=id=>document.getElementById(id);
function paint(){const master=byId('audio-master');if(!master)return;master.textContent=bus.muted?'音声 OFF':'音声 ON';master.setAttribute('aria-pressed',String(!bus.muted));byId('audio-volume-value').textContent=Math.round(bus.volume*100)+'%';for(const side of ['W','E']){const a=bus.approaches[side],label=byId('audio-state-'+side),button=byId('audio-stop-'+side);label.textContent=a.id?(a.ack?'確認済み':bus.muted?'消音中':bus.paused?'一時停止':'接近中'):'待機';label.classList.toggle('ringing',!!a.id&&!a.ack&&!bus.muted&&!bus.paused);button.disabled=!a.id||a.ack;const active=!!a.id&&!a.ack&&!bus.muted&&!bus.paused&&bus.volume>0&&renderer.ctx?.state==='running';const panel=byId('cabinet-audio-'+side),lamp=byId('cabinet-audio-lamp-'+side);if(panel)panel.textContent=active?'動作中':'停止中';if(lamp)lamp.setAttribute('class','cabinet-indicator'+(active?' on':''));}}
function unlock(){try{renderer.ready()}catch{byId('audio-master').textContent='音声利用不可';}renderer.volume(bus.muted?0:bus.volume);}
document.addEventListener('pointerdown',unlock,{capture:true});document.addEventListener('keydown',unlock,{capture:true});
byId('audio-master').onclick=()=>{unlock();bus.mute(!bus.muted);paint()};byId('audio-volume').oninput=e=>{unlock();bus.level(Number(e.target.value)/100);paint()};
for(const side of ['W','E'])byId('audio-stop-'+side).onclick=()=>{bus.silence(side);paint()};
document.addEventListener('visibilitychange',()=>{if(document.hidden){bus.pause(true);paint()}});
const previousPoint=root.Rail.Station.prototype.togglePoint,previousLever=root.Rail.Station.prototype.lever;
root.Rail.Station.prototype.togglePoint=function(id){const result=previousPoint.call(this,id);if(result.ok&&!bus.muted){renderer.lever();renderer.point(2/rate)}return result};
root.Rail.Station.prototype.lever=function(side,dir,p){const result=previousLever.call(this,side,dir,p);if(result.ok&&!bus.muted)renderer.lever();return result};
root.RailAudio={update(station,paused,dt,speed){rate=speed||1;if(runtime!==station){runtime=station;bus.reset();}for(const side of ['W','E']){const train=station.trainAt(side+'I')||station.trainAt(side+'AI');bus.approach(side,train?.id||null)}bus.pause(paused||!station.running||station.finished||document.hidden);bus.tick(dt);paint();},bus};paint();
})(typeof window!=='undefined'?window:globalThis);



