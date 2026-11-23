# ARCHITECTURE.md — System Architecture & Stack

## 1. Technology Stack
- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Styling:** Tailwind CSS (configured with custom sharp editorial design tokens)
- **Database / Cache:** SQLite via `better-sqlite3` (stored locally in `./data/telemetry.db`) to cache finished match events, team IDs, and recent API responses so the 100 req/day free tier is never wasted.
- **Icons:** `lucide-react` (used sparingly at `16px` stroke `1.75` for technical indicators only)

## 2. Directory Structure
```text
├── data/
│   └── telemetry.db               # Auto-created SQLite cache
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── teams/search/route.ts    # Bilingual Arabic/English team search
│   │   │   └── analyze/route.ts         # Main orchestration & scoring endpoint
│   │   ├── globals.css
│   │   ├── layout.tsx                   # RTL Arabic layout + Google Fonts
│   │   └── page.tsx                     # Main Match Analysis Terminal
│   ├── lib/
│   │   ├── db.ts                        # SQLite initialization & cache helpers
│   │   ├── team-dictionary.ts           # Arabic-to-English team name & ID mapping
│   │   ├── providers/
│   │   │   ├── api-football.ts          # Primary data fetcher (v3.football.api-sports.io)
│   │   │   ├── football-data.ts         # Standings & motivation fetcher (football-data.org)
│   │   │   └── sportmonks.ts            # Secondary league fetcher (sportmonks.com)
│   │   ├── motivation-analyzer.ts       # Standings-based motivation evaluator
│   │   └── scoring-engine.ts            # Pure 11-rule deterministic math engine
│   └── components/
│       ├── MatchSelector.tsx            # Dual team search + motivation/injury override bar
│       ├── ScoreboardVerdict.tsx        # Final points comparison & favored team banner
│       ├── AuditBreakdownTable.tsx      # Side-by-side 11-rule calculation ledger
│       └── RecentFormStrip.tsx          # Last 10 matches W/D/L + H2H visual strip