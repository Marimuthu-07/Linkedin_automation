import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { AnalyticsPeriod, AnalyticsGroupBy } from '@linkedin-growth/shared';

describe('Analytics Engine API Integration Tests', () => {
  const app = createApp();

  describe('GET /api/analytics/definitions', () => {
    it('should return official mathematical metric definitions and local data provenance statement', async () => {
      const res = await request(app).get('/api/analytics/definitions');
      expect(res.status).toBe(200);
      expect(res.body.metrics).toBeDefined();
      expect(res.body.metrics.ENGAGEMENT_RATE).toBeDefined();
      expect(res.body.metrics.ENGAGEMENT_RATE.formula).toContain('Impressions');
      expect(res.body.dataProvenance).toContain('strictly calculated from local database records');
    });
  });

  describe('GET /api/analytics/overview', () => {
    it('should return cross-domain overview for standard 30d period', async () => {
      const res = await request(app).get('/api/analytics/overview?period=30d');
      expect(res.status).toBe(200);
      expect(res.body.period).toBe('30d');
      expect(res.body.startDate).toBeDefined();
      expect(res.body.endDate).toBeDefined();

      // Content domain
      expect(res.body.content).toBeDefined();
      expect(typeof res.body.content.totalPosts).toBe('number');
      expect(typeof res.body.content.totalImpressions).toBe('number');
      expect(res.body.content.impressionsComparison).toBeDefined();

      // Networking domain
      expect(res.body.networking).toBeDefined();
      expect(typeof res.body.networking.totalContacts).toBe('number');
      expect(res.body.networking.contactsComparison).toBeDefined();

      // Leads domain
      expect(res.body.leads).toBeDefined();
      expect(typeof res.body.leads.totalLeads).toBe('number');
      expect(typeof res.body.leads.qualifiedCount).toBe('number');

      // Internships domain
      expect(res.body.internships).toBeDefined();
      expect(typeof res.body.internships.totalTracked).toBe('number');

      // Deterministic Insights
      expect(Array.isArray(res.body.insights)).toBe(true);
      expect(Array.isArray(res.body.snapshots)).toBe(true);
    });

    it('should support 7d, 90d, and 1y periods', async () => {
      const res7d = await request(app).get('/api/analytics/overview?period=7d');
      expect(res7d.status).toBe(200);
      expect(res7d.body.period).toBe('7d');

      const res90d = await request(app).get('/api/analytics/overview?period=90d');
      expect(res90d.status).toBe(200);
      expect(res90d.body.period).toBe('90d');

      const res1y = await request(app).get('/api/analytics/overview?period=1y');
      expect(res1y.status).toBe(200);
      expect(res1y.body.period).toBe('1y');
    });

    it('should support custom date range', async () => {
      const res = await request(app).get('/api/analytics/overview?period=custom&startDate=2026-09-01&endDate=2026-09-25');
      expect(res.status).toBe(200);
      expect(res.body.period).toBe('custom');
      expect(res.body.startDate).toBe('2026-09-01');
      expect(res.body.endDate).toBe('2026-09-25');
    });

    it('should reject invalid period parameter with 400', async () => {
      const res = await request(app).get('/api/analytics/overview?period=invalid-period');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/analytics/content', () => {
    it('should return deep-dive content analytics including top posts and category performance', async () => {
      const res = await request(app).get('/api/analytics/content?period=30d');
      expect(res.status).toBe(200);
      expect(typeof res.body.totalPosts).toBe('number');
      expect(typeof res.body.totalImpressions).toBe('number');
      expect(res.body.postsByStatus).toBeDefined();
      expect(res.body.postsByCategory).toBeDefined();
      expect(Array.isArray(res.body.categoryBreakdown)).toBe(true);
      expect(Array.isArray(res.body.topPostsByImpressions)).toBe(true);
      expect(Array.isArray(res.body.topPostsByEngagementRate)).toBe(true);
      expect(Array.isArray(res.body.topPostsByComments)).toBe(true);
      expect(res.body.comparison).toBeDefined();
    });

    it('should filter content analytics by category', async () => {
      const res = await request(app).get('/api/analytics/content?period=30d&category=SOFTWARE_ENGINEERING');
      expect(res.status).toBe(200);
      expect(typeof res.body.totalPosts).toBe('number');
    });
  });

  describe('GET /api/analytics/content/trends', () => {
    it('should return time series trend points grouped by day', async () => {
      const res = await request(app).get('/api/analytics/content/trends?period=30d&groupBy=day');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0].date).toBeDefined();
        expect(typeof res.body[0].impressions).toBe('number');
        expect(typeof res.body[0].reactions).toBe('number');
      }
    });

    it('should support week and month grouping', async () => {
      const resWeek = await request(app).get('/api/analytics/content/trends?period=90d&groupBy=week');
      expect(resWeek.status).toBe(200);
      expect(Array.isArray(resWeek.body)).toBe(true);

      const resMonth = await request(app).get('/api/analytics/content/trends?period=1y&groupBy=month');
      expect(resMonth.status).toBe(200);
      expect(Array.isArray(resMonth.body)).toBe(true);
    });

    it('should reject invalid groupBy parameter with 400', async () => {
      const res = await request(app).get('/api/analytics/content/trends?groupBy=invalid');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/analytics/networking', () => {
    it('should return networking pipeline metrics, follow-up counts, and response rate', async () => {
      const res = await request(app).get('/api/analytics/networking?period=30d');
      expect(res.status).toBe(200);
      expect(typeof res.body.totalContacts).toBe('number');
      expect(typeof res.body.contactsAddedInPeriod).toBe('number');
      expect(typeof res.body.interactionsInPeriod).toBe('number');
      expect(typeof res.body.followUpsDueToday).toBe('number');
      expect(typeof res.body.followUpsOverdue).toBe('number');
      expect(res.body.contactsByStatus).toBeDefined();
      expect(res.body.contactsByCategory).toBeDefined();
      expect(res.body.comparison).toBeDefined();
    });
  });

  describe('GET /api/analytics/networking/trends', () => {
    it('should return networking time series trends', async () => {
      const res = await request(app).get('/api/analytics/networking/trends?period=30d&groupBy=day');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0].date).toBeDefined();
        expect(typeof res.body[0].contactsAdded).toBe('number');
      }
    });
  });

  describe('GET /api/analytics/leads', () => {
    it('should return lead pipeline conversion funnel and score averages', async () => {
      const res = await request(app).get('/api/analytics/leads?period=30d');
      expect(res.status).toBe(200);
      expect(typeof res.body.totalLeads).toBe('number');
      expect(typeof res.body.qualifiedLeadsCount).toBe('number');
      expect(typeof res.body.avgQualificationScore).toBe('number');
      expect(Array.isArray(res.body.pipelineFunnel)).toBe(true);
      expect(res.body.leadsByStatus).toBeDefined();
      expect(res.body.leadsBySource).toBeDefined();
      expect(res.body.leadsByServiceFit).toBeDefined();
    });
  });

  describe('GET /api/analytics/leads/trends', () => {
    it('should return lead ingestion trends', async () => {
      const res = await request(app).get('/api/analytics/leads/trends?period=30d');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/analytics/internships', () => {
    it('should return internship matching analytics and upcoming application deadlines', async () => {
      const res = await request(app).get('/api/analytics/internships?period=30d');
      expect(res.status).toBe(200);
      expect(typeof res.body.totalOpportunities).toBe('number');
      expect(typeof res.body.highMatchCount).toBe('number');
      expect(typeof res.body.avgMatchScore).toBe('number');
      expect(Array.isArray(res.body.opportunitiesByCompany)).toBe(true);
      expect(Array.isArray(res.body.upcomingDeadlines)).toBe(true);
      expect(res.body.opportunitiesByStatus).toBeDefined();
    });
  });

  describe('GET /api/analytics/internships/trends', () => {
    it('should return internship discovery trends', async () => {
      const res = await request(app).get('/api/analytics/internships/trends?period=30d');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Snapshots API (GET & POST /api/analytics/snapshots)', () => {
    it('should create or upsert a daily snapshot with automatic engagement rate calculation', async () => {
      const testDate = '2026-09-28';
      const res = await request(app)
        .post('/api/analytics/snapshots')
        .send({
          date: testDate,
          followers: 890,
          connections: 550,
          profileViews: 45,
          impressions: 2000,
          reactions: 70,
          comments: 20,
          reposts: 5,
          clicks: 25,
        });

      expect(res.status).toBe(201);
      expect(res.body.date).toBe(testDate);
      expect(res.body.followers).toBe(890);
      // (70 + 20 + 5 + 25) / 2000 * 100 = 120 / 2000 * 100 = 6.0%
      expect(res.body.engagementRate).toBe(6.0);
    });

    it('should reject snapshot with negative values', async () => {
      const res = await request(app)
        .post('/api/analytics/snapshots')
        .send({
          date: '2026-09-28',
          followers: -10,
          connections: 50,
          profileViews: 10,
          impressions: 100,
          reactions: 5,
          comments: 1,
          reposts: 0,
        });

      expect(res.status).toBe(400);
    });

    it('GET /api/analytics/snapshots should retrieve snapshots with limit', async () => {
      const res = await request(app).get('/api/analytics/snapshots?days=14');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeLessThanOrEqual(14);
    });
  });
});
