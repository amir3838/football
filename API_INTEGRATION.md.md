# API_INTEGRATION.md — Multi-Provider Data Fetching & Quota Protection

## 1. Provider Strategy & Credentials
Use environment variables from `.env.local`:
1. **API-Football (`https://v3.football.api-sports.io`)**
   - Header: `x-apisports-key: process.env.API_FOOTBALL_KEY`
   - Primary source for: Team ID search, Last 10 fixtures, Head-to-Head (`last=5`), Fixture Events (Red cards & Penalties), and Injuries.
2. **Football-Data.org (`https://api.football-data.org/v4`)**
   - Header: `X-Auth-Token: process.env.FOOTBALL_DATA_TOKEN`
   - Used for: Fetching live league tables (`/competitions/{code}/standings`) to auto-calculate team motivation without consuming API-Football quota.
3. **Sportmonks (`https://api.sportmonks.com/v3/football`)**
   - Query param: `?api_token=${process.env.SPORTMONKS_TOKEN}`
   - Fallback provider for leagues covered under the active plan (Bundesliga, Scottish Premiership, Danish Superliga).

## 2. Smart Quota-Saving Cache (SQLite)
Because API-Football's free tier allows **100 requests/day**, implement a mandatory SQLite caching layer in `src/lib/db.ts`:
- `teams_cache (query_normalized TEXT PRIMARY KEY, team_id INTEGER, english_name TEXT, arabic_name TEXT, logo_url TEXT, league_id INTEGER)` $\rightarrow$ **Permanent TTL**.
- `fixture_events_cache (fixture_id INTEGER PRIMARY KEY, home_team_id INTEGER, away_team_id INTEGER, home_red_cards INTEGER, away_red_cards INTEGER, home_penalties INTEGER, away_penalties INTEGER)` $\rightarrow$ **Permanent TTL** (once a match ends, its red cards and penalties never change; thus, analyzing a second match involving the same team later costs almost zero extra event requests).
- `team_last10_cache (team_id INTEGER PRIMARY KEY, payload_json TEXT, fetched_at INTEGER)` $\rightarrow$ **6-hour TTL**.
- `h2h_cache (pair_key TEXT PRIMARY KEY, payload_json TEXT, fetched_at INTEGER)` $\rightarrow$ **24-hour TTL**.

## 3. Event Parsing Logic (Red Cards & Penalties)
When iterating over `/fixtures/events?fixture={id}`:
- **Red Cards:** `event.type === "Card"` AND (`event.detail === "Red Card"` OR `event.detail === "Yellow Red Card"`). Match `event.team.id` to increment either the target team's `red_cards` or opponent's `red_cards`.
- **Penalties:** (`event.type === "Goal"` AND `event.detail === "Penalty"`) OR (`event.type === "Var"` && `event.detail === "Penalty confirmed"` — avoid double-counting if Goal/Missed Penalty is already logged!) $\rightarrow$ Specifically count `event.detail === "Penalty"` OR `event.detail === "Missed Penalty"`. If `event.team.id === target_team_id`, increment `penalties_for`; otherwise increment `penalties_against`.

## 4. Built-in Arabic Team Dictionary (`src/lib/team-dictionary.ts`)
Pre-populate at least 60 major international and Arab clubs mapping Arabic names (with and without "ال" / spelling variations like `برشلونة` / `برشلونه`, `ريال مدريد`, `مانشستر يونايتد`, `مانشستر سيتي`, `ليفربول`, `ارسنال` / `أرسنال`, `تشيلسي`, `توتنهام`, `بايرن ميونخ`, `بوروسيا دورتموند`, `باريس سان جيرمان`, `يوفنتوس`, `انتر ميلان` / `إنتر ميلان`, `ميلان`, `نابولي`, `اتلتيكو مدريد` / `أتلتيكو مدريد`, `الأهلي` / `الاهلي`, `الزمالك`, `الهلال`, `النصر`, `الاتحاد`) directly to their English search names and verified `API-Football` IDs so search is instant and saves 2 API calls per query.