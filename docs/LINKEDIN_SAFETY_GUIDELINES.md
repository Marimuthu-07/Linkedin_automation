# LinkedIn Safety & Human-in-the-Loop Manifesto

## 1. Compliance Architecture
This software strictly adheres to official LinkedIn API policies and technical guidelines. It explicitly prohibits unauthorized browser automation, session token extraction, credential storage, and automated publishing.

## 2. Prohibited Behaviors (Architecturally Enforced)
- ❌ **No Bot Simulation**: No Puppeteer, Playwright, or Selenium scripts mimicking user mouse clicks, scrolls, or keypresses on LinkedIn.
- ❌ **No Credential or Cookie Ingestion**: The database schema contains zero fields for passwords, session cookies (`li_at`), or auth tokens.
- ❌ **No Automated Outreach or Connection Requests**: The application never sends requests or messages to LinkedIn automatically.
- ❌ **No Automated Publishing**: The application never publishes posts or updates to LinkedIn automatically. Internal scheduling is for calendar organization and reminders only.
- ❌ **No Mass Scraping or Anti-Bot Bypass**: No CAPTCHA solvers, proxy rotators, or unauthorized profile/feed scraping.
- ❌ **No Artificial Interactions**: No automated likes, comments, endorsements, or follows.

## 3. Human Gatekeeping & Publishing Workflows

### Content Workflow
1. **AI Role**: Turn raw technical notes into structured draft suggestions, propose alternative opening hooks, generate non-manipulative CTAs, and suggest category-specific hashtags.
2. **User Role**: Review and edit content in the full editor, approve drafts, set internal calendar target dates, copy content, open LinkedIn manually, and publish using LinkedIn's official interface.
3. **Manual Publish Verification**: Marking a post as `PUBLISHED` requires explicit user confirmation via the `POST /api/content/:id/publish-record` flow, preserving human responsibility for all public posts.

### Networking Workflow
1. **AI Role**: Analyze verified technical context provided by the user, organize relationship pipelines, and draft structured outreach suggestions with explicit provenance (`personalizationBasis`).
2. **User Role**: Verify factual accuracy, refine tone, copy the draft, and paste into official LinkedIn web or mobile interface manually.
3. **Status Transitions**: State transitions require explicit user confirmation. Transitioning a contact to `CONTACTED` represents a manual user action, never an automated event.

### Lead Generation & Freelance Outreach Workflow
1. **Manual Discovery & Intake**: Lead opportunities are entered manually by the user based on real-world observations. No web scrapers or crawling bots exist in the application.
2. **Deterministic Opportunity Audit**: Website audit scores (0–10) and service fit are evaluated mathematically using deterministic heuristics, not black-box predictions.
3. **Grounded Outreach Drafts**: AI draft generation is grounded strictly in stored lead facts. The AI is explicitly constrained from fabricating company revenue, team size, funding, awards, unverified technologies, or recent events.
4. **Manual Message Sending**: Generated drafts are NEVER sent automatically. The UI explicitly instructs the user: *"Copy this message and send it manually on LinkedIn or email."*
5. **Interaction Tracking**: The `LINKEDIN_MANUAL` interaction type documents that a human performed an action outside the application. The system records the user's notes; it does not perform LinkedIn actions.

## 4. Anti-Hallucination & Provenance Principles
- Draft outreach messages and content posts must only cite verified facts explicitly entered by the user.
- The AI engine will never fabricate metrics (e.g. "10,000 active users"), achievements, certifications, job titles, companies, quotes, or customer experiences.
- If source context is limited, the system explicitly flags `isLimitedContext: true` or `isLimitedPersonalization: true` and generates a conservative, grounded draft with explicit warnings.
