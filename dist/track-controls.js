(function(){'use strict';
window.RailOnTrack={place(panel,views,positions){
 const occupied=[];
 for(const[id,p]of Object.entries(positions)){
  const view=views[id],button=view?.button||view?.b;if(!button)throw new Error('Missing lever '+id);
  const fo=button.closest('foreignObject'),wrap=button.parentElement;
  fo.setAttribute('x',p[0]-32.5);fo.setAttribute('y',p[1]-41.5);fo.setAttribute('width',65);fo.setAttribute('height',104);fo.classList.add('track-control');
  fo.dataset.lever=id;fo.dataset.trackX=p[0];fo.dataset.trackY=p[1];
  wrap.classList.toggle('label-above',!!p[2]);panel.append(fo);occupied.push({x:p[0],y:p[1],radius:19});
 }
 for(const button of panel.querySelectorAll('.destination')){
  const fo=button.closest('foreignObject');occupied.push({x:+fo.getAttribute('x')+35,y:+fo.getAttribute('y')+16,radius:22});
 }
 // Keep every circuit window visible on its own rail, clear of the lever base,
 // destination button and insulating gap. Preserve the window object so live
 // occupancy and route indications continue to update normally.
 for(const lamp of panel.querySelectorAll('.circuit-window')){
  const recess=lamp.previousElementSibling,rail=recess?.previousElementSibling;
  if(!recess?.classList.contains('circuit-recess')||!rail?.matches('.rail,.terminal-rail,.boundary-rail'))continue;
  const length=rail.getTotalLength(),lampLength=lamp.getTotalLength(),original=lamp.getPointAtLength(lampLength/2);let best=null;
  const blocked=p=>occupied.some(c=>(p.x-c.x)**2+(p.y-c.y)**2<(c.radius+6)**2);
  if(![0,.5,1].some(t=>blocked(lamp.getPointAtLength(lampLength*t))))continue;
  for(const span of [Math.min(17,length*.15),8,4]){
   for(let at=span+7;at<=length-span-7;at+=4){
    let clear=true;for(const t of[-1,0,1]){const p=rail.getPointAtLength(at+span*t);if(blocked(p)){clear=false;break;}}
    if(!clear)continue;const p=rail.getPointAtLength(at),score=Math.hypot(p.x-original.x,p.y-original.y)+(17-span)*3;
    if(!best||score<best.score)best={at,span,score};
   }
   if(best)break;
  }
  if(!best)continue;const a=rail.getPointAtLength(best.at-best.span),b=rail.getPointAtLength(best.at+best.span),d='M'+a.x+' '+a.y+'L'+b.x+' '+b.y;
  lamp.setAttribute('d',d);recess.setAttribute('d',d);
 }
}};
})();

// A signal lever belongs ahead of its track-circuit window in train direction.
window.RailOnTrack.signalSide=function(views,id,circuit,rail,lamp){
 const button=views[id].button||views[id].b,fo=button.closest('foreignObject'),direction=button.classList.contains('left')?-1:1,x=+fo.dataset.trackX;
 fo.dataset.circuit=circuit;fo.dataset.travelDirection=String(direction);lamp.dataset.circuit=circuit;
 const length=rail.getTotalLength(),start=rail.getPointAtLength(0),end=rail.getPointAtLength(length);
 if(Math.abs(start.y-end.y)>.01)throw new Error('Signal control requires horizontal circuit '+circuit);
 const min=Math.min(start.x,end.x)+7,max=Math.max(start.x,end.x)-7;
 const points=[0,.5,1].map(t=>lamp.getPointAtLength(lamp.getTotalLength()*t));
 if(points.every(p=>direction*(x-p.x)>=28))return;
 const low=direction===1?min:Math.max(min,x+28),high=direction===1?Math.min(max,x-28):max;
 if(high-low<4)throw new Error('No clear window behind signal lever '+id);
 const span=Math.min(17,(high-low)/2),centre=(low+high)/2,y=start.y,d='M'+(centre-span)+' '+y+'L'+(centre+span)+' '+y;
 lamp.setAttribute('d',d);lamp.previousElementSibling.setAttribute('d',d);
};
