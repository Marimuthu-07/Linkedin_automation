# LinkedIn Growth Automation Assistant

> A production-quality, **human-in-the-loop** productivity system for software engineering students and technical professionals to discover opportunities, analyze information, prepare high-value technical content, manage authentic networking pipelines, track freelance client leads, monitor internships, and analyze growth.

---

## 🔒 Important: Compliance & Safety Manifesto

**This application is NOT a bot that automates LinkedIn actions.**
- ❌ **No unauthorized browser automation, scraping, or credential harvesting.**
- ❌ **No automated likes, comments, connection requests, or DMs.**
- ❌ **No automated post publishing.**
- ✅ **100% Human-in-the-Loop:**

$$\text{DISCOVER / IDEATE} \longrightarrow \text{ANALYZE} \longrightarrow \text{GENERATE} \longrightarrow \text{REVIEW / SCHEDULE} \longrightarrow \text{USER APPROVES} \longrightarrow \text{USER PUBLISHES / SENDS}$$

All drafts, schedules, and outreach messages are reviewed and executed manually by the user in the official LinkedIn interface. Internal scheduling generates reminders and calendar views—it does **NOT** post to LinkedIn on your behalf.

---

## 🛠️ Tech Stack

### Frontend (`apps/web`)
- **React 18** with **TypeScript** & **Vite**
- **Tailwind CSS** with dark mode, curated indigo/cyan palettes & glassmorphism
- **Lucide Icons**
- **React Router v6**

### Backend (`apps/api`)
- **Node.js** with **TypeScript** & **Express**
- **Zod** schema validation for all API inputs and AI structured outputs
- **AI Provider Abstraction** (Deterministic offline mock engine, OpenAI, Gemini, Anthropic)

### Database (`packages/database`)
- **PostgreSQL 16** via **Docker Compose** (or local instance)
- **Prisma ORM** with indexes on status, categories, dates, and deadlines
- Full migration history & realistic demo seed dataset

### Shared (`packages/shared`)
- End-to-end domain types, Zod schemas, transparent qualification formulas, state machine transition maps, and engagement rate calculation helpers.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20+ (v22 recommended)
- **npm**: v9+
- **Docker & Docker Compose** (for PostgreSQL)

### 2. Installation & Setup

```bash
# 1. Install all dependencies across monorepo workspaces
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start PostgreSQL container
docker compose up -d

# 4. Generate Prisma Client & push schema
npm run db:generate
npm run db:push

# 5. Seed database with realistic DEMO data
npm run db:seed
```

### 3. Running in Development

```bash
# Run both API (port 4000) and Web (port 5173) concurrently
npm run dev

# Or run separately:
npm run dev:api   # API: http://localhost:4000
npm run dev:web   # Web: http://localhost:5173
```

---

## 🧪 Testing, Linting & Type Checking

```bash
# Run all unit and integration tests across workspaces (132 tests)
npm run test

# Run TypeScript typechecks across all workspaces
npm run typecheck

# Run linter across all workspaces
npm run lint

# Build all packages and applications for production
npm run build
```

---

## 📊 Completed Modules

1. **Overview Dashboard (Phase 1 & Phase 4 Enhanced)**: Unified KPIs across networking, content, leads, internships, analytics, period-over-period delta badges (`MetricDeltaBadge`), deterministic insight banners, interactive "Today's Actions" checklist, and upcoming post countdowns.
2. **Networking Pipeline (Phase 2 Complete & Verified)**:
   - Full 8-stage HITL workflow: `DISCOVER ➔ REVIEW ➔ APPROVE ➔ DRAFT MESSAGE ➔ USER REVIEWS ➔ USER MANUALLY CONTACTS ➔ CONTACTED ➔ REPLIED / FOLLOW_UP ➔ CONNECTED / ARCHIVED`
   - Strict state-machine transition map preventing invalid jumps (with HTTP 400 validation).
   - Descriptive KPI metrics: Total Prospects, Discovered, Reviewing, Approved, Contacted, Replies, Follow-ups Due Today, Overdue.
   - Dual UI view modes: Responsive table list with pagination (Page 1..N) and Interactive Kanban Board view.
   - Grounded AI Outreach Drafting with explicit provenance badges (`personalizationBasis`), limited data fallback, editable draft textarea, copy-to-clipboard, and message history logs.
   - Follow-up scheduling with quick presets ("Today", "In 3 Days", "In 7 Days", "Clear") and date status computation (`OVERDUE`, `DUE_TODAY`, `UPCOMING_7_DAYS`).
   - Accessible Add Person form requiring only Name with optional profile fields.
