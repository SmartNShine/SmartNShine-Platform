# Landing page refresh: icons, typography, copy

Branch: `feat/landing-page-updates`. Scope: the sections rendered by `client/src/pages/LandingPage.jsx`.

## 1. What is wrong today (audit)

### Icons
| Finding | Where |
|---|---|
| `Sparkles` is the default "AI" icon in 7 of 11 sections, so nothing stands out | Hero, Pain Points, Portfolios, Scroll Split, Pricing, Final CTA |
| `CheckCircle2` is used for every positive point and `ArrowRight` for every action | all sections |
| Emoji and symbols used as icons or bullets (`➔`, `✓`, 7 in Pain Points, 3 in Pricing) | Hero, Pain Points, Pricing, FAQ data |
| Mixed stroke weights and tile sizes, with no icon-tile standard | Bento, How It Works, Pricing |
| `Rocket`, `Globe` and `Globe2` repeated across hero, How It Works and Final CTA | |
| Playful Bento has almost no icons (1), so it relies on illustration alone | PlayfulColorfulBento |

### Typography
- 8 Google font families are requested, and the whole `<link>` block is duplicated 3 times in `index.html` (a performance cost). The body font is Scoutie Sans with fallbacks.
- Text is tiny and heavy: 105 uses of `text-[10px]`, 76 of `text-[11px]` and 23 of `text-[9px]`. `font-black` and `font-extrabold` are used on headings and labels.
- Many all-caps labels with wide tracking (`uppercase tracking-wider`) for chips and eyebrows. They are scattered rather than systematic.
- Sizes are ad hoc (`text-[13px]`, `text-[15px]`), with no type scale.

### Copy: why it reads as AI-generated
1. **Stacked jargon:** "machine-verified single-column format", "quantified STAR achievements packed with proven recruiter metrics", "calibrated AI mock prep", "ATS keyword gap injection".
2. **Template phrasing:** the "SmartNShine Fix: ..." label repeated on every card, "Zero X required", "Apply with total career confidence", "land your dream offer without the application burnout".
3. **Superlatives and invented-sounding numbers:** "98%+ extraction rate", "99.4% accuracy" (already removed from Upload), "75% of resumes get silently rejected", "pixel-perfect", "state-of-the-art".
4. **Internal code comments leak into the voice:** "Luxury Obsidian Gold", "Auto-gliding between Resumes ➔ Portfolios" is shown as visible UI text.
5. **Vague promise lines:** "Smart suggestions that make an impact.", "Designed to open more opportunities."
6. **Three-item rhythm everywhere:** every sentence lists three things.

## 2. Principles
- Say what the product does in plain, concrete terms. Name the object and the result.
- One idea per sentence. No stacked adjectives. Active voice.
- Numbers only if we can source them. Otherwise remove or soften ("many ATS systems struggle with multi-column layouts").
- Sentence case for headings. Reserve all-caps for at most one small eyebrow per section.
- Tone: confident, calm, and written for a job seeker, not an engineer.

## 3. Plan

### Phase A. Content inventory and claims check (no UI change)
- Export every visible string from the 11 sections and `faqData.js` into a table: current text, proposed text, claim type (factual / marketing).
- Verify or remove each number and product claim: 98%+ extraction, 75% rejection, "15+ templates", "tested on Workday, Greenhouse, Taleo, Lever", "GPT-4o", pricing figures and limits. Decision is yours: keep only what we can back up.
- Output: `docs/landing-copy.md` for review before any code is touched.

### Phase B. Typography system
- Reduce fonts to two: **Inter** (UI and body) and one display option for headings, to be chosen with you. Keep JetBrains Mono only if the resume mock-ups need it. Remove the unused families and deduplicate the `<link>` in `index.html`.
- Define a type scale as Tailwind tokens: display, h1, h2, h3, body-lg, body, small, caption. Minimum text size 12px for anything a visitor must read. Replace the `text-[9px/10px/11px]` uses.
- Weights: headings 600 to 700, body 400, labels 500. Drop `font-black` and `font-extrabold`.
- Headings use `tracking-tight` and `text-balance`. Body max width 60 to 70 characters. Labels use sentence case.

### Phase C. Icon system
- Stay on **Lucide** (already installed) and standardise: stroke 1.75, sizes 16 / 20 / 24, one tile style (rounded-xl, subtle tint) used everywhere.
- One meaning per icon, no `Sparkles` as filler. Reserve it for a single AI badge.

| Meaning | Icon |
|---|---|
| ATS check / score | `ScanSearch`, `Gauge` |
| Resume | `FileText`, `FileUser` |
| AI rewrite | `WandSparkles` (one place only) |
| Portfolio / website | `PanelsTopLeft` |
| Interview practice | `AudioLines`, `MessagesSquare` |
| Career profile | `BriefcaseBusiness` |
| Templates | `LayoutTemplate` |
| Export / PDF | `FileDown` |
| Privacy | `ShieldCheck` |
| Positive list point | `Check` (plain), not `CheckCircle2` in a coloured circle |
| Problem / warning | `TriangleAlert`, `X` |

- Replace emoji and `➔` and `✓` characters with icons or plain text. Keep `ArrowRight` only on primary links and buttons.

### Phase D. Copy rewrite, section by section
Order: Hero, Pain Points, Feature Bento, How It Works, Portfolios, Pricing, FAQ, Final CTA, Footer note. For each section I will:
- Rewrite headline, sub-line and card text per the principles above.
- Remove the "SmartNShine Fix:" prefix. Cards become *problem* then *what we do*.
- Shorten FAQ answers to 2 to 3 sentences and drop repeated "takeaway" lines.
- Example of the target tone:
  - Before: "Build ATS-proof resumes, deploy live developer portfolios, and land top tech offers."
  - After: "Build a resume that gets past applicant tracking systems, then publish a portfolio to go with it."
  - Before: "SmartNShine compiles pure semantic single-column templates that pass enterprise ATS scans with a clean 98%+ extraction rate."
  - After: "Our templates use a single-column layout that applicant tracking systems read correctly."

### Phase E. Layout and polish
- Align spacing to an 8px rhythm, give headings and body consistent vertical rhythm, and reduce chip and badge density.
- Keep the existing animations. Remove any that exist only to decorate text.
- Check at 375, 768 and 1440 px, in light and dark.

## 4. Deliverables and order
1. `docs/landing-copy.md` (inventory plus proposed text) for your approval. **No code until approved.**
2. Typography tokens and `index.html` font cleanup (small PR).
3. Icon and copy pass, grouped by section (2 to 3 commits).
4. Screenshots at three widths for the PR.

## 5. Decisions needed from you
1. Display font for headings: keep Scoutie Sans, or move to Inter only?
2. Which numbers and claims are true and may stay (see Phase A list)?
3. Tone: neutral and plain, or a bit warmer and conversational?
4. Audience emphasis: students and freshers, working engineers, or both?
