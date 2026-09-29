# API Specification

All endpoints are prefixed with `/api`. All inputs are strictly validated against Zod schemas.

## Health & System
- `GET /api/health`: Returns system status, uptime, database connection state, and mode (`human-in-the-loop`).
- `GET /api/dashboard/overview`: Aggregates overview KPIs across all modules, today's actions, and top matches.

---

## Content Engine (`/api/content`)

### Endpoints
- `GET /api/content/stats`: Returns content statistics and engagement metrics:
  ```json
  {
    "totalPosts": 10,
    "ideas": 2,
    "drafts": 2,
    "awaitingReview": 1,
    "approved": 1,
    "scheduled": 2,
    "published": 2,
    "archived": 0,
    "totalImpressions": 8430,
    "averageEngagementRate": 4.12
  }
  ```

- `GET /api/content`: Paginated list of content posts.
  - **Query Parameters**:
    - `status`: Filter by `ContentStatus` enum or `ALL`.
    - `category`: Filter by `ContentCategory` enum or `ALL`.
    - `search`: Full text search across title, hook, body, category, and hashtags.
    - `scheduled`: `true` | `false` — Filter posts with a scheduled date.
    - `published`: `true` | `false` — Filter posts with a published date.
    - `page`: Integer $\ge 1$ (default: `1`).
    - `limit`: Integer between `1` and `100` (default: `20`).
  - **Response**: `{ items: ContentPost[], total: number, page: number, limit: number, totalPages: number }`

- `GET /api/content/:id`: Get detailed post by ID, including ordered `revisions` and `metrics` snapshot history.

- `POST /api/content`: Create a new content post or quick idea.
  - **Required**: `title` OR `idea` (if only `idea` is supplied, `title` is automatically derived).
  - **Optional**: `hook`, `body`, `category`, `targetAudience`, `tone`, `cta`, `hashtags` (string array), `sourceContext`, `scheduledAt`, `status`.

- `PATCH /api/content/:id`: Partial update of post fields. Automatically creates a `ContentRevision` entry if content fields (`title`, `hook`, `body`, `cta`, `hashtags`) are updated.

- `PATCH /api/content/:id/status`: Explicit status transition endpoint.
  - **Body**: `{ "status": "DRAFT" }`
  - **Validation**: Enforces `VALID_CONTENT_TRANSITIONS`. Returns HTTP 400 Bad Request with allowed transitions if invalid.

- `DELETE /api/content/:id`: Deletes post and cascades deletion of related revisions and metric snapshots.

- `POST /api/content/:id/generate`: AI generates a structured draft for an existing post based on its idea/source context.
  - **Behavior**: Preserves current version as a revision, updates post with new draft, and logs provenance (`personalizationBasis`, `isLimitedContext`, `warnings`).

- `POST /api/content/:id/regenerate`: Generates an alternative candidate draft without immediately overwriting the post.
  - **Response**: `{ current: { ... }, candidate: { ... } }` (allows user to compare and choose).

- `POST /api/content/:id/generate-hooks`: AI generates 3–5 alternative grounded technical hooks.
  - **Response**: `{ hooks: string[], rationale: string }`

- `POST /api/content/:id/generate-cta`: AI generates 3 natural, non-manipulative call-to-action suggestions.
  - **Response**: `{ ctas: string[] }`

- `POST /api/content/:id/generate-hashtags`: AI suggests 3–5 category-specific technical hashtags.
  - **Response**: `{ hashtags: string[] }`

- `GET /api/content/:id/revisions`: Lists all revisions for a post ordered by `revisionNumber` descending.

- `POST /api/content/:id/publish-record`: Records manual publishing after user posts to LinkedIn.
  - **Body**: `{ "publishedAt": "2026-09-28T12:00:00.000Z", "externalPostUrl": "https://linkedin.com/posts/..." }`
  - **Behavior**: Transitions status to `PUBLISHED`, marks `publishedManually: true`, and validates external URL.

- `GET /api/content/:id/metrics`: Retrieves all performance snapshots recorded for the post.

