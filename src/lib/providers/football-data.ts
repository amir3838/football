import type { MotivationState } from '../scoring-engine';

const leagueCodes=['PL','PD','SA','BL1','FL1','PPL','DED','BSA','CL'];

export async function analyzeMotivation(leagueCode:string|undefined, teamAId:number, teamBId:number, teamAName:string, teamBName:string):Promise<MotivationState> {
  const token=process.env.FOOTBALL_DATA_TOKEN;
  if(!token||!leagueCode||!leagueCodes.includes(leagueCode.toUpperCase()))return 'none';
  const res=await fetch(`https://api.football-data.org/v4/competitions/${leagueCode.toUpperCase()}/standings`,{headers:{'X-Auth-Token':token},cache:'no-store'});
  if(!res.ok)throw new Error(`football-data.org HTTP ${res.status}: ${await res.text()}`);
  const json=await res.json();
  const table=json.standings?.find((s:any)=>s.type==='TOTAL')?.table??[];
  const a=table.find((r:any)=>r.team.name===teamAName||r.team.shortName===teamAName);
  const b=table.find((r:any)=>r.team.name===teamBName||r.team.shortName===teamBName);
  if(!a&&!b)return 'none';
  // Match-position stakes are conservative; the UI allows exact manual override.
  const aStake=a&&((a.position<=5)||(a.position>=table.length-3));
  const bStake=b&&((b.position<=5)||(b.position>=table.length-3));
  if(aStake&&!bStake)return 'team_a';
  if(bStake&&!aStake)return 'team_b';
  if(aStake&&bStake)return 'draw_ok';
  return 'none';
}
