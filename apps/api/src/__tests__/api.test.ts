import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { ContactCategory, ContentCategory, TaskPriority, TaskType } from '@linkedin-growth/shared';

describe('API Health and Core Endpoints', () => {
  const app = createApp();

  it('GET /api/health should return ok status and metadata', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.mode).toBe('human-in-the-loop');
    expect(res.body.version).toBe('1.0.0');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/non-existent should return 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });

  it('GET /api/dashboard/overview should return complete aggregated metrics', async () => {
    const res = await request(app).get('/api/dashboard/overview');
    expect(res.status).toBe(200);
    expect(res.body.networking).toBeDefined();
    expect(res.body.content).toBeDefined();
    expect(res.body.leads).toBeDefined();
    expect(res.body.internships).toBeDefined();
    expect(res.body.analytics).toBeDefined();
    expect(Array.isArray(res.body.todayActions)).toBe(true);
    expect(Array.isArray(res.body.recentNotifications)).toBe(true);
  });

  it('GET /api/networking should list contacts with filters and pagination', async () => {
    const res = await request(app).get('/api/networking');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(typeof res.body.total).toBe('number');
  });


  it('POST /api/content/generate should produce structured AI technical drafts', async () => {
    const res = await request(app)
      .post('/api/content/generate')
      .send({
        topic: 'Optimizing Node.js memory with transform streams',
        category: ContentCategory.SOFTWARE_ENGINEERING,
        targetAudience: 'Software Engineers',
        tone: 'AUTHENTIC_TECHNICAL',
        mainLesson: 'Streaming buffers prevent V8 memory pressure',
        desiredLength: 'MEDIUM',
      });

    expect(res.status).toBe(200);
    expect(res.body.hook).toBeDefined();
    expect(res.body.body).toBeDefined();
    expect(res.body.cta).toBeDefined();
    expect(Array.isArray(res.body.suggestedHashtags)).toBe(true);
  });

  it('POST /api/leads/score should calculate transparent scoring breakdown', async () => {
    const res = await request(app)
      .post('/api/leads/score')
      .send({
        websiteUxScore: 4,
        mobileExperienceScore: 3,
        performanceScore: 4,
        visualQualityScore: 5,
        ctaClarityScore: 2,
        conversionClarityScore: 3,
        serviceFit: 'HIGH',
      });

    expect(res.status).toBe(200);
    expect(res.body.totalScore).toBeGreaterThan(60);
    expect(Array.isArray(res.body.reasons)).toBe(true);
    expect(res.body.serviceFit).toBe('HIGH');
  });

  it('GET /api/analytics/content-performance should return sorted post rankings and explicit formula', async () => {
    const res = await request(app).get('/api/analytics/content-performance');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.topByImpressions)).toBe(true);
    expect(Array.isArray(res.body.topByEngagementRate)).toBe(true);
    expect(Array.isArray(res.body.topByComments)).toBe(true);
    expect(res.body.formulaExplanation).toContain('Engagement Rate (%)');
  });

  it('GET /api/internships should support match score and remote filtering', async () => {
    const res = await request(app).get('/api/internships?minScore=80&remote=true');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((item: any) => {
      expect(item.matchScore).toBeGreaterThanOrEqual(80);
      expect(item.remote).toBe(true);
    });
  });

  it('GET /api/tasks should return list of tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/settings should return user settings', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body.userName).toBeDefined();
    expect(Array.isArray(res.body.targetRoles)).toBe(true);
  });
});
