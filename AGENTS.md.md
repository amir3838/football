# AGENTS.md — Operational Directives for Codex

## 1. Core Mandate
Build a real-time, data-driven football match analysis web platform. When a user enters two teams (in Arabic or English, e.g., "ريال مدريد" vs "برشلونة" or "Real Madrid" vs "Barcelona"), the backend fetches real historical fixtures, H2H records, injuries, disciplinary events (red cards, penalties), and current league standings, runs the 11-point quantitative engine, and outputs a transparent point-by-point comparison and match verdict.

## 2. Non-Negotiable Prohibitions
- **NO Mock/Dummy Data:** Never fabricate fixture scores, red cards, or injuries if an API call fails. If an API rate limit is hit or a team is not found, return a structured error message explaining the exact API response.
- **NO Generic AI Aesthetics:** Strictly forbidden: `bg-gradient-to-r from-purple-...`, `indigo-500`, `violet-*`, glassmorphism blur cards, generic stock illustrations, or marketing fluff text.
- **NO Client-Side API Keys:** All requests to `v3.football.api-sports.io`, `api.football-data.org`, and `api.sportmonks.com` must execute strictly inside Next.js server-side Route Handlers (`/api/...`).

## 3. Bilingual & Arabic UX Requirements
- The primary interface language is **Arabic (`dir="rtl"`)**, using `IBM Plex Sans Arabic` for UI labels and `JetBrains Mono` (`dir="ltr"`, `tabular-nums`) for all scores, equations, and point breakdowns.
- Users must be able to type team names in **Arabic** (e.g., `ريال مدريد`, `برشلونة`, `ليفربول`, `مانشستر سيتي`, `الأهلي`, `الهلال`, `أرسنال`, `بايرن ميونخ`, `إنتر ميلان`, `باريس سان جيرمان`) and have the system automatically resolve them to their official English API names and numeric IDs.

## 4. Verification Before Completion
- Write and run a verification test script (`scripts/verify-engine.ts`) confirming that all 11 scoring rules compute exact outputs.
- Confirm that SQLite caching stores fixture events permanently once a match is finished (`FT`), preserving daily API quota.