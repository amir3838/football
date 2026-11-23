export async function sportmonksTeamSearch(query:string) {
  const token=process.env.SPORTMONKS_TOKEN;
  if(!token)return null;
  const url=`https://api.sportmonks.com/v3/football/teams/search/${encodeURIComponent(query)}?api_token=${encodeURIComponent(token)}`;
  const res=await fetch(url,{cache:'no-store'});
  if(!res.ok)throw new Error(`Sportmonks HTTP ${res.status}: ${await res.text()}`);
  const json=await res.json();
  return json.data?.[0]??null;
}