3. **LinkedIn Content Engine (Phase 3 Complete & Verified)**:
   - Full 7-stage HITL workflow: `IDEA ➔ DRAFT ➔ REVIEW ➔ APPROVED ➔ SCHEDULED ➔ PUBLISHED ➔ ARCHIVED`
   - Strict state-machine transition validation via `VALID_CONTENT_TRANSITIONS` and `isValidContentStatusTransition()`.
   - Controlled 16-category taxonomy (`SOFTWARE_ENGINEERING`, `AI`, `WEB_DEVELOPMENT`, `LINUX`, `DSA`, `PROJECT_BUILDING`, `OPEN_SOURCE`, `CAREER`, `LEARNING`, `INTERNSHIP`, `CLOUD`, `DATABASES`, `DEV_TOOLS`, `ENGINEERING_INSIGHTS`, `PERSONAL_PROJECT`, `OTHER`).
   - Quick Idea Capture (create posts with raw idea text alone).
   - 8 Technical Post Templates (Technical Lesson, Project Update, What I Learned, Technical Explanation, Mistake → Lesson, Tool Discovery, Engineering Insight, Weekly Progress).
   - Complete Full-Featured Editor with live character counters, writing target guides (`SHORT`: <600 chars, `MEDIUM`: 600-1500 chars, `LONG`: 1500-2500 chars), structured hashtag arrays, and CTA inputs.
   - Grounded AI Generation Workbench with anti-hallucination safeguards (never invents metrics, titles, or experiences; conservative generation on limited context).
   - Hook Generation (3–5 technical hook variations) & CTA generation & hashtag suggestions.
   - Non-destructive Revision History (`ContentRevision` table) with side-by-side diff comparison.
   - Content Calendar with Month, Week, and Upcoming list views (supports scheduling, rescheduling, unscheduling).
   - Manual Publishing Workflow with explicit external LinkedIn launcher and post URL recorder (`[Open LinkedIn] ➔ [Mark as Published]`).
   - Multi-snapshot Performance Metric Tracker (`ContentMetric` table) recording timestamped impressions, reactions, comments, reposts, clicks, and calculated engagement rates over time.
4. **Analytics Engine (Phase 4 Complete & Verified)**:
   - **Multi-Domain Analytics Hub**: Full-fidelity analytics across Content reach, Networking touchpoints, Freelance Leads pipeline, and Internship opportunities.
   - **Date Range Filters & Baseline Comparisons**: Quick presets (`7D`, `30D`, `90D`, `1Y`) and Custom Date Range picker with contiguous equal-duration baseline comparisons.
   - **Deterministic Insights Engine**: 100% grounded arithmetic insights (reach growth/dip, networking pacing, follow-up alerts, top content categories, lead qualifications, deadline alerts) without arbitrary AI scores.
   - **Interactive Visualizations**: Zero-dependency SVG time-series charts (area and bar charts with hover tooltips), category distribution bars, and funnel breakdowns.
   - **Explainable Metric Explainer Modal**: In-app transparency modal inspecting formulas, numerators, denominators, and null-handling rules.
   - **Zero Scraping & High Integrity**: All metrics derive strictly from locally stored database records and manual logging.
5. **Freelance Leads**: Transparent qualification breakdown (UX, Mobile, Performance, CTA, Conversion) and personalized value pitch generator.
6. **Internship Intelligence**: Official opening monitor with profile match scoring, deadline alerts, and direct career portal links.
7. **Unified Tasks**: Centralized task queue across all growth workflows.
8. **Settings**: Student profile, career preferences, target skills, and AI provider selection.

---

## 📐 Transparent Formulas

### Engagement Rate:
$$\text{Engagement Rate (\%)} = \frac{\text{Reactions} + \text{Comments} + \text{Reposts} + \text{Clicks}}{\text{Impressions}} \times 100$$
*(Safely returns `null` when impressions $\le 0$)*

### Period-over-Period Percentage Change:
$$\text{Percentage Change (\%)} = \frac{\text{Current Value} - \text{Previous Value}}{\text{Previous Value}} \times 100$$
*(Safely returns `null` when Previous is 0 and Current > 0)*

---

## 📜 License
MIT License. Created for ethical personal productivity and growth.
