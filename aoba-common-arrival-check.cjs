const assert=require('node:assert/strict'),{Station,routeDef}=require('./dist/station-engine.js');
function ready(side,p){const s=new Station().begin(),d=routeDef(side,'in',p);for(const[id,v]of Object.entries(d.req)){Object.assign(s.points[id],{value:v,target:v,ends:s.points[id].pair?[v,v]:[v]});}return s;}
for(const side of ['W','E'])for(const p of [1,2,3,4]){let s=ready(side,p);assert.equal(s.arrivalSelection(side).p,p);assert.ok(s.arrivalLever(side).ok);assert.equal(s.arrivalHandle(side),`${side}-in-${p}`);assert.equal(s.arrivalRoute(side).p,p);for(const id of Object.keys(routeDef(side,'in',p).req))assert.ok(s.pointLocks(id).length);s.arrivalLever(side);assert.equal(s.arrivalHandle(side),null);
s=ready(side,p);s.trains.push({id:'occupied',loc:'P'+p});assert.equal(s.arrivalLever(side).ok,false);assert.equal(s.routes.length,0);
s=ready(side,p);const id=Object.keys(routeDef(side,'in',p).req)[0];s.points[id].moving=1;assert.equal(s.arrivalSelection(side),null);assert.equal(s.arrivalLever(side).ok,false);
s=ready(side,p);const pair=side==='W'?'13I':'23I';s.points[pair].ends=[0,1];assert.equal(s.arrivalSelection(side),null);}
console.log('PASS: all 8 point-selected arrivals, held-route restoration, related point locks, occupied destination has no fallback, moving/inconsistent proof refuses opening.');
