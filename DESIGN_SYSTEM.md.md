# DESIGN_SYSTEM.md — Editorial Sports Telemetry Aesthetic

## 1. Visual Identity & Anti-AI-Slop Rules
The interface must look like a **bespoke European quantitative sports desk / matchday telemetry terminal** (inspired by Opta Analyst & Swiss editorial print broadsheets)—NOT an AI-generated template.
- **Strictly Forbidden:** Purple/violet/indigo gradients, glowing neon drop-shadows, animated blobs, floating pill navbars, `border-radius: 24px` bubbly cards, or fake "99% AI Accuracy" marketing badges.
- **Structural Geometry:** Crisp `1px` structural grid dividers (`#262930`), sharp `2px` (`rounded-sm`) corners on data panels, dense tabular data alignment, and high-contrast visual hierarchy.

## 2. Color Palette
- **Primary Canvas:** `#0B0C0E` (Matte Obsidian)
- **Elevated Surface / Ledger Row:** `#131519` (Graphite Slate)
- **Hover / Active Cell:** `#1C1F26`
- **Primary Ink:** `#F8F9FA` (Crisp Alabaster)
- **Secondary / Muted Ink:** `#8E95A2` (Steel Grey)
- **Brand Accent / Primary Action:** `#D90429` (Matchday Crimson Red)
- **Winner / Advantage Highlight:** `#D4AF37` (Championship Gold)
- **Positive Delta:** `#10B981` (Pitch Emerald)
- **Negative Delta:** `#EF4444` (Card Crimson)
- **Border Hairline:** `#24272F`

## 3. Typography
Load via `next/font/google`:
- **Arabic UI & Headings:** `IBM Plex Sans Arabic` (weights: 400, 500, 600, 700)
- **Numbers, Scores & Equations:** `JetBrains Mono` (weights: 500, 700) with `font-variant-numeric: tabular-nums` so columns of decimals align vertically to the pixel.

## 4. Layout Blueprint (Single-Screen Command Center)
1. **Top Utility Strip (Height `56px`):**
   - Left/Right border-bottom hairline. Displays system title (`مرصد التحليل الكمي للمباريات`), live API quota monitor badge (showing cached vs. live calls used today), and a quick reset button.
2. **Match Input & Context Control Bar:**
   - Two sharp autocomplete inputs side-by-side (`الفريق الأول / صاحب الأرض` vs `الفريق الثاني / الضيف`) supporting instant Arabic/English search with club crest thumbnails.
   - Collapsible/inline **Pre-Match Context Controls** right beneath the inputs so the user can inspect or override the auto-detected **إصابة لاعب مؤثر** (Team A / Team B switches) and **دافع الفوز** (`دافع للفريق الأول` | `دافع للفريق الثاني` | `التعادل مرضي للطرفين` | `تحصيل حاصل`) and immediately recalculate without re-fetching API data.
   - High-contrast `#D90429` primary action button: `تشغيل التحليل الكمي`.
3. **Verdict & Scoreboard Header:**
   - Asymmetric split scoreboard displaying **Team A Total Points** vs **Team B Total Points** in `48px` `JetBrains Mono` bold, separated by a sharp vertical rule, with a `#D4AF37` gold indicator bar highlighting the favored side and the exact point spread (`الفارق: +2.35 نقطة`).
4. **11-Rule Audit Ledger (Full Transparency Table):**
   - A clean, bordered analytical table listing all 11 criteria row-by-row:
     - Column 1: اسم المعيار (Criterion Name)
     - Column 2: البيانات الخام للفريق الأول (e.g., `4 انتصارات خارج الأرض` / `22 هدف`)
     - Column 3: نقاط الفريق الأول (`+1.00`, `-0.45`, etc. in monospace)
     - Column 4: نقاط الفريق الثاني (`+0.00`, `+1.10`, etc. in monospace)
     - Column 5: البيانات الخام للفريق الثاني
5. **Last 10 Matches & H2H Form Strip:**
   - Compact chronological match ticker for both teams showing opponent, home/away badge (`H`/`A`), exact scoreline, red cards, and penalties for each of the 10 analyzed matches so the user can visually verify every single number in the calculation.