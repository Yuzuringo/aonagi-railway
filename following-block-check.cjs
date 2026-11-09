const assert=require('node:assert/strict');
const cases=[['青葉',require('./dist/station-engine'),'E',2],['汐見中央',require('./dist/terminal-engine'),'AE',1],['新凪原',require('./dist/boundary-engine'),'E',1]];
function fixture(api,gate,p){
 const s=new api.Station().begin();s.time=100;s.plan=[];
 const d=api.routeDef(gate,'out',p);
 for(const[k,v]of Object.entries(d.req)){s.points[k].value=v;s.points[k].target=v;if(s.points[k].ends)s.points[k].ends.fill(v);}
 const follower={id:'follow',from:gate==='AE'?'AW':'W',to:gate,p,loc:'P'+p,gone:false,arrived:true,doors:'open',dep:100,readyAt:100,reverseUntil:0,handover:true,crewReadyAt:0};
 // A stationary leading train beyond the next signal tests the waiting state
 // independently of each station's normal outer-block travel time.
 const lead={id:'lead',from:follower.from,to:gate,loc:gate+'AO',gone:false,outerSince:Infinity};
 s.trains=[follower,lead];s.records.follow={id:'follow',arr:40,dep:null,arrP:p,depP:null};
 if(gate==='E'&&api===cases[0][1])s.ahead.E.push({id:'lead',time:s.time});
 return{s,d,follower,lead};
}
for(const[name,api,gate,p]of cases){
 let {s,d,lead}=fixture(api,gate,p);
 assert.equal(s.blockAspect(gate,'out').code,'R',name+' next signal');
 assert.equal(s.check(d),null,name+' must allow the route');assert(s.set(gate,'out',p).ok);
 assert.equal(s.signalAspect(d.id).code,'YY',name+' must show warning');assert.equal(s.signalAspect(d.id).speed,25);
 lead.gone=true;for(const key of Object.keys(s.ahead))s.ahead[key]=[];
 assert(['Y','G'].includes(s.signalAspect(d.id).code),name+' automatically upgrades');
 ({s,d,lead}=fixture(api,gate,p));lead.loc=gate+'O';
 assert(s.check(d),name+' occupied departure route must remain blocked');
 assert.equal(s.signalAspect({...d,green:true,stage:-1,cancel:null}).code,'R');
 const test=fixture(api,gate,p);s=test.s;d=test.d;lead=test.lead;
 assert(s.set(gate,'out',p).ok);s.tick(40);
 assert.notEqual(s.records.follow.dep,null,name+' follower must depart');
 assert.equal(test.follower.speed,25,name+' warning speed');
 assert.equal(test.follower.loc,gate+'O',name+' must stop before occupied next block');
 assert.equal(lead.loc,gate+'AO');
 for(const block of [gate+'O',gate+'AO'])assert.equal(s.trains.filter(t=>s.occupied(t).includes(block)).length,1,name+' no shared circuit');
 lead.gone=true;s.tick(1);assert.equal(test.follower.loc,gate+'AO',name+' proceeds after next block clears');
 console.log('PASS '+name+': next signal R / departure YY25; blocked route R; doors, departure, waiting and automatic upgrade.');
}
const M=require('./dist/minase-engine'),m=new M.Station().begin(),md=M.routeDef('E','out',1);for(const[k,v]of Object.entries(md.req))m.points[k].value=v;m.trains=[{id:'ahead',loc:'EO',gone:false}];assert(m.check(md));assert.equal(m.signalAspect({...md,green:true,stage:-1,cancel:null}).code,'R');m.trains[0].loc='EI';assert.match(m.check(md),/閉塞/);console.log('PASS 水瀬: single-block departure and opposite-direction protection retained.');
