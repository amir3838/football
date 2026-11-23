import { NextRequest, NextResponse } from 'next/server';
import { findTeamInDictionary,normalizeTeamName } from '@/lib/team-dictionary';
import { teamCacheGet,teamCacheSet } from '@/lib/db';
import { searchTeam } from '@/lib/providers/api-football';
import { sportmonksTeamSearch } from '@/lib/providers/sportmonks';

export async function GET(req:NextRequest) {
  const query=(req.nextUrl.searchParams.get('q')??'').trim();
  if(!query)return NextResponse.json({teams:[]});
  const normalized=normalizeTeamName(query);
  const cached=teamCacheGet(normalized);
  if(cached)return NextResponse.json({teams:[{id:cached.team_id,name:cached.english_name,arabicName:cached.arabic_name,logo:cached.logo_url}]});
  const dict=findTeamInDictionary(query);
  if(dict){
    teamCacheSet(normalized,{id:dict.id,name:dict.english,league_id:undefined},dict.arabic);
    return NextResponse.json({teams:[{id:dict.id,name:dict.english,arabicName:dict.arabic,logo:''}]});
  }
  try{
    const results=await searchTeam(query);
    const teams=(results??[]).map((r:any)=>({id:r.team.id,name:r.team.name,arabicName:r.team.name,logo:r.team.logo}));
    if(teams[0])teamCacheSet(normalized,{id:teams[0].id,name:teams[0].name,logo:teams[0].logo},teams[0].arabicName);
    if(teams.length)return NextResponse.json({teams});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:String(error),teams:[]},{status:502});
  }
  try{
    const fallback=await sportmonksTeamSearch(query);
    if(fallback)return NextResponse.json({teams:[{id:fallback.id,name:fallback.name,arabicName:fallback.name,logo:fallback.image_path??''}]});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:String(error),teams:[]},{status:502})}
  return NextResponse.json({teams:[]},{status:404});
}
