import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { ContentStatus, ContentCategory } from '@linkedin-growth/shared';

describe('Content Engine API Integration Tests', () => {
  const app = createApp();
  let createdPostId: string;
  let testIdeaPostId: string;
  let scheduledPostId: string;

  it('GET /api/content/stats should return content KPIs and engagement stats', async () => {
    const res = await request(app).get('/api/content/stats');
    expect(res.status).toBe(200);
    expect(typeof res.body.totalPosts).toBe('number');
    expect(typeof res.body.ideasCount).toBe('number');
    expect(typeof res.body.draftsCount).toBe('number');
    expect(typeof res.body.reviewCount).toBe('number');
    expect(typeof res.body.approvedCount).toBe('number');
    expect(typeof res.body.scheduledCount).toBe('number');
    expect(typeof res.body.publishedCount).toBe('number');
    expect(typeof res.body.avgImpressions).toBe('number');
  });

  it('GET /api/content should return paginated content response structure', async () => {
    const res = await request(app).get('/api/content?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeLessThanOrEqual(5);
    expect(typeof res.body.total).toBe('number');
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(5);
    expect(typeof res.body.totalPages).toBe('number');
  });

  it('GET /api/content should filter by status', async () => {
    const res = await request(app).get('/api/content?status=PUBLISHED');
    expect(res.status).toBe(200);
    res.body.items.forEach((p: any) => {
      expect(p.status).toBe(ContentStatus.PUBLISHED);
    });
  });

  it('GET /api/content should filter by category', async () => {
    const res = await request(app).get('/api/content?category=DATABASES');
    expect(res.status).toBe(200);
    res.body.items.forEach((p: any) => {
      expect(p.category).toBe(ContentCategory.DATABASES);
    });
  });

  it('GET /api/content should search across title, hook, body, and tags', async () => {
    const res = await request(app).get('/api/content?search=memory');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('GET /api/content should filter scheduled and published posts', async () => {
    const resScheduled = await request(app).get('/api/content?scheduled=true');
    expect(resScheduled.status).toBe(200);
    expect(Array.isArray(resScheduled.body.items)).toBe(true);

    const resPublished = await request(app).get('/api/content?published=true');
    expect(resPublished.status).toBe(200);
    expect(Array.isArray(resPublished.body.items)).toBe(true);
  });

  it('POST /api/content should create a quick idea with idea text only', async () => {
    const ideaData = {
      idea: 'I learned how PostgreSQL WAL (Write-Ahead Logging) guarantees durability before writing to shared buffers.',
      category: ContentCategory.DATABASES,
    };

    const res = await request(app).post('/api/content').send(ideaData);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe(ContentStatus.IDEA);
    expect(res.body.category).toBe(ContentCategory.DATABASES);
    expect(res.body.idea).toBe(ideaData.idea);
    expect(res.body.revisions?.length).toBeGreaterThanOrEqual(1);

    testIdeaPostId = res.body.id;
  });

  it('POST /api/content should create a full post with hooks and tags', async () => {
    const fullPost = {
      title: 'Demystifying Linux PipeWire for Real-Time Audio',
      hook: 'PipeWire replaces PulseAudio and JACK with zero-latency graph routing. Here is how it works:',
      body: '1. Single daemon handles both consumer and pro audio.\n2. Uses shared memory buffers for low latency.\n3. Native Wayland integration.',
      cta: 'Have you upgraded your Linux workstation to PipeWire?',
      category: ContentCategory.LINUX,
      status: ContentStatus.DRAFT,
      targetAudience: 'Linux Developers & Audio Engineers',
      tone: 'AUTHENTIC_TECHNICAL',
      sourceContext: 'Configured Linux workstation audio server.',
      hashtags: ['linux', 'audio', 'opensource', 'sysadmin'],
    };

    const res = await request(app).post('/api/content').send(fullPost);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe(fullPost.title);
    expect(res.body.hook).toBe(fullPost.hook);
    expect(res.body.status).toBe(ContentStatus.DRAFT);
    expect(res.body.revisionCount).toBe(1);

    createdPostId = res.body.id;
  });

  it('POST /api/content should reject empty post missing both title and idea', async () => {
    const invalid = {
      title: '',
      idea: '',
      category: ContentCategory.SOFTWARE_ENGINEERING,
    };

    const res = await request(app).post('/api/content').send(invalid);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('GET /api/content/:id should retrieve post by ID with revisions and metrics', async () => {
    const res = await request(app).get(`/api/content/${createdPostId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdPostId);
    expect(Array.isArray(res.body.revisions)).toBe(true);
    expect(res.body.revisions.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/content/:id should return 404 for non-existent ID', async () => {
    const res = await request(app).get('/api/content/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('PATCH /api/content/:id should update fields and create a new revision', async () => {
    const updateData = {
      hook: 'PipeWire is the best thing that happened to Linux desktop audio in 10 years. Here is why:',
      body: '1. Unifies JACK and PulseAudio.\n2. Minimal CPU overhead.\n3. Automatic Bluetooth codec switching.',
    };

    const res = await request(app).patch(`/api/content/${createdPostId}`).send(updateData);
    expect(res.status).toBe(200);
    expect(res.body.hook).toBe(updateData.hook);
    expect(res.body.revisionCount).toBe(2);
    expect(res.body.revisions.length).toBe(2);
  });

  it('PATCH /api/content/:id/status should strictly validate and enforce state-machine transitions', async () => {
    // 1. Valid: DRAFT -> REVIEW
    const resReview = await request(app)
      .patch(`/api/content/${createdPostId}/status`)
      .send({ status: ContentStatus.REVIEW });
    expect(resReview.status).toBe(200);
    expect(resReview.body.status).toBe(ContentStatus.REVIEW);

    // 2. Valid: REVIEW -> APPROVED
    const resApprove = await request(app)
      .patch(`/api/content/${createdPostId}/status`)
      .send({ status: ContentStatus.APPROVED });
    expect(resApprove.status).toBe(200);
    expect(resApprove.body.status).toBe(ContentStatus.APPROVED);

    // 3. Valid: APPROVED -> SCHEDULED
    const resSchedule = await request(app)
      .patch(`/api/content/${createdPostId}/status`)
      .send({ status: ContentStatus.SCHEDULED });
    expect(resSchedule.status).toBe(200);
    expect(resSchedule.body.status).toBe(ContentStatus.SCHEDULED);
    scheduledPostId = createdPostId;

    // 4. Invalid Jump: SCHEDULED -> DRAFT (Must unschedule to APPROVED first or ARCHIVE)
    const resInvalid = await request(app)
      .patch(`/api/content/${createdPostId}/status`)
      .send({ status: ContentStatus.DRAFT });
    expect(resInvalid.status).toBe(400);
    expect(resInvalid.body.error).toBe('Invalid content status transition');
    expect(resInvalid.body.currentStatus).toBe(ContentStatus.SCHEDULED);
    expect(resInvalid.body.attemptedStatus).toBe(ContentStatus.DRAFT);
    expect(Array.isArray(resInvalid.body.allowedTransitions)).toBe(true);
    expect(resInvalid.body.allowedTransitions).toContain(ContentStatus.APPROVED);
    expect(resInvalid.body.allowedTransitions).toContain(ContentStatus.PUBLISHED);

    // 5. Invalid Jump: IDEA -> PUBLISHED
    const resInvalidIdea = await request(app)
      .patch(`/api/content/${testIdeaPostId}/status`)
      .send({ status: ContentStatus.PUBLISHED });
    expect(resInvalidIdea.status).toBe(400);
  });

  it('POST /api/content/:id/generate should turn an idea into a structured draft with provenance', async () => {
    const res = await request(app)
      .post(`/api/content/${testIdeaPostId}/generate`)
      .send({ desiredLength: 'MEDIUM' });

    expect(res.status).toBe(200);
    expect(res.body.post).toBeDefined();
    expect(res.body.post.hook.length).toBeGreaterThan(10);
    expect(res.body.post.body.length).toBeGreaterThan(30);
    expect(res.body.post.aiGenerated).toBe(true);
    expect(res.body.post.status).toBe(ContentStatus.DRAFT);
    expect(Array.isArray(res.body.generated.hashtags)).toBe(true);
  });

  it('POST /api/content/:id/regenerate should return side-by-side versions', async () => {
    const res = await request(app)
      .post(`/api/content/${testIdeaPostId}/regenerate`)
      .send({ desiredLength: 'SHORT' });

    expect(res.status).toBe(200);
    expect(res.body.currentVersion).toBeDefined();
    expect(res.body.newVersion).toBeDefined();
    expect(res.body.newVersion.hook).toBeDefined();
    expect(res.body.newVersion.body).toBeDefined();
  });

  it('POST /api/content/:id/generate-hooks should produce 3-5 alternative hooks', async () => {
    const res = await request(app).post(`/api/content/${testIdeaPostId}/generate-hooks`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.hooks)).toBe(true);
    expect(res.body.hooks.length).toBeGreaterThanOrEqual(3);
    expect(res.body.post.alternativeHooks.length).toBeGreaterThanOrEqual(3);
  });

  it('POST /api/content/:id/generate-cta should produce natural CTAs', async () => {
    const res = await request(app).post(`/api/content/${testIdeaPostId}/generate-cta`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.ctas)).toBe(true);
    expect(res.body.ctas.length).toBeGreaterThanOrEqual(2);
  });

  it('POST /api/content/:id/generate-hashtags should produce relevant hashtags', async () => {
    const res = await request(app).post(`/api/content/${testIdeaPostId}/generate-hashtags`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.hashtags)).toBe(true);
    expect(res.body.hashtags.length).toBeGreaterThanOrEqual(3);
  });

  it('GET /api/content/:id/revisions should list revision history in descending order', async () => {
    const res = await request(app).get(`/api/content/${createdPostId}/revisions`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body[0].revisionNumber).toBeGreaterThan(res.body[1].revisionNumber);
  });

  it('POST /api/content/:id/publish-record should record manual publishing and validate URL', async () => {
    const res = await request(app)
      .post(`/api/content/${scheduledPostId}/publish-record`)
      .send({
        publishedAt: new Date().toISOString(),
        externalPostUrl: 'https://www.linkedin.com/posts/alexchen-demo-pipewire-post',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(ContentStatus.PUBLISHED);
    expect(res.body.publishedManually).toBe(true);
    expect(res.body.publishedAt).toBeDefined();
    expect(res.body.externalPostUrl).toBe('https://www.linkedin.com/posts/alexchen-demo-pipewire-post');
  });

  it('POST /api/content/:id/metrics should log performance snapshots with engagement rate', async () => {
    const metricsPayload = {
      impressions: 2500,
      reactions: 90,
      comments: 20,
      reposts: 5,
      clicks: 35,
    };

    const res = await request(app)
      .post(`/api/content/${scheduledPostId}/metrics`)
      .send(metricsPayload);

    expect(res.status).toBe(201);
    expect(res.body.snapshot).toBeDefined();
    expect(res.body.snapshot.impressions).toBe(2500);
    // (90+20+5+35)/2500 * 100 = 150/2500 * 100 = 6%
    expect(res.body.snapshot.engagementRate).toBe(6);
  });

  it('POST /api/content/:id/metrics should reject negative values', async () => {
    const negative = {
      impressions: -100,
      reactions: 10,
      comments: 0,
      reposts: 0,
      clicks: 0,
    };

    const res = await request(app)
      .post(`/api/content/${scheduledPostId}/metrics`)
      .send(negative);

    expect(res.status).toBe(400);
  });

  it('GET /api/content/:id/metrics should return snapshot history', async () => {
    const res = await request(app).get(`/api/content/${scheduledPostId}/metrics`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.snapshots)).toBe(true);
    expect(res.body.snapshots.length).toBeGreaterThanOrEqual(1);
    expect(res.body.latest).toBeDefined();
  });

  it('POST /api/content/generate should provide standalone workbench AI draft generation', async () => {
    const res = await request(app).post('/api/content/generate').send({
      idea: 'Why using Rust for CLI tools improves developer ergonomics',
      category: ContentCategory.DEV_TOOLS,
      targetAudience: 'Software Engineers',
      tone: 'AUTHENTIC_TECHNICAL',
      desiredLength: 'MEDIUM',
    });

    expect(res.status).toBe(200);
    expect(res.body.title).toBeDefined();
    expect(res.body.hook).toBeDefined();
    expect(res.body.body).toBeDefined();
    expect(Array.isArray(res.body.hashtags)).toBe(true);
  });

  it('DELETE /api/content/:id should delete post and cascade related data', async () => {
    const res = await request(app).delete(`/api/content/${testIdeaPostId}`);
    expect(res.status).toBe(200);

    const check = await request(app).get(`/api/content/${testIdeaPostId}`);
    expect(check.status).toBe(404);
  });
});
