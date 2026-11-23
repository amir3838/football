import { NextRequest,NextResponse } from 'next/server';
import { getTeamFixtures,getH2H,getFixtureEvents,getInjuries } from '@/lib/providers/api-football';
import { calculateMatchScore,MatchTeamStats,MotivationState } from '@/lib/scoring-engine';
import { analyzeMotivation } from '@/lib/providers/football-data';
import { usageGet } from '@/lib/db';

function fixtureStats(fixtures:any[],teamId:number){
  let awayWins=0,awayDraws=0,totalWins=0,goalsScored=0,goalsConceded=0,redCards=0,penaltiesFor=0,penaltiesAgainst=0;
  const form=fixtures.slice(0,10).map((f:any)=>{
    const isAway=f.teams.away.id===teamId;
    const teamSide=isAway?'away':'home',opponentSide=isAway?'home':'away';
    const tg=f.goals[teamSide]??0,og=f.goals[opponentSide]??0;
    if(isAway&&tg>og)awayWins++; if(isAway&&tg===og)awayDraws++; if(tg>og)totalWins++;
    goalsScored+=tg;goalsConceded+=og;
    return {fixtureId:f.fixture.id,status:f.fixture.status.short,date:f.fixture.date,homeTeam:f.teams.home.name,awayTeam:f.teams.away.name,teamName:teamSide==='home'?f.teams.home.name:f.teams.away.name,opponentName:opponentSide==='home'?f.teams.home.name:f.teams.away.name,isAway,goalsFor:tg,goalsAgainst:og,result:tg>og?'W':tg===og?'D':'L'};
  });
  return {awayWins,awayDraws,totalWins,goalsScored,goalsConceded,redCards,penaltiesFor,penaltiesAgainst,form};
}

export async function POST(req:NextRequest){
  try{
    const body=await req.json();
    const teamA={id:Number(body.teamAId),name:String(body.teamAName),logo:String(body.teamALogo??'')};
    const teamB={id:Number(body.teamBId),name:String(body.teamBName),logo:String(body.teamBLogo??'')};
    if(!teamA.id||!teamB.id)return NextResponse.json({error:'يجب تحديد الفريقين رقميًا عبر البحث.'},{status:400});

    const [fixturesA,fixturesB,h2h]=await Promise.all([getTeamFixtures(teamA.id),getTeamFixtures(teamB.id),getH2H(teamA.id,teamB.id)]);
    const statsA=fixtureStats(fixturesA??[],teamA.id),statsB=fixtureStats(fixturesB??[],teamB.id);

    for(const [stats,fixtures,teamId] of [[statsA,fixturesA,teamA.id],[statsB,fixturesB,teamB.id]] as const){
      for(const fixture of (fixtures??[]).slice(0,10)){
        const homeId=fixture.teams.home.id,awayId=fixture.teams.away.id;
        const events=await getFixtureEvents(fixture.fixture.id,homeId,awayId);
        const isHome=teamId===homeId;
        stats.redCards+=isHome?events.homeRedCards:events.awayRedCards;
        stats.penaltiesFor+=isHome?events.homePenalties:events.awayPenalties;
        stats.penaltiesAgainst+=isHome?events.awayPenalties:events.homePenalties;
      }
    }

    let injuriesA:any[]=[],injuriesB:any[]=[];
    const latestFixtureId=fixturesA?.[0]?.fixture?.id;
    if(latestFixtureId){
      const [a,b]=await Promise.all([getInjuries(latestFixtureId),getInjuries(fixturesB?.[0]?.fixture?.id)]);
      injuriesA=a;injuriesB=b;
    }
    const apiInjuryA=(injuriesA??[]).some((i:any)=>i.team?.id===teamA.id&&i.player?.name);
    const apiInjuryB=(injuriesB??[]).some((i:any)=>i.team?.id===teamB.id&&i.player?.name);

    let h2hA=0,h2hB=0;
    for(const fixture of h2h??[]){
      const hg=fixture.goals?.home??0,ag=fixture.goals?.away??0;
      const winner=hg>ag?fixture.teams.home.id:ag>hg?fixture.teams.away.id:null;
      if(winner===teamA.id)h2hA++; if(winner===teamB.id)h2hB++;
    }

    let motivation:MotivationState=body.motivationOverride&&body.motivationOverride!=='auto'?body.motivationOverride:'none';
    if(!body.motivationOverride||body.motivationOverride==='auto'){
      try{motivation=await analyzeMotivation(body.leagueCode,teamA.id,teamB.id,teamA.name,teamB.name)}catch(error){if(body.failOnProviderError)return NextResponse.json({error:String(error)},{status:502})}
    }

    const teamAStats:MatchTeamStats={name:teamA.name,id:teamA.id,logo:teamA.logo,awayWins:statsA.awayWins,awayDraws:statsA.awayDraws,totalWins:statsA.totalWins,goalsScored:statsA.goalsScored,goalsConceded:statsA.goalsConceded,redCards:statsA.redCards,penaltiesFor:statsA.penaltiesFor,penaltiesAgainst:statsA.penaltiesAgainst,hasKeyInjury:Boolean(body.injuryAOverride ?? apiInjuryA)};
    const teamBStats:MatchTeamStats={name:teamB.name,id:teamB.id,logo:teamB.logo,awayWins:statsB.awayWins,awayDraws:statsB.awayDraws,totalWins:statsB.totalWins,goalsScored:statsB.goalsScored,goalsConceded:statsB.goalsConceded,redCards:statsB.redCards,penaltiesFor:statsB.penaltiesFor,penaltiesAgainst:statsB.penaltiesAgainst,hasKeyInjury:Boolean(body.injuryBOverride ?? apiInjuryB)};
    teamAStats.hasKeyInjury=Boolean(body.injuryAOverride ?? apiInjuryA);
    teamBStats.hasKeyInjury=Boolean(body.injuryBOverride ?? apiInjuryB);

    const result=calculateMatchScore(teamAStats,teamBStats,motivation,body.defensiveDeduction!==false,h2hA,h2hB);
    return NextResponse.json({teamA:teamAStats,teamB:teamBStats,motivation,h2h:{teamAWins:h2hA,teamBWins:h2hB,total:(h2h??[]).length},fixturesA:statsA.form,fixturesB:statsB.form,apiInjuries:{teamA:apiInjuryA,teamB:apiInjuryB},...result,usage:usageGet()});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:String(error)},{status:502});
  }
}