- `POST /api/content/:id/metrics`: Records a new performance snapshot for a published post.
  - **Body**: `{ "impressions": 1200, "reactions": 45, "comments": 8, "reposts": 3, "clicks": 12, "followersAtPublication": 850 }`
  - **Validation**: All metric counts must be integers $\ge 0$. Automatically computes `engagementRate`.

- `POST /api/content/generate`: Standalone workbench generation for testing post prompts before creating records.

### Valid Content Status Transitions
| From Status | Allowed Target Statuses |
|---|---|
| `IDEA` | `DRAFT`, `ARCHIVED` |
| `DRAFT` | `REVIEW`, `IDEA`, `ARCHIVED` |
| `REVIEW` | `APPROVED`, `DRAFT`, `ARCHIVED` |
| `APPROVED` | `SCHEDULED`, `DRAFT`, `ARCHIVED` |
| `SCHEDULED` | `PUBLISHED`, `APPROVED`, `ARCHIVED` |
| `PUBLISHED` | `ARCHIVED` |
| `ARCHIVED` | `IDEA`, `DRAFT` |

---

## Networking Pipeline (`/api/networking`)

### Endpoints
- `GET /api/networking/stats`: Returns descriptive networking metrics and follow-up KPIs.
- `GET /api/networking`: Paginated list of prospects (filters: `status`, `category`, `company`, `search`, `followUpFilter`, `page`, `limit`).
- `GET /api/networking/:id`: Get detailed contact by ID, including ordered `messages` history.
- `POST /api/networking`: Create a prospect (`name` required).
- `PATCH /api/networking/:id`: Partial update of contact fields.
- `PATCH /api/networking/:id/status`: Explicit status transition endpoint (enforces `VALID_NETWORKING_TRANSITIONS`).
- `DELETE /api/networking/:id`: Deletes contact and cascades deletion of related messages.
- `POST /api/networking/:id/generate-message`: AI produces structured outreach draft.
- `POST /api/networking/:id/messages`: Create manual draft/message record.
- `PATCH /api/networking/:id/messages/:messageId`: Update message content or status.
- `DELETE /api/networking/:id/messages/:messageId`: Delete message record.

### Valid Networking Status Transitions
| From Status | Allowed Target Statuses |
|---|---|
| `DISCOVERED` | `REVIEWING`, `ARCHIVED` |
| `REVIEWING` | `APPROVED`, `ARCHIVED`, `DISCOVERED` |
| `APPROVED` | `CONTACTED`, `ARCHIVED`, `REVIEWING` |
| `CONTACTED` | `REPLIED`, `FOLLOW_UP`, `ARCHIVED` |
| `FOLLOW_UP` | `CONTACTED`, `REPLIED`, `ARCHIVED` |
| `REPLIED` | `CONNECTED`, `FOLLOW_UP`, `ARCHIVED` |
| `CONNECTED` | `ARCHIVED` |
| `ARCHIVED` | `DISCOVERED`, `REVIEWING` |

---

## Lead Generation & Outreach Engine (`/api/leads`)

### Endpoints
- `GET /api/leads/stats`: Returns full pipeline metrics and follow-up KPIs:
  ```json
  {
    "totalLeads": 15,
    "discovered": 2,
    "researching": 1,
    "qualified": 3,
    "outreachDraft": 2,
    "contacted": 3,
    "replied": 2,
    "meeting": 1,
    "proposal": 1,
    "won": 1,
    "lost": 0,
    "archived": 0,
    "averageQualificationScore": 76.8,
    "followUpsDueToday": 2,
    "followUpsOverdue": 1,
    "followUpsUpcoming7Days": 3,
    "conversionRates": {
      "replyRate": 66.67,
      "meetingRate": 33.33,
      "proposalRate": 33.33,
      "winRate": 33.33
    }
  }
  ```

