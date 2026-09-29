import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@linkedin-growth/database';
import {
  createAnalyticsSnapshotSchema,
  calculateEngagementRate,
} from '@linkedin-growth/shared';
import { validateBody } from '../middlewares/validate.js';

export const analyticsRouter = Router();

// GET /api/analytics/snapshots
analyticsRouter.get('/snapshots', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = '30' } = req.query;
    const limit = Math.min(365, Math.max(1, parseInt(days as string, 10) || 30));

    const snapshots = await prisma.analyticsSnapshot.findMany({
      orderBy: { date: 'asc' },
      take: limit,
    });

    res.json(snapshots);
  } catch (error) {
    next(error);
  }
});

// POST /api/analytics/snapshots (Record manual / imported metrics snapshot)
analyticsRouter.post('/snapshots', validateBody(createAnalyticsSnapshotSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const engagementRate = calculateEngagementRate(
      data.impressions,
      data.reactions,
      data.comments,
      data.reposts,
      data.clicks
    );

    const snapshot = await prisma.analyticsSnapshot.upsert({
      where: { date: data.date },
      update: {
        ...data,
        engagementRate,
      },
      create: {
        ...data,
        engagementRate,
      },
    });

    res.status(201).json(snapshot);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/content-performance
analyticsRouter.get('/content-performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postsWithMetrics = await prisma.contentPost.findMany({
      where: {
        metrics: { some: {} },
      },
      include: {
        metrics: {
          orderBy: { recordedAt: 'desc' },
        },
      },
    });

    const enrichedPosts = postsWithMetrics.map((p) => {
      const latestMetric = p.metrics[0];
      return {
        ...p,
        metrics: latestMetric,
        latestMetrics: latestMetric,
      };
    });

    // Format and rank by distinct documented metrics
    const sortedByImpressions = [...enrichedPosts].sort(
      (a, b) => (b.metrics?.impressions || 0) - (a.metrics?.impressions || 0)
    );

    const sortedByEngagementRate = [...enrichedPosts].sort(
      (a, b) => (b.metrics?.engagementRate || 0) - (a.metrics?.engagementRate || 0)
    );

    const sortedByComments = [...enrichedPosts].sort(
      (a, b) => (b.metrics?.comments || 0) - (a.metrics?.comments || 0)
    );

    // Group performance by category
    const categoryBreakdown: Record<string, { count: number; totalImpressions: number; totalInteractions: number }> = {};

    enrichedPosts.forEach((p: any) => {
      const cat = p.category;
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { count: 0, totalImpressions: 0, totalInteractions: 0 };
      }
      categoryBreakdown[cat].count += 1;
      const imps = p.metrics?.impressions || 0;
      const interactions =
        (p.metrics?.reactions || 0) +
        (p.metrics?.comments || 0) +
        (p.metrics?.reposts || 0) +
        (p.metrics?.clicks || 0);

      categoryBreakdown[cat].totalImpressions += imps;
      categoryBreakdown[cat].totalInteractions += interactions;
    });

    const categoryStats = Object.entries(categoryBreakdown).map(([category, stat]) => ({
      category,
      postCount: stat.count,
      totalImpressions: stat.totalImpressions,
      avgEngagementRate: calculateEngagementRate(stat.totalImpressions, stat.totalInteractions, 0, 0, 0),
    }));

    res.json({
      allPosts: enrichedPosts,
      topByImpressions: sortedByImpressions.slice(0, 5),
      topByEngagementRate: sortedByEngagementRate.slice(0, 5),
      topByComments: sortedByComments.slice(0, 5),
      categoryStats,
      formulaExplanation: 'Engagement Rate (%) = ((Reactions + Comments + Reposts + Clicks) / Impressions) * 100. Returns null when impressions is 0.',
    });
  } catch (error) {
    next(error);
  }
});

