import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@linkedin-growth/database';
import {
  ContentStatus,
  ContentCategory,
  NotificationType,
  TaskType,
  TaskPriority,
  TaskStatus,
  createContentPostSchema,
  updateContentPostSchema,
  updateContentStatusSchema,
  publishRecordSchema,
  createContentMetricsSchema,
  generateLinkedInPostInputSchema,
  generateLinkedInPostOutputSchema,
  generateHooksInputSchema,
  generateHooksOutputSchema,
  generateCtaInputSchema,
  generateCtaOutputSchema,
  generateHashtagsInputSchema,
  generateHashtagsOutputSchema,
  VALID_CONTENT_TRANSITIONS,
  isValidContentStatusTransition,
  calculateEngagementRate,
} from '@linkedin-growth/shared';
import { validateBody } from '../middlewares/validate.js';
import { getAIProvider } from '../ai/factory.js';

export const contentRouter = Router();

// GET /api/content/stats
contentRouter.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalPosts,
      ideasCount,
      draftsCount,
      reviewCount,
      approvedCount,
      scheduledCount,
      publishedCount,
      archivedCount,
      allMetrics,
    ] = await Promise.all([
      prisma.contentPost.count(),
      prisma.contentPost.count({ where: { status: ContentStatus.IDEA } }),
      prisma.contentPost.count({ where: { status: ContentStatus.DRAFT } }),
      prisma.contentPost.count({ where: { status: ContentStatus.REVIEW } }),
      prisma.contentPost.count({ where: { status: ContentStatus.APPROVED } }),
      prisma.contentPost.count({ where: { status: ContentStatus.SCHEDULED } }),
      prisma.contentPost.count({ where: { status: ContentStatus.PUBLISHED } }),
      prisma.contentPost.count({ where: { status: ContentStatus.ARCHIVED } }),
      prisma.contentMetric.findMany({
        select: { impressions: true, engagementRate: true },
      }),
    ]);

    let totalImpressions = 0;
    let validEngagementRates: number[] = [];

    allMetrics.forEach((m) => {
      totalImpressions += m.impressions || 0;
      if (m.engagementRate !== null && m.engagementRate !== undefined) {
        validEngagementRates.push(m.engagementRate);
      }
    });

    const avgImpressions = publishedCount > 0 ? Math.round(totalImpressions / publishedCount) : 0;
    const avgEngagementRate =
      validEngagementRates.length > 0
        ? Math.round(
            (validEngagementRates.reduce((acc, curr) => acc + curr, 0) / validEngagementRates.length) * 100
          ) / 100
        : null;

    res.json({
      totalPosts,
      ideasCount,
      draftsCount,
      reviewCount,
      approvedCount,
      scheduledCount,
      publishedCount,
      archivedCount,
      avgImpressions,
      avgEngagementRate,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/content
contentRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      category,
      search,
      scheduled,
      published,
      startDate,
      endDate,
      page: rawPage,
      limit: rawLimit,
    } = req.query;

    const page = Math.max(1, parseInt(rawPage as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(rawLimit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    if (category && typeof category === 'string' && category !== 'ALL') {
      where.category = category;
    }

    if (scheduled === 'true') {
      where.OR = [
        { status: ContentStatus.SCHEDULED },
        { scheduledAt: { not: null } },
      ];
    } else if (scheduled === 'false') {
      where.status = { not: ContentStatus.SCHEDULED };
      where.scheduledAt = null;
    }

    if (published === 'true') {
      where.status = ContentStatus.PUBLISHED;
    } else if (published === 'false') {
      where.status = { not: ContentStatus.PUBLISHED };
    }

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate && typeof startDate === 'string') {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        dateFilter.lte = new Date(endDate);
      }
      where.OR = [
        { scheduledAt: dateFilter },
        { publishedAt: dateFilter },
      ];
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { hook: { contains: q, mode: 'insensitive' } },
        { body: { contains: q, mode: 'insensitive' } },
        { idea: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
        { sourceContext: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
        { hashtags: { has: q } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.contentPost.count({ where }),
      prisma.contentPost.findMany({
        where,
        include: {
          metrics: {
            orderBy: { recordedAt: 'desc' },
          },
          revisions: {
            orderBy: { revisionNumber: 'desc' },
          },
        },
        orderBy: [{ scheduledAt: 'asc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    // Attach computed latestMetrics for convenience
    const enrichedItems = items.map((item) => {
      const latestMetrics = item.metrics && item.metrics.length > 0 ? item.metrics[0] : null;
      return {
        ...item,
        latestMetrics,
      };
    });

    res.json({
      items: enrichedItems,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/content/:id
contentRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const post = await prisma.contentPost.findUnique({
      where: { id },
      include: {
        metrics: {
          orderBy: { recordedAt: 'desc' },
        },
        revisions: {
          orderBy: { revisionNumber: 'desc' },
        },
      },
    });

    if (!post) {
      res.status(404).json({ error: 'Not Found', message: 'Content post not found' });
      return;
    }

    const latestMetrics = post.metrics && post.metrics.length > 0 ? post.metrics[0] : null;

    res.json({
      ...post,
      latestMetrics,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/content
contentRouter.post('/', validateBody(createContentPostSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;

    const title = (data.title && data.title.trim())
      ? data.title.trim()
      : (data.idea && data.idea.trim().split('\n')[0].slice(0, 100)) || 'Untitled Post Idea';

    const hashtags = data.hashtags && data.hashtags.length > 0 ? data.hashtags : data.tags || [];
    const tags = data.tags && data.tags.length > 0 ? data.tags : hashtags;

    const post = await prisma.contentPost.create({
      data: {
        title,
        idea: data.idea || null,
        hook: data.hook || '',
        body: data.body || '',
        cta: data.cta || null,
        category: data.category || ContentCategory.SOFTWARE_ENGINEERING,
        status: data.status || ContentStatus.IDEA,
        targetAudience: data.targetAudience || 'Software Engineers & Technical Leads',
        tone: data.tone || 'AUTHENTIC_TECHNICAL',
        sourceContext: data.sourceContext || null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        publishedManually: Boolean(data.publishedManually),
        externalPostUrl: data.externalPostUrl || null,
        hashtags,
        tags,
        notes: data.notes || null,
        alternativeHooks: data.alternativeHooks || [],
        revisionCount: 1,
        revisions: {
          create: {
            title,
            hook: data.hook || '',
            body: data.body || '',
            cta: data.cta || null,
            hashtags,
            revisionNumber: 1,
            createdBy: 'USER',
          },
        },
      },
      include: {
        metrics: true,
        revisions: true,
      },
    });

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/content/:id
contentRouter.patch('/:id', validateBody(updateContentPostSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.contentPost.findUnique({
      where: { id },
      include: { revisions: { orderBy: { revisionNumber: 'desc' } } },
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Content post not found' });
      return;
    }

    const data = req.body;

    // Validate status transition if status is being updated
    if (data.status && data.status !== existing.status) {
      const isAllowed = isValidContentStatusTransition(
        existing.status as ContentStatus,
        data.status as ContentStatus
      );

      if (!isAllowed) {
        const allowed = VALID_CONTENT_TRANSITIONS[existing.status as ContentStatus] || [];
        res.status(400).json({
          error: 'Invalid content status transition',
          message: `Cannot transition content post from ${existing.status} to ${data.status}. Allowed transitions: ${allowed.join(', ')}`,
          currentStatus: existing.status,
          attemptedStatus: data.status,
          allowedTransitions: allowed,
        });
        return;
      }
    }

    const updateData: any = { ...data };
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    }
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    }

    // Check if content fields changed to trigger a new revision
    const contentChanged =
      (data.title !== undefined && data.title !== existing.title) ||
      (data.hook !== undefined && data.hook !== existing.hook) ||
      (data.body !== undefined && data.body !== existing.body) ||
      (data.cta !== undefined && data.cta !== existing.cta);

    let nextRevNumber = existing.revisionCount || 1;
    if (contentChanged) {
      nextRevNumber += 1;
      updateData.revisionCount = nextRevNumber;
    }

    const updated = await prisma.contentPost.update({
      where: { id },
      data: {
        ...updateData,
        ...(contentChanged
          ? {
              revisions: {
                create: {
                  title: data.title !== undefined ? data.title : existing.title,
                  hook: data.hook !== undefined ? data.hook : existing.hook,
                  body: data.body !== undefined ? data.body : existing.body,
                  cta: data.cta !== undefined ? data.cta : existing.cta,
                  hashtags: data.hashtags || existing.hashtags || [],
                  revisionNumber: nextRevNumber,
                  createdBy: 'USER',
                },
              },
            }
          : {}),
      },
      include: {
        metrics: { orderBy: { recordedAt: 'desc' } },
        revisions: { orderBy: { revisionNumber: 'desc' } },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/content/:id
contentRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.contentPost.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Content post not found' });
      return;
    }

    await prisma.contentPost.delete({
      where: { id },
    });

    res.json({ message: 'Content post deleted successfully', id });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/content/:id/status
contentRouter.patch('/:id/status', validateBody(updateContentStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status: targetStatus, externalPostUrl, publishedAt } = req.body;

    const existing = await prisma.contentPost.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Content post not found' });
      return;
    }

    const isAllowed = isValidContentStatusTransition(
      existing.status as ContentStatus,
      targetStatus as ContentStatus
    );

    if (!isAllowed) {
      const allowed = VALID_CONTENT_TRANSITIONS[existing.status as ContentStatus] || [];
      res.status(400).json({
        error: 'Invalid content status transition',
        message: `Cannot transition content post from ${existing.status} to ${targetStatus}. Allowed transitions: ${allowed.join(', ')}`,
        currentStatus: existing.status,
        attemptedStatus: targetStatus,
        allowedTransitions: allowed,
      });
      return;
    }

    const updateData: any = {
      status: targetStatus,
    };

    if (externalPostUrl !== undefined) {
      updateData.externalPostUrl = externalPostUrl;
    }

    if (targetStatus === ContentStatus.PUBLISHED) {
      updateData.publishedAt = publishedAt ? new Date(publishedAt) : new Date();
      updateData.publishedManually = true;

      // Create metric logging reminder task
      await prisma.task.create({
        data: {
          title: `Record post metrics: "${existing.title.slice(0, 40)}"`,
          description: 'Record initial 24h-48h reach, impressions, reactions, and comments from LinkedIn.',
          type: TaskType.CONTENT,
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.TODO,
          dueAt: new Date(Date.now() + 24 * 3600000),
          relatedEntityType: 'CONTENT',
          relatedEntityId: existing.id,
        },
      });

      // Notification for publish completion
      await prisma.notification.create({
        data: {
          type: NotificationType.CONTENT_METRICS_DUE,
          title: 'Post Published',
          message: `Post "${existing.title.slice(0, 50)}" is marked as published. Remember to record performance metrics later!`,
          linkUrl: '/content',
          relatedEntityType: 'CONTENT',
          relatedEntityId: existing.id,
        },
      });
    } else if (targetStatus === ContentStatus.SCHEDULED) {
      // Create task and notification
      await prisma.task.create({
        data: {
          title: `Publish scheduled post: "${existing.title.slice(0, 40)}"`,
          description: `Post is internally scheduled for ${existing.scheduledAt ? new Date(existing.scheduledAt).toLocaleString() : 'manual publication'}. Open LinkedIn and paste the draft manually.`,
          type: TaskType.CONTENT,
          priority: TaskPriority.HIGH,
          status: TaskStatus.TODO,
          dueAt: existing.scheduledAt || new Date(),
          relatedEntityType: 'CONTENT',
          relatedEntityId: existing.id,
        },
      });

      await prisma.notification.create({
        data: {
          type: NotificationType.CONTENT_SCHEDULED,
          title: 'Post Scheduled (Manual Publish Required)',
          message: `"${existing.title.slice(0, 50)}" scheduled for ${existing.scheduledAt ? new Date(existing.scheduledAt).toLocaleDateString() : 'publication'}. You will publish it manually in the LinkedIn interface.`,
          linkUrl: '/content',
          relatedEntityType: 'CONTENT',
          relatedEntityId: existing.id,
        },
      });
    } else if (targetStatus === ContentStatus.REVIEW) {
      await prisma.task.create({
        data: {
          title: `Review content draft: "${existing.title.slice(0, 40)}"`,
          description: 'Review hook, body tone, and CTA clarity before approving.',
          type: TaskType.CONTENT,
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.TODO,
          relatedEntityType: 'CONTENT',
          relatedEntityId: existing.id,
        },
      });

      await prisma.notification.create({
        data: {
          type: NotificationType.CONTENT_REVIEW,
          title: 'Draft Awaiting Review',
          message: `"${existing.title.slice(0, 50)}" is ready for your editorial review.`,
          linkUrl: '/content',
          relatedEntityType: 'CONTENT',
          relatedEntityId: existing.id,
        },
      });
    }

    const updated = await prisma.contentPost.update({
      where: { id },
      data: updateData,
      include: {
        metrics: { orderBy: { recordedAt: 'desc' } },
        revisions: { orderBy: { revisionNumber: 'desc' } },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// POST /api/content/:id/generate (Generate draft for existing post)
contentRouter.post('/:id/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const post = await prisma.contentPost.findUnique({
      where: { id },
    });

    if (!post) {
      res.status(404).json({ error: 'Not Found', message: 'Content post not found' });
      return;
    }

    const ai = getAIProvider();
    const prompt = `Generate a high-quality, authentic technical LinkedIn post based on:
Idea: ${post.idea || post.title}
Topic: ${post.title}
Category: ${post.category}
Target Audience: ${post.targetAudience || 'Software Engineers & Technical Leads'}
Tone: ${post.tone || 'AUTHENTIC_TECHNICAL'}
Source Context: ${post.sourceContext || 'Personal software engineering project'}
Length: ${req.body?.desiredLength || 'MEDIUM'}

STRICT ANTI-HALLUCINATION & AUTHENTICITY GUIDELINES:
- Personalize ONLY from verified facts and context provided above.
- NEVER invent fake metrics, fake customer stats, fake certifications, or fake company achievements.
- Sound like an authentic developer/student writing practical insights.
- Provide a compelling opening hook, clean structured body, actionable non-manipulative CTA, 3-5 hashtags, and 2-3 alternative hooks.`;

    const generated = await ai.generateStructured<any>(
      prompt,
      generateLinkedInPostOutputSchema,
      'You are a senior technical writer crafting authentic, grounded LinkedIn posts for software engineers.'
    );

    const nextRev = (post.revisionCount || 1) + 1;

    // Create revision preserving previous content
    await prisma.contentRevision.create({
      data: {
        contentPostId: post.id,
        title: generated.title || post.title,
        hook: generated.hook,
        body: generated.body,
        cta: generated.cta,
        hashtags: generated.hashtags || generated.suggestedHashtags || post.hashtags,
        revisionNumber: nextRev,
        createdBy: 'AI',
      },
    });

    const updatedPost = await prisma.contentPost.update({
      where: { id: post.id },
      data: {
        title: generated.title || post.title,
        hook: generated.hook,
        body: generated.body,
        cta: generated.cta,
        hashtags: generated.hashtags || generated.suggestedHashtags || post.hashtags,
        tags: generated.hashtags || generated.suggestedHashtags || post.tags,
        alternativeHooks: generated.alternativeHooks || post.alternativeHooks,
        status: post.status === ContentStatus.IDEA ? ContentStatus.DRAFT : post.status,
        aiGenerated: true,
        aiProvider: ai.name,
        revisionCount: nextRev,
      },
      include: {
        metrics: { orderBy: { recordedAt: 'desc' } },
        revisions: { orderBy: { revisionNumber: 'desc' } },
      },
    });

    res.json({
      post: updatedPost,
      draft: generated.body,
      generated,
      warnings: generated.warnings || [],
      isLimitedContext: generated.isLimitedContext || false,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/content/:id/regenerate (Side-by-side comparison support)
contentRouter.post('/:id/regenerate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const post = await prisma.contentPost.findUnique({
      where: { id },
      include: { revisions: { orderBy: { revisionNumber: 'desc' } } },
    });

    if (!post) {
      res.status(404).json({ error: 'Not Found', message: 'Content post not found' });
      return;
    }

    const ai = getAIProvider();
    const prompt = `Generate a fresh variation for this LinkedIn post:
Idea: ${post.idea || post.title}
Topic: ${post.title}
Category: ${post.category}
Target Audience: ${post.targetAudience || 'Software Engineers & Technical Leads'}
Tone: ${req.body?.tone || post.tone || 'AUTHENTIC_TECHNICAL'}
Source Context: ${post.sourceContext || 'Personal software engineering project'}
Length: ${req.body?.desiredLength || 'MEDIUM'}

Provide:
- A new hook
- Fresh structured body points
- A new CTA
- Suggested hashtags
- Alternative hooks`;

    const generated = await ai.generateStructured<any>(
      prompt,
      generateLinkedInPostOutputSchema,
      'You are a senior technical writer crafting authentic, grounded LinkedIn posts.'
    );

    const currentVersion = {
      title: post.title,
      hook: post.hook,
      body: post.body,
      cta: post.cta,
      hashtags: post.hashtags,
    };

    const newVersion = {
      title: generated.title || post.title,
      hook: generated.hook,
      body: generated.body,
      cta: generated.cta,
      hashtags: generated.hashtags || generated.suggestedHashtags || post.hashtags,
      alternativeHooks: generated.alternativeHooks || [],
    };

    // If autoApply flag is passed, commit the revision immediately
    if (req.body?.autoApply) {
      const nextRev = (post.revisionCount || 1) + 1;
      await prisma.contentRevision.create({
        data: {
          contentPostId: post.id,
          title: newVersion.title,
          hook: newVersion.hook,
          body: newVersion.body,
          cta: newVersion.cta,
          hashtags: newVersion.hashtags,
          revisionNumber: nextRev,
          createdBy: 'AI',
        },
      });

      const updated = await prisma.contentPost.update({
        where: { id: post.id },
        data: {
          ...newVersion,
          revisionCount: nextRev,
          aiGenerated: true,
          aiProvider: ai.name,
        },
        include: {
          metrics: { orderBy: { recordedAt: 'desc' } },
          revisions: { orderBy: { revisionNumber: 'desc' } },
        },
      });

      res.json({
        currentVersion,
        newVersion,
        post: updated,
        warnings: generated.warnings || [],
        isLimitedContext: generated.isLimitedContext || false,
      });
      return;
    }

    res.json({
      currentVersion,
      newVersion,
      warnings: generated.warnings || [],
      isLimitedContext: generated.isLimitedContext || false,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/content/:id/generate-hooks (Generate 3-5 alternative hooks)
contentRouter.post('/:id/generate-hooks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const post = await prisma.contentPost.findUnique({
      where: { id },
    });

    if (!post) {
      res.status(404).json({ error: 'Not Found', message: 'Content post not found' });
      return;
    }

    const ai = getAIProvider();
    const prompt = `Generate 3 to 5 strong, authentic technical hook variations for:
Topic: ${post.title}
Category: ${post.category}
Body Preview: ${post.body.slice(0, 300)}
Source Context: ${post.sourceContext || 'Technical project experience'}

Hook Styles to consider:
1. Problem-based
2. Lesson-based
3. Contrarian-but-supported
4. Curiosity / Technical observation

Avoid sensational or clickbait hooks. Ground hooks strictly in the topic.`;

    const generated = await ai.generateStructured<any>(
      prompt,
      generateHooksOutputSchema,
      'You are an expert technical editor generating high-converting, honest LinkedIn hooks.'
    );

    // Persist alternative hooks on the post
    const updated = await prisma.contentPost.update({
      where: { id: post.id },
      data: {
        alternativeHooks: generated.hooks,
      },
      include: {
        metrics: { orderBy: { recordedAt: 'desc' } },
        revisions: { orderBy: { revisionNumber: 'desc' } },
      },
    });

    res.json({
      hooks: generated.hooks,
      rationale: generated.rationale,
      post: updated,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/content/:id/generate-cta (Generate CTAs)
contentRouter.post('/:id/generate-cta', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const post = await prisma.contentPost.findUnique({
      where: { id },
    });

    if (!post) {
      res.status(404).json({ error: 'Not Found', message: 'Content post not found' });
      return;
    }

    const ai = getAIProvider();
    const prompt = `Generate 3 thoughtful, non-manipulative call-to-actions (CTAs) for this LinkedIn post:
Topic: ${post.title}
Category: ${post.category}
Body Preview: ${post.body.slice(0, 300)}

Avoid engagement bait like "Comment YES" or "Agree?". Prefer natural discussion starters.`;

    const generated = await ai.generateStructured<any>(
      prompt,
      generateCtaOutputSchema,
      'You are a technical writer crafting natural discussion CTAs for LinkedIn.'
    );

    res.json({ ctas: generated.ctas });
  } catch (error) {
    next(error);
  }
});

// POST /api/content/:id/generate-hashtags (Suggest 3-5 relevant hashtags)
contentRouter.post('/:id/generate-hashtags', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const post = await prisma.contentPost.findUnique({
      where: { id },
    });

    if (!post) {
      res.status(404).json({ error: 'Not Found', message: 'Content post not found' });
      return;
    }

    const ai = getAIProvider();
    const prompt = `Generate 3 to 5 specific, relevant hashtags for:
Topic: ${post.title}
Category: ${post.category}
Body Preview: ${post.body.slice(0, 300)}

Do NOT suggest spam tags like #viral, #fyp, #growthhack, #followme.`;

    const generated = await ai.generateStructured<any>(
      prompt,
      generateHashtagsOutputSchema,
      'You are a social metadata specialist recommending relevant technical hashtags.'
    );

    res.json({ hashtags: generated.hashtags });
  } catch (error) {
    next(error);
  }
});

// GET /api/content/:id/revisions (List revisions for a post)
contentRouter.get('/:id/revisions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const revisions = await prisma.contentRevision.findMany({
      where: { contentPostId: id },
      orderBy: { revisionNumber: 'desc' },
    });

    res.json(revisions);
  } catch (error) {
    next(error);
  }
});

// POST /api/content/:id/publish-record (Record manual publication)
contentRouter.post('/:id/publish-record', validateBody(publishRecordSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.contentPost.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Content post not found' });
      return;
    }

    const { publishedAt, externalPostUrl } = req.body;

    const updated = await prisma.contentPost.update({
      where: { id },
      data: {
        status: ContentStatus.PUBLISHED,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        publishedManually: true,
        externalPostUrl: externalPostUrl || existing.externalPostUrl,
      },
      include: {
        metrics: { orderBy: { recordedAt: 'desc' } },
        revisions: { orderBy: { revisionNumber: 'desc' } },
      },
    });

    // Create task to record metrics
    await prisma.task.create({
      data: {
        title: `Record post metrics: "${updated.title.slice(0, 40)}"`,
        description: 'Post was published manually on LinkedIn. Record impressions and engagement metrics within 24-48h.',
        type: TaskType.CONTENT,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        dueAt: new Date(Date.now() + 24 * 3600000),
        relatedEntityType: 'CONTENT',
        relatedEntityId: updated.id,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// GET /api/content/:id/metrics (Get metric snapshots)
contentRouter.get('/:id/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const snapshots = await prisma.contentMetric.findMany({
      where: { postId: id },
      orderBy: { recordedAt: 'desc' },
    });

    const latest = snapshots.length > 0 ? snapshots[0] : null;

    res.json({
      snapshots,
      latest,
      totalSnapshots: snapshots.length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/content/:id/metrics (Record a new metric snapshot)
contentRouter.post('/:id/metrics', validateBody(createContentMetricsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const post = await prisma.contentPost.findUnique({
      where: { id },
    });

    if (!post) {
      res.status(404).json({ error: 'Not Found', message: 'Content post not found' });
      return;
    }

    const {
      impressions,
      reactions,
      comments,
      reposts,
      clicks = 0,
      followersAtPublication,
      recordedAt,
    } = req.body;

    const engagementRate = calculateEngagementRate(impressions, reactions, comments, reposts, clicks);

    const snapshot = await prisma.contentMetric.create({
      data: {
        postId: id,
        impressions,
        reactions,
        comments,
        reposts,
        clicks,
        engagementRate,
        followersAtPublication: followersAtPublication || null,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      },
    });

    const updatedPost = await prisma.contentPost.findUnique({
      where: { id },
      include: {
        metrics: { orderBy: { recordedAt: 'desc' } },
        revisions: { orderBy: { revisionNumber: 'desc' } },
      },
    });

    res.status(201).json({
      snapshot,
      post: updatedPost,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/content/generate (Standalone Workbench AI generation)
contentRouter.post('/generate', validateBody(generateLinkedInPostInputSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body;
    const ai = getAIProvider();

    const topic = input.topic || input.idea || 'Technical Engineering Lesson';
    const prompt = `Generate a high-quality, authentic technical LinkedIn post based on:
Idea: ${input.idea || topic}
Topic: ${topic}
Category: ${input.category}
Target Audience: ${input.targetAudience}
Tone: ${input.tone}
Main Lesson / Insight: ${input.mainLesson || 'Key engineering trade-off'}
Project Context: ${input.projectContext || input.sourceContext || 'Personal software engineering project'}
Length: ${input.desiredLength}

STRICT QUALITY REQUIREMENTS:
- AVOID generic motivational clichés, fake guru claims, engagement bait, excessive emojis, and buzzwords.
- PREFER genuine engineering trade-offs, code architecture lessons, concrete numbers/benchmarks, and actionable insights.
- Provide a strong opening hook, a structured body with bullet points, a thought-provoking CTA question, 3-4 relevant hashtags, and 2-3 alternative hooks.`;

    const generated = await ai.generateStructured<any>(
      prompt,
      generateLinkedInPostOutputSchema,
      'You are a senior technical writer crafting authentic engineering posts for software developers and technical leaders.'
    );

    res.json(generated);
  } catch (error) {
    next(error);
  }
});