- `GET /api/leads`: Paginated list of freelance leads.
  - **Query Parameters**:
    - `status`: Filter by `LeadStatus` enum or `ALL`.
    - `industry`: Filter by industry keyword or `ALL`.
    - `source`: Filter by acquisition source.
    - `minScore` / `maxScore`: Qualification score range boundaries (0–100).
    - `search`: Search across company, contact, role, industry, location, problem, opportunity, and notes.
    - `followUpFilter`: `due_today` | `overdue` | `upcoming_7_days` | `future` | `none` | `all`.
    - `sortBy`: `qualificationScore` | `createdAt` | `updatedAt` | `nextFollowUpAt` | `company`.
    - `sortOrder`: `asc` | `desc`.
    - `page`: Integer $\ge 1$ (default: `1`).
    - `limit`: Integer between `1` and `100` (default: `20`).
  - **Response**: `{ items: Lead[], total: number, page: number, limit: number, totalPages: number }`

- `GET /api/leads/:id`: Get detailed lead record including ordered `interactions` history.

- `POST /api/leads`: Create a new prospect lead with automated audit opportunity scoring.
  - **Required**: `company`, `website` (valid URL), `industry`, `problem`, `opportunity`.
  - **Optional**: `location`, `contactName`, `contactRole`, `linkedinUrl`, `companyLinkedinUrl`, `source`, `notes`, `qualificationScore`, `qualificationBreakdown`, `status`, `nextFollowUpAt`.

- `PATCH /api/leads/:id`: Partial update of lead fields.

- `PATCH /api/leads/:id/status`: Explicit status transition endpoint.
  - **Body**: `{ "status": "OUTREACH_DRAFT" }`
  - **Validation**: Enforces `VALID_LEAD_TRANSITIONS`. Returns HTTP 400 with allowed transitions if invalid.

- `PATCH /api/leads/:id/follow-up`: Schedule follow-up date and optionally log an interaction note.
  - **Body**: `{ "nextFollowUpAt": "2026-10-02T10:00:00.000Z", "note": "Check in on proposal" }`
  - **Behavior**: Updates `nextFollowUpAt`, logs a `NOTE` interaction if note text is provided, and updates `lastInteractionAt`.

- `POST /api/leads/score`: Compute transparent deterministic qualification heuristic without persisting.
  - **Body**: `{ "websiteUxScore": 5, "mobileExperienceScore": 4, "performanceScore": 3, "visualQualityScore": 6, "ctaClarityScore": 4, "conversionClarityScore": 3, "serviceFit": "HIGH", "identifiedIssues": ["Unclear CTA"] }`
  - **Response**: `{ "qualificationScore": 68, "qualificationBreakdown": { "websiteUxScore": 5, ..., "serviceFit": "HIGH", "reasons": [...], "totalScore": 68 } }`

- `POST /api/leads/:id/generate-outreach`: AI generates grounded outreach drafts and 3 multi-length variants.
  - **Body (optional)**: `{ "variantType": "DETAILED" }`
  - **Response**: `{ "lead": Lead, "draft": string, "breakdown": object, "personalizationBasis": string[], "variants": LeadOutreachVariant[], "guidance": string }`
  - **Anti-Hallucination**: Grounded strictly in verified lead facts and audit observations. Never sends messages automatically.

- `GET /api/leads/:id/interactions`: Retrieve chronological interaction history for a lead.

- `POST /api/leads/:id/interactions`: Log a manual interaction touchpoint.
  - **Body**: `{ "type": "LINKEDIN_MANUAL", "note": "Sent connection request manually", "occurredAt": "2026-09-29T10:00:00.000Z" }`
  - **Types**: `NOTE`, `EMAIL`, `CALL`, `MEETING`, `LINKEDIN_MANUAL`, `OTHER`.

- `DELETE /api/leads/:id/interactions/:interactionId`: Delete a single interaction log entry.

- `DELETE /api/leads/:id`: Delete lead record and cascade deletion of related interaction entries.

