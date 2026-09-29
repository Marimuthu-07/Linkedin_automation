import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@linkedin-growth/database';
import { calculateEngagementRate } from '@linkedin-growth/shared';

export const dashboardRouter = Router();

dashboardRouter.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Parallel aggregate queries
    const [
      peopleToReviewCount,
      draftMessagesCount,
      followUpsDueCount,
      totalActiveContacts,
      draftPostsCount,
      scheduledPostsCount,
      recentPublishedCount,
      ideasCount,
      upcomingPosts,
      newLeadsCount,
      qualifiedLeadsCount,
      leadFollowUpsCount,
      totalActiveLeads,
      newOpportunitiesCount,
      highMatchCount,
      upcomingDeadlinesCount,
      topMatches,
      latestSnapshot,
      snapshots30d,
      posts30dMetrics,
      todayActions,
      recentNotifications,
    ] = await Promise.all([
      // Networking
      prisma.networkingContact.count({ where: { status: { in: ['DISCOVERED', 'REVIEWING'] } } }),
      prisma.networkingContact.count({ where: { messageDraft: { not: null }, status: 'APPROVED' } }),
      prisma.networkingContact.count({ where: { nextFollowUpAt: { lte: endOfDay }, status: { in: ['FOLLOW_UP', 'REPLIED', 'CONTACTED'] } } }),
      prisma.networkingContact.count({ where: { status: { not: 'ARCHIVED' } } }),

      // Content
      prisma.contentPost.count({ where: { status: 'DRAFT' } }),
      prisma.contentPost.count({ where: { status: 'SCHEDULED' } }),
      prisma.contentPost.count({ where: { status: 'PUBLISHED' } }),
      prisma.contentPost.count({ where: { status: 'IDEA' } }),
      prisma.contentPost.findMany({
        where: { status: { in: ['SCHEDULED', 'APPROVED', 'REVIEW', 'DRAFT'] } },
        orderBy: [{ scheduledAt: 'asc' }, { updatedAt: 'desc' }],
        take: 3,
        include: { metrics: true },
      }),

      // Leads
      prisma.lead.count({ where: { status: 'DISCOVERED' } }),
      prisma.lead.count({ where: { status: 'QUALIFIED' } }),
      prisma.lead.count({
        where: {
          OR: [
            { nextFollowUpAt: { lte: endOfDay }, status: { notIn: ['WON', 'LOST', 'ARCHIVED'] } },
            { status: { in: ['OUTREACH_DRAFT', 'CONTACTED', 'REPLIED', 'MEETING', 'PROPOSAL'] } },
          ],
        },
      }),
      prisma.lead.count({ where: { status: { notIn: ['WON', 'LOST', 'ARCHIVED'] } } }),

      // Internships
      prisma.internship.count({ where: { status: 'NEW' } }),
      prisma.internship.count({ where: { matchScore: { gte: 80 }, status: { in: ['NEW', 'REVIEWING', 'SAVED', 'INTERESTED'] } } }),
      prisma.internship.count({ where: { deadline: { lte: new Date(Date.now() + 14 * 86400000), gte: now } } }),
      prisma.internship.findMany({
        where: { status: { in: ['NEW', 'SAVED', 'INTERESTED', 'REVIEWING'] } },
        orderBy: { matchScore: 'desc' },
        take: 3,
      }),

      // Analytics
      prisma.analyticsSnapshot.findFirst({ orderBy: { date: 'desc' } }),
      prisma.analyticsSnapshot.findMany({
        orderBy: { date: 'desc' },
        take: 30,
      }),
      prisma.contentMetric.aggregate({
        _sum: {
          impressions: true,
          reactions: true,
          comments: true,
          reposts: true,
          clicks: true,
        },
        _count: true,
      }),

      // Today's actions & tasks
      prisma.task.findMany({
        where: {
          status: { not: 'DONE' },
        },
        orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }],
        take: 6,
      }),

      // Notifications
      prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Calculate aggregated 30d analytics metrics
    const total30dImpressions = snapshots30d.reduce((sum: number, s: any) => sum + s.impressions, 0);
    const total30dInteractions = snapshots30d.reduce((sum: number, s: any) => sum + s.reactions + s.comments + s.reposts + s.clicks, 0);
    const total30dProfileViews = snapshots30d.reduce((sum: number, s: any) => sum + s.profileViews, 0);
    const avgEngagement = calculateEngagementRate(total30dImpressions, total30dInteractions, 0, 0, 0);

    res.json({
      networking: {
        peopleToReviewCount,
        draftMessagesCount,
        followUpsDueCount,
        totalActiveContacts,
      },
      content: {
        draftPostsCount,
        scheduledPostsCount,
        recentPublishedCount,
        ideasCount,
        upcomingPosts,
      },
      leads: {
        newLeadsCount,
        qualifiedLeadsCount,
        followUpsCount: leadFollowUpsCount,
        totalActiveLeads,
      },
      internships: {
        newOpportunitiesCount,
        highMatchCount,
        upcomingDeadlinesCount,
        topMatches,
      },
      analytics: {
        currentFollowers: latestSnapshot?.followers || 0,
        currentConnections: latestSnapshot?.connections || 0,
        totalImpressions30d: total30dImpressions,
        avgEngagementRate30d: avgEngagement,
        profileViews30d: total30dProfileViews,
        postsPublished30d: recentPublishedCount,
        latestSnapshot,
      },
      todayActions,
      recentNotifications,
    });
  } catch (error) {
    next(error);
  }
});
