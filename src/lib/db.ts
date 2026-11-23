import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

let db: Database.Database | null = null;
let memoryUsage = {live_calls:0,cached_calls:0};

try {
  const dataDir = process.env.VERCEL ? path.join('/tmp','football-cache') : path.join(process.cwd(),'data');
  fs.mkdirSync(dataDir,{recursive:true});
  db=new Database(path.join(dataDir,'telemetry.db'));
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams_cache (query_normalized TEXT PRIMARY KEY, team_id INTEGER, english_name TEXT, arabic_name TEXT, logo_url TEXT, league_id INTEGER);
    CREATE TABLE IF NOT EXISTS fixture_events_cache (fixture_id INTEGER PRIMARY KEY, home_team_id INTEGER, away_team_id INTEGER, home_red_cards INTEGER, away_red_cards INTEGER, home_penalties INTEGER, away_penalties INTEGER);
    CREATE TABLE IF NOT EXISTS team_last10_cache (team_id INTEGER PRIMARY KEY, payload_json TEXT, fetched_at INTEGER);
    CREATE TABLE IF NOT EXISTS h2h_cache (pair_key TEXT PRIMARY KEY, payload_json TEXT, fetched_at INTEGER);
    CREATE TABLE IF NOT EXISTS api_usage (day TEXT PRIMARY KEY, live_calls INTEGER DEFAULT 0, cached_calls INTEGER DEFAULT 0);
  `);
}catch{
  db=null;
}

export const cacheDb=db;

export function teamCacheGet(query:string){
  try{return db?.prepare('SELECT * FROM teams_cache WHERE query_normalized=?').get(query) as any}catch{return undefined}
}
export function teamCacheSet(query:string,team:{id:number;name:string;logo?:string;league_id?:number},arabicName=''){
  try{db?.prepare(`INSERT OR REPLACE INTO teams_cache(query_normalized,team_id,english_name,arabic_name,logo_url,league_id) VALUES(?,?,?,?,?,?)`).run(query,team.id,team.name,arabicName,team.logo??'',team.league_id??null)}catch{}
}
export function last10Get(teamId:number,ttlMs:number){
  try{const row=db?.prepare('SELECT * FROM team_last10_cache WHERE team_id=?').get(teamId) as any;if(!row||Date.now()-row.fetched_at>ttlMs)return null;return JSON.parse(row.payload_json)}catch{return null}
}
export function last10Set(teamId:number,payload:unknown){try{db?.prepare('INSERT OR REPLACE INTO team_last10_cache(team_id,payload_json,fetched_at) VALUES(?,?,?)').run(teamId,JSON.stringify(payload),Date.now())}catch{}}
export function h2hGet(pairKey:string,ttlMs:number){try{const row=db?.prepare('SELECT * FROM h2h_cache WHERE pair_key=?').get(pairKey) as any;if(!row||Date.now()-row.fetched_at>ttlMs)return null;return JSON.parse(row.payload_json)}catch{return null}}
export function h2hSet(pairKey:string,payload:unknown){try{db?.prepare('INSERT OR REPLACE INTO h2h_cache(pair_key,payload_json,fetched_at) VALUES(?,?,?)').run(pairKey,JSON.stringify(payload),Date.now())}catch{}}
export function eventCacheGet(fixtureId:number){try{return db?.prepare('SELECT * FROM fixture_events_cache WHERE fixture_id=?').get(fixtureId) as any}catch{return undefined}}
export function eventCacheSet(fixtureId:number,homeId:number,awayId:number,counts:{homeRed:number;awayRed:number;homePen:number;awayPen:number}){try{db?.prepare(`INSERT OR REPLACE INTO fixture_events_cache(fixture_id,home_team_id,away_team_id,home_red_cards,away_red_cards,home_penalties,away_penalties) VALUES(?,?,?,?,?,?,?)`).run(fixtureId,homeId,awayId,counts.homeRed,counts.awayRed,counts.homePen,counts.awayPen)}catch{}}
export function usageRecord(kind:'live'|'cached'){memoryUsage[kind+'_calls' as 'live_calls'|'cached_calls']++;try{const day=new Date().toISOString().slice(0,10);db?.prepare('INSERT INTO api_usage(day,live_calls,cached_calls) VALUES(?,0,0) ON CONFLICT(day) DO NOTHING').run(day);db?.prepare(`UPDATE api_usage SET ${kind}_calls=${kind}_calls+1 WHERE day=?`).run(day)}catch{}}
export function usageGet(){try{const day=new Date().toISOString().slice(0,10);const row=db?.prepare('SELECT * FROM api_usage WHERE day=?').get(day) as any;if(row)return row}catch{};return memoryUsage}
