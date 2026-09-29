import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@linkedin-growth/database';
import {
  createAnalyticsSnapshotSchema,
  analyticsQuerySchema,
  analyticsTrendsQuerySchema,
  calculateEngagementRate,
  calculateMetricComparison,
  getDateRangeForPeriod,
  formatBucketKey,
  formatDateKey,
  generateDeterministicInsights,
  OFFICIAL_METRIC_DEFINITIONS,
  AnalyticsPeriod,
  AnalyticsGroupBy,
  ContentStatus,
  ContactCategory,
  NetworkingStatus,
  LeadStatus,
  InternshipStatus,
} from '@linkedin-growth/shared';
import { validateBody, validateQuery } from '../middlewares/validate.js';

export const analyticsRouter = Router();

// GET /api/analytics/definitions (Official metric definitions and provenance)
analyticsRouter.get('/definitions', (_req: Request, res: Response) => {
  res.json({
    metrics: OFFICIAL_METRIC_DEFINITIONS,
    dataProvenance: 'All metrics are strictly calculated from local database records (manual entries, imported metrics, and audit records). Absolutely no unauthorized scraping or external account access.',
  });
});

// GET /api/analytics/overview (Cross-domain overview with period comparisons and insights)
analyticsRouter.get('/overview', validateQuery(analyticsQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period, startDate: customStart, endDate: customEnd } = req.query as any;
    const { startDate, endDate, prevStartDate, prevEndDate } = getDateRangeForPeriod(
      period,
      customStart,
      customEnd
    );

    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Parallel aggregate queries across domains
    const [
      // Content metrics
      currentContentMetrics,
      prevContentMetrics,
      currentPublishedCount,
      prevPublishedCount,
      totalPostsCount,
      topCategoryRow,

      // Networking metrics
      totalContactsCount,
      currentContactsAdded,
      prevContactsAdded,
      currentNetworkingInteractions,
      prevNetworkingInteractions,
      followUpsDueCount,

      // Lead metrics
      totalLeadsCount,
      currentLeadsCreated,
      prevLeadsCreated,
      qualifiedLeadsCount,
      activePipelineCount,

      // Internship metrics
      totalInternshipsCount,
      currentInternshipsAdded,
      prevInternshipsAdded,
      highMatchCount,
      upcomingDeadlinesCount,

      // Snapshots
      latestSnapshot,
      snapshotsInPeriod,
    ] = await Promise.all([
      // Content
      prisma.contentMetric.findMany({
        where: { recordedAt: { gte: startDate, lte: endDate } },
        select: { impressions: true, reactions: true, comments: true, reposts: true, clicks: true, engagementRate: true },
      }),
      prisma.contentMetric.findMany({
        where: { recordedAt: { gte: prevStartDate, lte: prevEndDate } },
        select: { impressions: true, reactions: true, comments: true, reposts: true, clicks: true, engagementRate: true },
      }),
      prisma.contentPost.count({
        where: { publishedAt: { gte: startDate, lte: endDate }, status: ContentStatus.PUBLISHED },
      }),
      prisma.contentPost.count({
        where: { publishedAt: { gte: prevStartDate, lte: prevEndDate }, status: ContentStatus.PUBLISHED },
      }),
      prisma.contentPost.count(),
      prisma.contentPost.findMany({
        where: { metrics: { some: {} } },
        include: { metrics: { orderBy: { recordedAt: 'desc' }, take: 1 } },
      }),

      // Networking
      prisma.networkingContact.count(),
      prisma.networkingContact.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.networkingContact.count({
        where: { createdAt: { gte: prevStartDate, lte: prevEndDate } },
      }),
      prisma.networkingContact.count({
        where: { lastInteractionAt: { gte: startDate, lte: endDate } },
      }),
      prisma.networkingContact.count({
        where: { lastInteractionAt: { gte: prevStartDate, lte: prevEndDate } },
      }),
      prisma.networkingContact.count({
        where: { nextFollowUpAt: { lte: endOfDay }, status: { in: ['FOLLOW_UP', 'REPLIED', 'CONTACTED'] } },
      }),

      // Leads
      prisma.lead.count(),
      prisma.lead.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.lead.count({
        where: { createdAt: { gte: prevStartDate, lte: prevEndDate } },
      }),
      prisma.lead.count({
        where: { status: 'QUALIFIED' },
      }),
      prisma.lead.count({
        where: { status: { in: ['QUALIFIED', 'OUTREACH_DRAFT', 'CONTACTED', 'REPLIED', 'MEETING', 'PROPOSAL'] } },
      }),

      // Internships
      prisma.internship.count(),
      prisma.internship.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.internship.count({
        where: { createdAt: { gte: prevStartDate, lte: prevEndDate } },
      }),
      prisma.internship.count({
        where: { matchScore: { gte: 80 }, status: { in: ['NEW', 'REVIEWING', 'SAVED', 'INTERESTED'] } },
      }),
      prisma.internship.count({
        where: { deadline: { lte: new Date(Date.now() + 14 * 86400000), gte: now } },
      }),

      // Snapshots
      prisma.analyticsSnapshot.findFirst({ orderBy: { date: 'desc' } }),
      prisma.analyticsSnapshot.findMany({
        where: {
          date: {
            gte: formatDateKey(startDate),
            lte: formatDateKey(endDate),
          },
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    // Sum content metrics for current period
    const currentImpressions = currentContentMetrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
    const currentInteractions = currentContentMetrics.reduce(
      (sum, m) => sum + (m.reactions || 0) + (m.comments || 0) + (m.reposts || 0) + (m.clicks || 0),
      0
    );
    const currentAvgEngagement = calculateEngagementRate(currentImpressions, currentInteractions, 0, 0, 0);

    // Sum content metrics for previous period
    const prevImpressions = prevContentMetrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
    const prevInteractions = prevContentMetrics.reduce(
      (sum, m) => sum + (m.reactions || 0) + (m.comments || 0) + (m.reposts || 0) + (m.clicks || 0),
      0
    );

    // Determine top performing category from posts
    const categoryAgg: Record<string, { impressions: number; interactions: number }> = {};
    topCategoryRow.forEach((p) => {
      const cat = p.category;
      const m = p.metrics[0];
      if (m) {
        if (!categoryAgg[cat]) categoryAgg[cat] = { impressions: 0, interactions: 0 };
        categoryAgg[cat].impressions += m.impressions || 0;
        categoryAgg[cat].interactions += (m.reactions || 0) + (m.comments || 0) + (m.reposts || 0) + (m.clicks || 0);
      }
    });

    let topCategory: string | null = null;
    let topCategoryEngagement: number | null = null;
    let maxRate = -1;
    for (const [cat, agg] of Object.entries(categoryAgg)) {
      if (agg.impressions > 0) {
        const rate = calculateEngagementRate(agg.impressions, agg.interactions, 0, 0, 0) || 0;
        if (rate > maxRate) {
          maxRate = rate;
          topCategory = cat;
          topCategoryEngagement = rate;
        }
      }
    }

    // Comparisons
    const impressionsComparison = calculateMetricComparison(currentImpressions, prevImpressions);
    const interactionsComparison = calculateMetricComparison(currentInteractions, prevInteractions);
    const contactsComparison = calculateMetricComparison(currentContactsAdded, prevContactsAdded);
    const networkingInteractionsComparison = calculateMetricComparison(currentNetworkingInteractions, prevNetworkingInteractions);
    const leadsComparison = calculateMetricComparison(currentLeadsCreated, prevLeadsCreated);
    const internshipsComparison = calculateMetricComparison(currentInternshipsAdded, prevInternshipsAdded);

    // Deterministic Insights
    const insights = generateDeterministicInsights({
      content: {
        totalImpressions: currentImpressions,
        totalInteractions: currentInteractions,
        impressionsComparison,
        avgEngagementRate: currentAvgEngagement,
        topCategory,
        topCategoryEngagement,
        postsPublishedInPeriod: currentPublishedCount,
      },
      networking: {
        contactsAddedInPeriod: currentContactsAdded,
        interactionsInPeriod: currentNetworkingInteractions,
        followUpsDueCount,
        interactionsComparison: networkingInteractionsComparison,
        contactsComparison,
      },
      leads: {
        createdInPeriod: currentLeadsCreated,
        qualifiedCount: qualifiedLeadsCount,
        leadsComparison,
      },
      internships: {
        highMatchCount,
        upcomingDeadlinesCount,
      },
    });

    res.json({
      period,
      startDate: formatDateKey(startDate),
      endDate: formatDateKey(endDate),
      content: {
        totalPosts: totalPostsCount,
        publishedInPeriod: currentPublishedCount,
        totalImpressions: currentImpressions,
        totalInteractions: currentInteractions,
        avgEngagementRate: currentAvgEngagement,
        impressionsComparison,
        interactionsComparison,
      },
      networking: {
        totalContacts: totalContactsCount,
        addedInPeriod: currentContactsAdded,
        followUpsDueCount,
        interactionsInPeriod: currentNetworkingInteractions,
        contactsComparison,
        interactionsComparison: networkingInteractionsComparison,
      },
      leads: {
        totalLeads: totalLeadsCount,
        createdInPeriod: currentLeadsCreated,
        qualifiedCount: qualifiedLeadsCount,
        activePipelineCount,
        leadsComparison,
      },
      internships: {
        totalTracked: totalInternshipsCount,
        addedInPeriod: currentInternshipsAdded,
        highMatchCount,
        upcomingDeadlinesCount,
        internshipsComparison,
      },
      latestSnapshot,
      snapshots: snapshotsInPeriod,
      insights,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/content (Deep dive content analytics)
analyticsRouter.get('/content', validateQuery(analyticsQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period, startDate: customStart, endDate: customEnd, category } = req.query as any;
    const { startDate, endDate, prevStartDate, prevEndDate } = getDateRangeForPeriod(
      period,
      customStart,
      customEnd
    );

    const whereCategory = category ? { category } : {};

    const [
      allPosts,
      publishedPostsInPeriod,
      prevPublishedPostsInPeriod,
      currentMetrics,
      prevMetrics,
      postsWithMetrics,
    ] = await Promise.all([
      prisma.contentPost.findMany({ where: whereCategory }),
      prisma.contentPost.findMany({
        where: {
          ...whereCategory,
          status: ContentStatus.PUBLISHED,
          publishedAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.contentPost.findMany({
        where: {
          ...whereCategory,
          status: ContentStatus.PUBLISHED,
          publishedAt: { gte: prevStartDate, lte: prevEndDate },
        },
      }),
      prisma.contentMetric.findMany({
        where: {
          recordedAt: { gte: startDate, lte: endDate },
          post: whereCategory,
        },
      }),
      prisma.contentMetric.findMany({
        where: {
          recordedAt: { gte: prevStartDate, lte: prevEndDate },
          post: whereCategory,
        },
      }),
      prisma.contentPost.findMany({
        where: {
          ...whereCategory,
          metrics: { some: {} },
        },
        include: {
          metrics: { orderBy: { recordedAt: 'desc' } },
        },
      }),
    ]);

    // Status distribution
    const postsByStatus: Record<string, number> = {};
    const postsByCategory: Record<string, number> = {};

    allPosts.forEach((p) => {
      postsByStatus[p.status] = (postsByStatus[p.status] || 0) + 1;
      postsByCategory[p.category] = (postsByCategory[p.category] || 0) + 1;
    });

    // Current period totals
    const totalImpressions = currentMetrics.reduce((s, m) => s + (m.impressions || 0), 0);
    const totalReactions = currentMetrics.reduce((s, m) => s + (m.reactions || 0), 0);
    const totalComments = currentMetrics.reduce((s, m) => s + (m.comments || 0), 0);
    const totalReposts = currentMetrics.reduce((s, m) => s + (m.reposts || 0), 0);
    const totalClicks = currentMetrics.reduce((s, m) => s + (m.clicks || 0), 0);
    const totalInteractions = totalReactions + totalComments + totalReposts + totalClicks;

    const avgEngagementRate = calculateEngagementRate(totalImpressions, totalInteractions, 0, 0, 0);
    const avgImpressionsPerPost = publishedPostsInPeriod.length > 0
      ? Math.round(totalImpressions / publishedPostsInPeriod.length)
      : 0;

    // Previous period totals
    const prevImpressions = prevMetrics.reduce((s, m) => s + (m.impressions || 0), 0);
    const prevReactions = prevMetrics.reduce((s, m) => s + (m.reactions || 0), 0);
    const prevComments = prevMetrics.reduce((s, m) => s + (m.comments || 0), 0);
    const prevReposts = prevMetrics.reduce((s, m) => s + (m.reposts || 0), 0);
    const prevClicks = prevMetrics.reduce((s, m) => s + (m.clicks || 0), 0);
    const prevInteractions = prevReactions + prevComments + prevReposts + prevClicks;
    const prevAvgEngagementRate = calculateEngagementRate(prevImpressions, prevInteractions, 0, 0, 0);

    // Enriched top posts
    const enrichedPosts = postsWithMetrics.map((p) => {
      const latestMetric = p.metrics[0];
      return {
        ...p,
        metrics: latestMetric,
        latestMetrics: latestMetric,
      };
    });

    const topPostsByImpressions = [...enrichedPosts]
      .sort((a, b) => (b.metrics?.impressions || 0) - (a.metrics?.impressions || 0))
      .slice(0, 5);

    const topPostsByEngagementRate = [...enrichedPosts]
      .filter((p) => (p.metrics?.impressions || 0) > 0 && p.metrics?.engagementRate !== null)
      .sort((a, b) => (b.metrics?.engagementRate || 0) - (a.metrics?.engagementRate || 0))
      .slice(0, 5);

    const topPostsByComments = [...enrichedPosts]
      .sort((a, b) => (b.metrics?.comments || 0) - (a.metrics?.comments || 0))
      .slice(0, 5);

    // Performance by Category
    const categoryStatsMap: Record<string, { count: number; published: number; impressions: number; interactions: number }> = {};

    allPosts.forEach((p) => {
      if (!categoryStatsMap[p.category]) {
        categoryStatsMap[p.category] = { count: 0, published: 0, impressions: 0, interactions: 0 };
      }
      categoryStatsMap[p.category].count += 1;
      if (p.status === ContentStatus.PUBLISHED) {
        categoryStatsMap[p.category].published += 1;
      }
    });

    enrichedPosts.forEach((p) => {
      if (categoryStatsMap[p.category] && p.metrics) {
        categoryStatsMap[p.category].impressions += p.metrics.impressions || 0;
        categoryStatsMap[p.category].interactions +=
          (p.metrics.reactions || 0) +
          (p.metrics.comments || 0) +
          (p.metrics.reposts || 0) +
          (p.metrics.clicks || 0);
      }
    });

    const categoryBreakdown = Object.entries(categoryStatsMap).map(([cat, stat]) => ({
      category: cat,
      postCount: stat.count,
      publishedCount: stat.published,
      totalImpressions: stat.impressions,
      totalInteractions: stat.interactions,
      avgEngagementRate: calculateEngagementRate(stat.impressions, stat.interactions, 0, 0, 0),
    }));

    res.json({
      period,
      startDate: formatDateKey(startDate),
      endDate: formatDateKey(endDate),
      totalPosts: allPosts.length,
      postsByStatus,
      postsByCategory,
      publishedPostsCount: publishedPostsInPeriod.length,
      totalImpressions,
      totalReactions,
      totalComments,
      totalReposts,
      totalClicks,
      avgEngagementRate,
      avgImpressionsPerPost,
      topPostsByImpressions,
      topPostsByEngagementRate,
      topPostsByComments,
      categoryBreakdown,
      comparison: {
        impressions: calculateMetricComparison(totalImpressions, prevImpressions),
        interactions: calculateMetricComparison(totalInteractions, prevInteractions),
        postsPublished: calculateMetricComparison(publishedPostsInPeriod.length, prevPublishedPostsInPeriod.length),
        avgEngagementRate: calculateMetricComparison(avgEngagementRate || 0, prevAvgEngagementRate || 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/content/trends (Time series aggregation for content)
analyticsRouter.get('/content/trends', validateQuery(analyticsTrendsQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period, startDate: customStart, endDate: customEnd, groupBy, category } = req.query as any;
    const { startDate, endDate } = getDateRangeForPeriod(period, customStart, customEnd);

    const whereCategory = category ? { category } : {};

    const [metrics, publishedPosts] = await Promise.all([
      prisma.contentMetric.findMany({
        where: {
          recordedAt: { gte: startDate, lte: endDate },
          post: whereCategory,
        },
        orderBy: { recordedAt: 'asc' },
      }),
      prisma.contentPost.findMany({
        where: {
          ...whereCategory,
          status: ContentStatus.PUBLISHED,
          publishedAt: { gte: startDate, lte: endDate },
        },
        orderBy: { publishedAt: 'asc' },
      }),
    ]);

    const buckets: Record<string, {
      postsPublished: number;
      impressions: number;
      reactions: number;
      comments: number;
      reposts: number;
      clicks: number;
    }> = {};

    publishedPosts.forEach((p) => {
      if (p.publishedAt) {
        const key = formatBucketKey(new Date(p.publishedAt), groupBy);
        if (!buckets[key]) {
          buckets[key] = { postsPublished: 0, impressions: 0, reactions: 0, comments: 0, reposts: 0, clicks: 0 };
        }
        buckets[key].postsPublished += 1;
      }
    });

    metrics.forEach((m) => {
      const key = formatBucketKey(new Date(m.recordedAt), groupBy);
      if (!buckets[key]) {
        buckets[key] = { postsPublished: 0, impressions: 0, reactions: 0, comments: 0, reposts: 0, clicks: 0 };
      }
      buckets[key].impressions += m.impressions || 0;
      buckets[key].reactions += m.reactions || 0;
      buckets[key].comments += m.comments || 0;
      buckets[key].reposts += m.reposts || 0;
      buckets[key].clicks += m.clicks || 0;
    });

    // Format sorted array
    const sortedKeys = Object.keys(buckets).sort();
    const trendPoints = sortedKeys.map((date) => {
      const b = buckets[date];
      const totalInteractions = b.reactions + b.comments + b.reposts + b.clicks;
      const rate = calculateEngagementRate(b.impressions, totalInteractions, 0, 0, 0);
      return {
        date,
        postsPublished: b.postsPublished,
        impressions: b.impressions,
        reactions: b.reactions,
        comments: b.comments,
        reposts: b.reposts,
        clicks: b.clicks,
        engagementRate: rate,
      };
    });

    res.json(trendPoints);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/networking (Deep dive networking analytics)
analyticsRouter.get('/networking', validateQuery(analyticsQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period, startDate: customStart, endDate: customEnd } = req.query as any;
    const { startDate, endDate, prevStartDate, prevEndDate } = getDateRangeForPeriod(
      period,
      customStart,
      customEnd
    );

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000);

    const [
      allContacts,
      contactsInPeriod,
      prevContactsInPeriod,
      interactionsInPeriod,
      prevInteractionsInPeriod,
      messages,
    ] = await Promise.all([
      prisma.networkingContact.findMany(),
      prisma.networkingContact.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.networkingContact.findMany({
        where: { createdAt: { gte: prevStartDate, lte: prevEndDate } },
      }),
      prisma.networkingContact.findMany({
        where: { lastInteractionAt: { gte: startDate, lte: endDate } },
      }),
      prisma.networkingContact.findMany({
        where: { lastInteractionAt: { gte: prevStartDate, lte: prevEndDate } },
      }),
      prisma.networkingMessage.findMany(),
    ]);

    const contactsByStatus: Record<string, number> = {};
    const contactsByCategory: Record<string, number> = {};
    const contactsBySource: Record<string, number> = {};

    let followUpsDueToday = 0;
    let followUpsOverdue = 0;
    let followUpsUpcoming7Days = 0;
    let followUpsCompleted = 0;
    let contactedCount = 0;
    let responseCount = 0;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    allContacts.forEach((c) => {
      contactsByStatus[c.status] = (contactsByStatus[c.status] || 0) + 1;
      contactsByCategory[c.category] = (contactsByCategory[c.category] || 0) + 1;
      contactsBySource[c.source] = (contactsBySource[c.source] || 0) + 1;

      if (c.lastInteractionAt) {
        followUpsCompleted += 1;
      }

      if (c.nextFollowUpAt) {
        const fDate = new Date(c.nextFollowUpAt);
        if (fDate < startOfToday) {
          followUpsOverdue += 1;
        } else if (fDate <= endOfDay) {
          followUpsDueToday += 1;
        } else if (fDate <= sevenDaysFromNow) {
          followUpsUpcoming7Days += 1;
        }
      }

      if (['CONTACTED', 'REPLIED', 'FOLLOW_UP', 'CONNECTED'].includes(c.status)) {
        contactedCount += 1;
      }
      if (['REPLIED', 'CONNECTED'].includes(c.status)) {
        responseCount += 1;
      }
    });

    const responseRate = contactedCount > 0
      ? Math.round((responseCount / contactedCount) * 100 * 10) / 10
      : null;

    res.json({
      period,
      startDate: formatDateKey(startDate),
      endDate: formatDateKey(endDate),
      totalContacts: allContacts.length,
      contactsByStatus,
      contactsByCategory,
      contactsBySource,
      contactsAddedInPeriod: contactsInPeriod.length,
      interactionsInPeriod: interactionsInPeriod.length,
      followUpsDueToday,
      followUpsOverdue,
      followUpsUpcoming7Days,
      followUpsCompleted,
      connectionRequestsCount: messages.length,
      responseCount,
      responseRate,
      comparison: {
        contactsAdded: calculateMetricComparison(contactsInPeriod.length, prevContactsInPeriod.length),
        interactions: calculateMetricComparison(interactionsInPeriod.length, prevInteractionsInPeriod.length),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/networking/trends (Networking trends over time)
analyticsRouter.get('/networking/trends', validateQuery(analyticsTrendsQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period, startDate: customStart, endDate: customEnd, groupBy } = req.query as any;
    const { startDate, endDate } = getDateRangeForPeriod(period, customStart, customEnd);

    const [contacts, interactions, messages] = await Promise.all([
      prisma.networkingContact.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
      }),
      prisma.networkingContact.findMany({
        where: { lastInteractionAt: { gte: startDate, lte: endDate } },
        select: { lastInteractionAt: true },
      }),
      prisma.networkingMessage.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
      }),
    ]);

    const buckets: Record<string, { contactsAdded: number; interactionsLogged: number; connectionRequestsDrafted: number }> = {};

    contacts.forEach((c) => {
      const key = formatBucketKey(new Date(c.createdAt), groupBy);
      if (!buckets[key]) buckets[key] = { contactsAdded: 0, interactionsLogged: 0, connectionRequestsDrafted: 0 };
      buckets[key].contactsAdded += 1;
    });

    interactions.forEach((i) => {
      if (i.lastInteractionAt) {
        const key = formatBucketKey(new Date(i.lastInteractionAt), groupBy);
        if (!buckets[key]) buckets[key] = { contactsAdded: 0, interactionsLogged: 0, connectionRequestsDrafted: 0 };
        buckets[key].interactionsLogged += 1;
      }
    });

    messages.forEach((m) => {
      const key = formatBucketKey(new Date(m.createdAt), groupBy);
      if (!buckets[key]) buckets[key] = { contactsAdded: 0, interactionsLogged: 0, connectionRequestsDrafted: 0 };
      buckets[key].connectionRequestsDrafted += 1;
    });

    const sortedKeys = Object.keys(buckets).sort();
    const trendPoints = sortedKeys.map((date) => ({
      date,
      contactsAdded: buckets[date].contactsAdded,
      interactionsLogged: buckets[date].interactionsLogged,
      connectionRequestsDrafted: buckets[date].connectionRequestsDrafted,
    }));

    res.json(trendPoints);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/leads (Deep dive freelance leads analytics)
analyticsRouter.get('/leads', validateQuery(analyticsQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period, startDate: customStart, endDate: customEnd } = req.query as any;
    const { startDate, endDate, prevStartDate, prevEndDate } = getDateRangeForPeriod(
      period,
      customStart,
      customEnd
    );

    const [allLeads, currentLeads, prevLeads] = await Promise.all([
      prisma.lead.findMany(),
      prisma.lead.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.lead.findMany({
        where: { createdAt: { gte: prevStartDate, lte: prevEndDate } },
      }),
    ]);

    const leadsByStatus: Record<string, number> = {};
    const leadsBySource: Record<string, number> = {};
    const leadsByServiceFit: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };

    let totalScore = 0;
    let qualifiedLeadsCount = 0;
    let contactedLeadsCount = 0;

    allLeads.forEach((lead) => {
      leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;
      leadsBySource[lead.source] = (leadsBySource[lead.source] || 0) + 1;
      totalScore += lead.qualificationScore || 0;

      if (['QUALIFIED', 'OUTREACH_DRAFT', 'CONTACTED', 'REPLIED', 'MEETING', 'PROPOSAL', 'WON'].includes(lead.status)) {
        qualifiedLeadsCount += 1;
      }
      if (['CONTACTED', 'REPLIED', 'MEETING', 'PROPOSAL', 'WON'].includes(lead.status)) {
        contactedLeadsCount += 1;
      }

      if (lead.qualificationBreakdown && typeof lead.qualificationBreakdown === 'object') {
        const fit = (lead.qualificationBreakdown as any).serviceFit;
        if (fit && leadsByServiceFit[fit] !== undefined) {
          leadsByServiceFit[fit] += 1;
        }
      }
    });

    const avgQualificationScore = allLeads.length > 0 ? Math.round(totalScore / allLeads.length) : 0;

    // Pipeline funnel calculations
    const funnelStages = [
      { status: 'DISCOVERED', count: allLeads.length, percentageOfTotal: 100 },
      {
        status: 'QUALIFIED',
        count: qualifiedLeadsCount,
        percentageOfTotal: allLeads.length > 0 ? Math.round((qualifiedLeadsCount / allLeads.length) * 100) : 0,
      },
      {
        status: 'CONTACTED',
        count: contactedLeadsCount,
        percentageOfTotal: allLeads.length > 0 ? Math.round((contactedLeadsCount / allLeads.length) * 100) : 0,
      },
      {
        status: 'REPLIED / MEETING',
        count: (leadsByStatus['REPLIED'] || 0) + (leadsByStatus['MEETING'] || 0) + (leadsByStatus['PROPOSAL'] || 0) + (leadsByStatus['WON'] || 0),
        percentageOfTotal: allLeads.length > 0
          ? Math.round((((leadsByStatus['REPLIED'] || 0) + (leadsByStatus['MEETING'] || 0) + (leadsByStatus['PROPOSAL'] || 0) + (leadsByStatus['WON'] || 0)) / allLeads.length) * 100)
          : 0,
      },
      {
        status: 'WON',
        count: leadsByStatus['WON'] || 0,
        percentageOfTotal: allLeads.length > 0 ? Math.round(((leadsByStatus['WON'] || 0) / allLeads.length) * 100) : 0,
      },
    ];

    res.json({
      period,
      startDate: formatDateKey(startDate),
      endDate: formatDateKey(endDate),
      totalLeads: allLeads.length,
      leadsByStatus,
      leadsBySource,
      leadsByServiceFit,
      leadsCreatedInPeriod: currentLeads.length,
      qualifiedLeadsCount,
      contactedLeadsCount,
      avgQualificationScore,
      pipelineFunnel: funnelStages,
      comparison: {
        leadsCreated: calculateMetricComparison(currentLeads.length, prevLeads.length),
        leadsQualified: calculateMetricComparison(
          currentLeads.filter((l) => l.status === 'QUALIFIED').length,
          prevLeads.filter((l) => l.status === 'QUALIFIED').length
        ),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/leads/trends (Leads trends over time)
analyticsRouter.get('/leads/trends', validateQuery(analyticsTrendsQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period, startDate: customStart, endDate: customEnd, groupBy } = req.query as any;
    const { startDate, endDate } = getDateRangeForPeriod(period, customStart, customEnd);

    const leads = await prisma.lead.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true, status: true },
    });

    const buckets: Record<string, { leadsCreated: number; leadsQualified: number; leadsContacted: number }> = {};

    leads.forEach((l) => {
      const key = formatBucketKey(new Date(l.createdAt), groupBy);
      if (!buckets[key]) buckets[key] = { leadsCreated: 0, leadsQualified: 0, leadsContacted: 0 };
      buckets[key].leadsCreated += 1;
      if (l.status === 'QUALIFIED') buckets[key].leadsQualified += 1;
      if (l.status === 'CONTACTED') buckets[key].leadsContacted += 1;
    });

    const sortedKeys = Object.keys(buckets).sort();
    const trendPoints = sortedKeys.map((date) => ({
      date,
      leadsCreated: buckets[date].leadsCreated,
      leadsQualified: buckets[date].leadsQualified,
      leadsContacted: buckets[date].leadsContacted,
    }));

    res.json(trendPoints);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/internships (Deep dive internships analytics)
analyticsRouter.get('/internships', validateQuery(analyticsQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period, startDate: customStart, endDate: customEnd } = req.query as any;
    const { startDate, endDate, prevStartDate, prevEndDate } = getDateRangeForPeriod(
      period,
      customStart,
      customEnd
    );

    const [allInternships, currentInternships, prevInternships] = await Promise.all([
      prisma.internship.findMany(),
      prisma.internship.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.internship.findMany({
        where: { createdAt: { gte: prevStartDate, lte: prevEndDate } },
      }),
    ]);

    const opportunitiesByStatus: Record<string, number> = {};
    const opportunitiesBySource: Record<string, number> = {};
    const companyCountMap: Record<string, number> = {};

    let totalScore = 0;
    let highMatchCount = 0;

    const now = new Date();
    const thirtyDaysAhead = new Date(Date.now() + 30 * 86400000);

    const upcomingDeadlines = allInternships
      .filter((i) => i.deadline && new Date(i.deadline) >= now && new Date(i.deadline) <= thirtyDaysAhead)
      .sort((a, b) => (a.deadline && b.deadline ? new Date(a.deadline).getTime() - new Date(b.deadline).getTime() : 0));

    allInternships.forEach((item) => {
      opportunitiesByStatus[item.status] = (opportunitiesByStatus[item.status] || 0) + 1;
      opportunitiesBySource[item.source] = (opportunitiesBySource[item.source] || 0) + 1;
      companyCountMap[item.company] = (companyCountMap[item.company] || 0) + 1;

      totalScore += item.matchScore || 0;
      if (item.matchScore >= 80) {
        highMatchCount += 1;
      }
    });

    const opportunitiesByCompany = Object.entries(companyCountMap)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const avgMatchScore = allInternships.length > 0 ? Math.round(totalScore / allInternships.length) : 0;

    res.json({
      period,
      startDate: formatDateKey(startDate),
      endDate: formatDateKey(endDate),
      totalOpportunities: allInternships.length,
      opportunitiesByStatus,
      opportunitiesBySource,
      opportunitiesByCompany,
      opportunitiesAddedInPeriod: currentInternships.length,
      avgMatchScore,
      highMatchCount,
      upcomingDeadlines,
      comparison: {
        opportunitiesDiscovered: calculateMetricComparison(currentInternships.length, prevInternships.length),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/internships/trends (Internship discovery trends over time)
analyticsRouter.get('/internships/trends', validateQuery(analyticsTrendsQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period, startDate: customStart, endDate: customEnd, groupBy } = req.query as any;
    const { startDate, endDate } = getDateRangeForPeriod(period, customStart, customEnd);

    const items = await prisma.internship.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
    });

    const buckets: Record<string, number> = {};

    items.forEach((item) => {
      const key = formatBucketKey(new Date(item.createdAt), groupBy);
      buckets[key] = (buckets[key] || 0) + 1;
    });

    const sortedKeys = Object.keys(buckets).sort();
    const trendPoints = sortedKeys.map((date) => ({
      date,
      opportunitiesDiscovered: buckets[date],
    }));

    res.json(trendPoints);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/snapshots (Preserved for backward compatibility)
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

// GET /api/analytics/content-performance (Preserved for backward compatibility)
analyticsRouter.get('/content-performance', async (_req: Request, res: Response, next: NextFunction) => {
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

    const sortedByImpressions = [...enrichedPosts].sort(
      (a, b) => (b.metrics?.impressions || 0) - (a.metrics?.impressions || 0)
    );

    const sortedByEngagementRate = [...enrichedPosts].sort(
      (a, b) => (b.metrics?.engagementRate || 0) - (a.metrics?.engagementRate || 0)
    );

    const sortedByComments = [...enrichedPosts].sort(
      (a, b) => (b.metrics?.comments || 0) - (a.metrics?.comments || 0)
    );

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

