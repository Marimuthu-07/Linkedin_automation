import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@linkedin-growth/database';
import {
  LeadStatus,
  LeadInteractionType,
  LeadOutreachVariantType,
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  leadFollowUpSchema,
  scoreLeadInputSchema,
  createLeadInteractionSchema,
  calculateLeadQualification,
  generateLeadOutreachOutputSchema,
  isValidLeadStatusTransition,
  VALID_LEAD_TRANSITIONS,
} from '@linkedin-growth/shared';
import { validateBody } from '../middlewares/validate.js';
import { getAIProvider } from '../ai/factory.js';

export const leadsRouter = Router();

// GET /api/leads/stats (Summary pipeline metrics)
leadsRouter.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const sevenDaysFromNow = new Date(endOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalDiscovered,
      totalResearching,
      totalQualified,
      totalOutreachDraft,
      totalContacted,
      totalReplied,
      totalMeeting,
      totalProposal,
      totalWon,
      totalLost,
      totalArchived,
      followUpsDueToday,
      followUpsOverdue,
      followUpsUpcoming7Days,
      allLeadsForAvg,
      totalLeads,
    ] = await Promise.all([
      prisma.lead.count({ where: { status: LeadStatus.DISCOVERED } }),
      prisma.lead.count({ where: { status: LeadStatus.RESEARCHING } }),
      prisma.lead.count({ where: { status: LeadStatus.QUALIFIED } }),
      prisma.lead.count({ where: { status: LeadStatus.OUTREACH_DRAFT } }),
      prisma.lead.count({ where: { status: LeadStatus.CONTACTED } }),
      prisma.lead.count({ where: { status: LeadStatus.REPLIED } }),
      prisma.lead.count({ where: { status: LeadStatus.MEETING } }),
      prisma.lead.count({ where: { status: LeadStatus.PROPOSAL } }),
      prisma.lead.count({ where: { status: LeadStatus.WON } }),
      prisma.lead.count({ where: { status: LeadStatus.LOST } }),
      prisma.lead.count({ where: { status: LeadStatus.ARCHIVED } }),
      prisma.lead.count({
        where: {
          nextFollowUpAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
          status: { notIn: [LeadStatus.ARCHIVED, LeadStatus.WON, LeadStatus.LOST] },
        },
      }),
      prisma.lead.count({
        where: {
          nextFollowUpAt: {
            lt: startOfToday,
          },
          status: { notIn: [LeadStatus.ARCHIVED, LeadStatus.WON, LeadStatus.LOST] },
        },
      }),
      prisma.lead.count({
        where: {
          nextFollowUpAt: {
            gt: endOfToday,
            lte: sevenDaysFromNow,
          },
          status: { notIn: [LeadStatus.ARCHIVED, LeadStatus.WON, LeadStatus.LOST] },
        },
      }),
      prisma.lead.findMany({ select: { qualificationScore: true } }),
      prisma.lead.count(),
    ]);

    const totalScore = allLeadsForAvg.reduce((sum, l) => sum + (l.qualificationScore || 0), 0);
    const avgQualificationScore = allLeadsForAvg.length > 0 ? Math.round(totalScore / allLeadsForAvg.length) : 0;

    res.json({
      totalLeads,
      totalDiscovered,
      totalResearching,
      totalQualified,
      totalOutreachDraft,
      totalContacted,
      totalReplied,
      totalMeeting,
      totalProposal,
      totalWon,
      totalLost,
      totalArchived,
      avgQualificationScore,
      followUpsDueToday,
      followUpsOverdue,
      followUpsUpcoming7Days,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/leads/score (Calculate transparent deterministic qualification score)
leadsRouter.post('/score', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = scoreLeadInputSchema.safeParse(req.body);
    const input = parsed.success
      ? parsed.data
      : {
          websiteUxScore: Number(req.body.websiteUxScore) || 5,
          mobileExperienceScore: Number(req.body.mobileExperienceScore) || 5,
          performanceScore: Number(req.body.performanceScore) || 5,
          visualQualityScore: Number(req.body.visualQualityScore) || 5,
          ctaClarityScore: Number(req.body.ctaClarityScore) || 5,
          conversionClarityScore: Number(req.body.conversionClarityScore) || 5,
          serviceFit: req.body.serviceFit === 'HIGH' || req.body.serviceFit === 'LOW' ? req.body.serviceFit : 'MEDIUM',
          identifiedIssues: Array.isArray(req.body.identifiedIssues) ? req.body.identifiedIssues : [],
        };

    const breakdown = calculateLeadQualification(input as any);

    res.json({
      qualificationScore: breakdown.totalScore,
      qualificationBreakdown: breakdown,
      ...breakdown, // For backwards compatibility
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/leads (List leads with filters, search, sorting, and pagination)
leadsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      industry,
      source,
      search,
      minScore,
      maxScore,
      serviceFit,
      followUpFilter,
      sortBy = 'qualificationScore',
      sortOrder = 'desc',
      page: rawPage,
      limit: rawLimit,
    } = req.query;

    const where: any = {};

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    if (industry && typeof industry === 'string' && industry !== 'ALL') {
      where.industry = { contains: industry.trim(), mode: 'insensitive' };
    }

    if (source && typeof source === 'string' && source !== 'ALL') {
      where.source = { contains: source.trim(), mode: 'insensitive' };
    }

    if (minScore || maxScore) {
      where.qualificationScore = {};
      if (minScore) where.qualificationScore.gte = parseInt(minScore as string, 10);
      if (maxScore) where.qualificationScore.lte = parseInt(maxScore as string, 10);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { company: { contains: q, mode: 'insensitive' } },
        { contactName: { contains: q, mode: 'insensitive' } },
        { contactRole: { contains: q, mode: 'insensitive' } },
        { industry: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { problem: { contains: q, mode: 'insensitive' } },
        { opportunity: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ];
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const sevenDaysFromNow = new Date(endOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (followUpFilter === 'due_today') {
      where.nextFollowUpAt = {
        gte: startOfToday,
        lte: endOfToday,
      };
    } else if (followUpFilter === 'overdue') {
      where.nextFollowUpAt = {
        lt: startOfToday,
      };
    } else if (followUpFilter === 'upcoming_7_days') {
      where.nextFollowUpAt = {
        gt: endOfToday,
        lte: sevenDaysFromNow,
      };
    } else if (followUpFilter === 'future') {
      where.nextFollowUpAt = {
        gt: sevenDaysFromNow,
      };
    } else if (followUpFilter === 'none') {
      where.nextFollowUpAt = null;
    }

    // Determine sorting
    const validSortFields = ['qualificationScore', 'createdAt', 'updatedAt', 'nextFollowUpAt', 'company'];
    const selectedSortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'qualificationScore';
    const selectedSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const orderBy: any = [{ [selectedSortField]: selectedSortOrder }];
    if (selectedSortField !== 'updatedAt') {
      orderBy.push({ updatedAt: 'desc' });
    }

    if (rawPage || rawLimit) {
      const page = Math.max(1, parseInt(rawPage as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(rawLimit as string, 10) || 20));
      const skip = (page - 1) * limit;

      const [total, items] = await Promise.all([
        prisma.lead.count({ where }),
        prisma.lead.findMany({
          where,
          include: {
            interactions: {
              orderBy: { occurredAt: 'desc' },
              take: 5,
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
      ]);

      res.json({
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
      return;
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        interactions: {
          orderBy: { occurredAt: 'desc' },
          take: 5,
        },
      },
      orderBy,
    });

    res.json(leads);
  } catch (error) {
    next(error);
  }
});

// GET /api/leads/:id
leadsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        interactions: {
          orderBy: { occurredAt: 'desc' },
        },
      },
    });
    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }
    res.json(lead);
  } catch (error) {
    next(error);
  }
});

// POST /api/leads
leadsRouter.post('/', validateBody(createLeadSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;

    let qualificationBreakdown = data.qualificationBreakdown || null;
    let qualificationScore = data.qualificationScore ?? 50;

    // If qualification breakdown is not provided or needs calculation
    if (!qualificationBreakdown && data.websiteUxScore !== undefined) {
      const breakdown = calculateLeadQualification({
        websiteUxScore: data.websiteUxScore ?? 5,
        mobileExperienceScore: data.mobileExperienceScore ?? 5,
        performanceScore: data.performanceScore ?? 5,
        visualQualityScore: data.visualQualityScore ?? 5,
        ctaClarityScore: data.ctaClarityScore ?? 5,
        conversionClarityScore: data.conversionClarityScore ?? 5,
        serviceFit: data.serviceFit ?? 'MEDIUM',
      });
      qualificationBreakdown = breakdown;
      qualificationScore = breakdown.totalScore;
    } else if (qualificationBreakdown) {
      qualificationScore = qualificationBreakdown.totalScore ?? qualificationScore;
    }

    const lead = await prisma.lead.create({
      data: {
        company: data.company,
        website: data.website,
        industry: data.industry,
        location: data.location || null,
        contactName: data.contactName || null,
        contactRole: data.contactRole || null,
        linkedinUrl: data.linkedinUrl || null,
        companyLinkedinUrl: data.companyLinkedinUrl || null,
        source: data.source || 'Manual Research',
        problem: data.problem,
        opportunity: data.opportunity,
        qualificationScore,
        qualificationBreakdown: qualificationBreakdown ? (qualificationBreakdown as any) : null,
        status: data.status || LeadStatus.DISCOVERED,
        notes: data.notes || null,
        outreachDraft: data.outreachDraft || null,
        outreachVariants: data.outreachVariants ? (data.outreachVariants as any) : null,
        nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
        lastInteractionAt: data.lastInteractionAt ? new Date(data.lastInteractionAt) : null,
      },
    });

    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/leads/:id
leadsRouter.patch('/:id', validateBody(updateLeadSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    const updatePayload: any = { ...data };

    if (data.nextFollowUpAt !== undefined) {
      updatePayload.nextFollowUpAt = data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null;
    }
    if (data.lastInteractionAt !== undefined) {
      updatePayload.lastInteractionAt = data.lastInteractionAt ? new Date(data.lastInteractionAt) : null;
    }
    if (data.qualificationBreakdown !== undefined) {
      updatePayload.qualificationBreakdown = data.qualificationBreakdown ? (data.qualificationBreakdown as any) : null;
      if (data.qualificationBreakdown?.totalScore !== undefined) {
        updatePayload.qualificationScore = data.qualificationBreakdown.totalScore;
      }
    }
    if (data.outreachVariants !== undefined) {
      updatePayload.outreachVariants = data.outreachVariants ? (data.outreachVariants as any) : null;
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: updatePayload,
      include: {
        interactions: {
          orderBy: { occurredAt: 'desc' },
        },
      },
    });

    res.json(lead);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/leads/:id/status (Strict state machine validation)
leadsRouter.patch('/:id/status', validateBody(updateLeadStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status: targetStatus } = req.body as { status: LeadStatus };

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    const currentStatus = lead.status as LeadStatus;
    const isValid = isValidLeadStatusTransition(currentStatus, targetStatus);

    if (!isValid) {
      const allowed = VALID_LEAD_TRANSITIONS[currentStatus] || [];
      res.status(400).json({
        error: 'Invalid Transition',
        message: `Cannot transition lead from ${currentStatus} to ${targetStatus}. Allowed transitions: ${allowed.join(', ') || 'None'}`,
        currentStatus,
        targetStatus,
        allowedTransitions: allowed,
      });
      return;
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: { status: targetStatus },
      include: {
        interactions: {
          orderBy: { occurredAt: 'desc' },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/leads/:id/follow-up (Schedule follow-up with optional note)
leadsRouter.patch('/:id/follow-up', validateBody(leadFollowUpSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { nextFollowUpAt, note } = req.body;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    const followUpDate = nextFollowUpAt ? new Date(nextFollowUpAt) : null;

    // If a note was provided, log an interaction as well
    if (note && note.trim()) {
      await prisma.leadInteraction.create({
        data: {
          leadId: id,
          type: LeadInteractionType.NOTE,
          note: `Follow-up note: ${note.trim()}`,
          occurredAt: new Date(),
        },
      });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        nextFollowUpAt: followUpDate,
        lastInteractionAt: note ? new Date() : undefined,
      },
      include: {
        interactions: {
          orderBy: { occurredAt: 'desc' },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// POST /api/leads/:id/generate-outreach (Grounded AI outreach generator with variants)
leadsRouter.post('/:id/generate-outreach', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { variantType } = req.body || {};

    const lead = await prisma.lead.findUnique({
      where: { id },
    });
    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    const breakdown = (lead.qualificationBreakdown as any) || {};
    const reasons = Array.isArray(breakdown.reasons) ? breakdown.reasons : [];
    const fit = breakdown.serviceFit || 'HIGH';

    const prompt = `Generate a concise, high-converting, personalized outreach message for this freelance client lead.

GROUNDING FACTS (Strictly ground your message in these verified facts only):
Company: ${lead.company}
Website: ${lead.website}
Industry: ${lead.industry}
Location: ${lead.location || 'Not specified'}
Contact Name: ${lead.contactName || 'Founder / Business Lead'}
Contact Role: ${lead.contactRole || 'Not specified'}
Observed Problem: ${lead.problem}
Opportunity: ${lead.opportunity}
Service Fit: ${fit}
Qualification Score: ${lead.qualificationScore}/100
Audit Reasons: ${reasons.join('; ') || 'Website optimization opportunity'}
Requested Variant Focus: ${variantType || 'ALL'}

RULES:
- Use only the supplied lead information.
- NEVER invent facts about their revenue, team size, funding, or unmentioned tools.
- NEVER claim to have done deep testing beyond the supplied observed problem.
- Keep the tone respectful, consultative, and highly professional.
- Focus on practical solutions and low-friction discovery (e.g. 3-minute Loom video offer).`;

    const ai = getAIProvider();
    const generated = await ai.generateStructured<any>(
      prompt,
      generateLeadOutreachOutputSchema,
      'You are an expert freelance web engineer writing personalized, grounded discovery outreach emails and LinkedIn messages.'
    );

    // Update lead draft, variants, and transition to OUTREACH_DRAFT if currently DISCOVERED/RESEARCHING/QUALIFIED
    const shouldAdvanceStatus = ['DISCOVERED', 'RESEARCHING', 'QUALIFIED'].includes(lead.status);
    const newStatus = shouldAdvanceStatus ? LeadStatus.OUTREACH_DRAFT : lead.status;

    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        outreachDraft: generated.fullDraft,
        outreachVariants: generated.variants ? (generated.variants as any) : undefined,
        status: newStatus,
      },
      include: {
        interactions: {
          orderBy: { occurredAt: 'desc' },
        },
      },
    });

    res.json({
      lead: updated,
      draft: generated.fullDraft,
      breakdown: generated,
      personalizationBasis: generated.personalizationBasis,
      variants: generated.variants,
      guidance: 'Outreach drafts generated. Human review required — copy and send manually via LinkedIn or email.',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/leads/:id/interactions (List lead interaction history)
leadsRouter.get('/:id/interactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    const interactions = await prisma.leadInteraction.findMany({
      where: { leadId: id },
      orderBy: { occurredAt: 'desc' },
    });

    res.json(interactions);
  } catch (error) {
    next(error);
  }
});

// POST /api/leads/:id/interactions (Record manual interaction)
leadsRouter.post('/:id/interactions', validateBody(createLeadInteractionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { type, note, occurredAt } = req.body;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    const date = occurredAt ? new Date(occurredAt) : new Date();

    const interaction = await prisma.leadInteraction.create({
      data: {
        leadId: id,
        type: type || LeadInteractionType.NOTE,
        note,
        occurredAt: date,
      },
    });

    // Update lastInteractionAt on lead
    await prisma.lead.update({
      where: { id },
      data: {
        lastInteractionAt: date,
      },
    });

    res.status(201).json(interaction);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/leads/:id/interactions/:interactionId (Delete single interaction)
leadsRouter.delete('/:id/interactions/:interactionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const interactionId = req.params.interactionId as string;

    const existing = await prisma.leadInteraction.findFirst({
      where: { id: interactionId, leadId: id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Interaction not found' });
      return;
    }

    await prisma.leadInteraction.delete({
      where: { id: interactionId },
    });

    res.json({ message: 'Interaction deleted successfully', id: interactionId });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/leads/:id (Delete lead and cascades)
leadsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    await prisma.lead.delete({
      where: { id },
    });

    res.json({ message: 'Lead deleted successfully', id });
  } catch (error) {
    next(error);
  }
});
