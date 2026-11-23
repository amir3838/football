import { h2hGet,h2hSet,last10Get,last10Set,eventCacheGet,eventCacheSet,usageRecord } from '../db';

const configuredHost=(process.env.API_FOOTBALL_HOST||'v3.football.api-sports.io').trim().replace(/^https?:\/\//,'').replace(/\/$/,'')
const base=`https://${configuredHost}`;
async function get(path:string) {
  const key=process.env.API_FOOTBALL_KEY?.trim();
  if(!key) throw new Error('API_FOOTBALL_KEY مفقود في البيئة');
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),15000);
  let res:Response;
  try{res=await fetch(base+path,{headers:{'x-apisports-key':key},cache:'no-store',signal:controller.signal})}catch(error){throw new Error(error instanceof Error&&error.name==='AbortError'?'انتهت مهلة API-Football (15 ثانية)':`تعذر الاتصال بـ API-Football: ${error instanceof Error?error.message:String(error)}`)}finally{clearTimeout(timeout)}
  usageRecord('live');
  const json=await res.json();
  if(!res.ok || json.errors && Object.keys(json.errors).length>0){throw new Error(`API-Football HTTP ${res.status}: ${JSON.stringify(json.errors??json)}`)}
  return json.response;
}
export async function searchTeam(query:string) { return get(`/teams?search=${encodeURIComponent(query)}`); }
export async function getTeamFixtures(teamId:number) {
  const cached=last10Get(teamId,6*60*60*1000); if(cached){usageRecord('cached');return cached}
  const fixtures=await get(`/fixtures?team=${teamId}&last=10`);
  const completed=(fixtures??[]).filter((f:any)=>['FT','AET','PEN'].includes(f.fixture?.status?.short)).slice(0,10);
  last10Set(teamId,completed); return completed;
}
export async function getH2H(teamA:number,teamB:number) {
  const pairKey=`${Math.min(teamA,teamB)}-${Math.max(teamA,teamB)}`;
  const cached=h2hGet(pairKey,24*60*60*1000); if(cached){usageRecord('cached');return cached}
  const fixtures=await get(`/fixtures/headtohead?h2h=${teamA}-${teamB}&last=5`);
  const completed=(fixtures??[]).filter((f:any)=>['FT','AET','PEN'].includes(f.fixture?.status?.short)).slice(0,5);
  h2hSet(pairKey,completed); return completed;
}
export async function getFixtureEvents(fixtureId:number,homeId:number,awayId:number) {
  const cached=eventCacheGet(fixtureId); if(cached){usageRecord('cached');return {fixtureId,homeId,awayId,homeRedCards:cached.home_red_cards,awayRedCards:cached.away_red_cards,homePenalties:cached.home_penalties,awayPenalties:cached.away_penalties}}
  const events=await get(`/fixtures/events?fixture=${fixtureId}`);
  let homeRedCards=0,awayRedCards=0,homePenalties=0,awayPenalties=0;
  for(const event of events){
    const teamId=event.team?.id;
    if(event.type==='Card'&&(event.detail==='Red Card'||event.detail==='Yellow Red Card')){
      if(teamId===homeId)homeRedCards++; else if(teamId===awayId)awayRedCards++;
    }
    if((event.type==='Goal'&&(event.detail==='Penalty'||event.detail==='Missed Penalty'))||
       (event.type==='Var'&&event.detail==='Penalty confirmed')){
      if(event.detail==='Penalty confirmed')continue;
      if(teamId===homeId)homePenalties++; else if(teamId===awayId)awayPenalties++;
    }
  }
  eventCacheSet(fixtureId,homeId,awayId,{homeRed:homeRedCards,awayRed:awayRedCards,homePen:homePenalties,awayPen:awayPenalties});
  return {fixtureId,homeId,awayId,homeRedCards,awayRedCards,homePenalties,awayPenalties};
}
export async function getInjuries(fixtureId:number) {
  if(!fixtureId)return [];
  return get(`/injuries?fixture=${fixtureId}`);
}