### Valid Lead Status Transitions
| From Status | Allowed Target Statuses |
|---|---|
| `DISCOVERED` | `RESEARCHING`, `QUALIFIED`, `OUTREACH_DRAFT`, `ARCHIVED` |
| `RESEARCHING` | `QUALIFIED`, `OUTREACH_DRAFT`, `DISCOVERED`, `ARCHIVED` |
| `QUALIFIED` | `OUTREACH_DRAFT`, `CONTACTED`, `RESEARCHING`, `ARCHIVED` |
| `OUTREACH_DRAFT` | `CONTACTED`, `QUALIFIED`, `ARCHIVED` |
| `CONTACTED` | `REPLIED`, `MEETING`, `OUTREACH_DRAFT`, `LOST`, `ARCHIVED` |
| `REPLIED` | `MEETING`, `PROPOSAL`, `CONTACTED`, `LOST`, `ARCHIVED` |
| `MEETING` | `PROPOSAL`, `WON`, `LOST`, `REPLIED`, `ARCHIVED` |
| `PROPOSAL` | `WON`, `LOST`, `MEETING`, `ARCHIVED` |
| `WON` | `ARCHIVED` |
| `LOST` | `DISCOVERED`, `QUALIFIED`, `ARCHIVED` |
| `ARCHIVED` | `DISCOVERED`, `RESEARCHING`, `QUALIFIED` |

---

## Internships (`/api/internships`)
- `GET /api/internships`: List opportunities (filters: `status`, `remote`, `minScore`, `search`).
- `POST /api/internships`: Create opportunity with match scoring.
- `PATCH /api/internships/:id`: Update opportunity.
- `DELETE /api/internships/:id`: Delete opportunity.

---

## Analytics Engine (`/api/analytics`)

The Phase 4 Analytics Engine provides production-grade, explainable aggregations, time-series trends, deterministic insights, and period-over-period comparisons across Content, Networking, Leads, and Internships. All metrics are computed strictly from local database records.

### Query Parameters (Zod-validated)
- `period`: `7d` | `30d` | `90d` | `1y` | `custom` (default: `30d`)
- `startDate`: ISO 8601 date string or `YYYY-MM-DD` (required when `period=custom`)
- `endDate`: ISO 8601 date string or `YYYY-MM-DD` (required when `period=custom`)
- `groupBy`: `day` | `week` | `month` (default: `day`, supported on `/trends` endpoints)

### Endpoints
- `GET /api/analytics/definitions`: Returns the official dictionary of transparent metric definitions and calculation formulas.
- `GET /api/analytics/overview`: Aggregated cross-domain KPI overview with period-over-period comparisons (`MetricComparison`) and deterministic insights.
- `GET /api/analytics/content`: Content metrics summary (posts by status, posts by category, total reach, impressions/interactions comparisons, category performance rankings, top-performing posts).
- `GET /api/analytics/content/trends`: Time-series bucketed data points for content activity (posts published, impressions, reactions, comments, reposts, clicks, engagement rates over time).
- `GET /api/analytics/networking`: Networking pipeline analytics (contacts by status, contacts by category, interactions comparison, follow-up backlog count, response rates).
- `GET /api/analytics/networking/trends`: Time-series bucketed touchpoint metrics (contacts added, messages logged, status transitions over time).
- `GET /api/analytics/leads`: Freelance lead conversion metrics (leads by status, leads by source, leads by service type, qualification score distribution, conversion funnel).
- `GET /api/analytics/leads/trends`: Time-series bucketed lead acquisition and qualification volume over time.
- `GET /api/analytics/internships`: Internship tracking metrics (opportunities by status, opportunities by source, high-match counts, upcoming application deadlines).
- `GET /api/analytics/internships/trends`: Time-series bucketed opportunity tracking and application submissions over time.
- `GET /api/analytics/snapshots?days=30`: Retrieve legacy profile snapshot records.
- `POST /api/analytics/snapshots`: Record a manual follower/connection snapshot.
- `GET /api/analytics/content-performance`: Legacy ranked list of content performance snapshots.

---

## Tasks & Notifications
- `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`.
- `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/mark-all-read`.
