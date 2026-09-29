import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@linkedin-growth/database';
import {
  createLeadSchema,
  updateLeadSchema,
  calculateLeadQualification,
  generateLeadOutreachInputSchema,
  generateLeadOutreachOutputSchema,
} from '@linkedin-growth/shared';
import { validateBody } from '../middlewares/validate.js';
import { getAIProvider } from '../ai/factory.js';

export const leadsRouter = Router();

// GET /api/leads
leadsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search } = req.query;

    const where: any = {};
    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { company: { contains: q, mode: 'insensitive' } },
        { industry: { contains: q, mode: 'insensitive' } },
        { problem: { contains: q, mode: 'insensitive' } },
        { opportunity: { contains: q, mode: 'insensitive' } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: [{ qualificationScore: 'desc' }, { updatedAt: 'desc' }],
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
    const lead = await prisma.lead.create({
      data: {
        ...data,
        qualificationBreakdown: data.qualificationBreakdown ? (data.qualificationBreakdown as any) : null,
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
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...data,
        qualificationBreakdown: data.qualificationBreakdown ? (data.qualificationBreakdown as any) : undefined,
      },
    });
    res.json(lead);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/leads/:id
leadsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.lead.delete({
      where: { id },
    });
    res.json({ message: 'Lead deleted successfully', id });
  } catch (error) {
    next(error);
  }
});

// POST /api/leads/score (Calculate transparent qualification score)
leadsRouter.post('/score', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      websiteUxScore = 5,
      mobileExperienceScore = 5,
      performanceScore = 5,
      visualQualityScore = 5,
      ctaClarityScore = 5,
      conversionClarityScore = 5,
      serviceFit = 'MEDIUM',
      identifiedIssues = [],
    } = req.body;

    const breakdown = calculateLeadQualification({
      websiteUxScore,
      mobileExperienceScore,
      performanceScore,
      visualQualityScore,
      ctaClarityScore,
      conversionClarityScore,
      serviceFit,
      identifiedIssues,
    });

    res.json(breakdown);
  } catch (error) {
    next(error);
  }
});

// POST /api/leads/:id/generate-outreach (Generate personalized outreach)
leadsRouter.post('/:id/generate-outreach', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const lead = await prisma.lead.findUnique({
      where: { id },
    });
    if (!lead) {
      res.status(404).json({ error: 'Not Found', message: 'Lead not found' });
      return;
    }

    const ai = getAIProvider();
    const prompt = `Generate a concise, high-converting, personalized cold outreach message for this freelance client lead:
Company: ${lead.company}
Website: ${lead.website}
Contact Name: ${lead.contactName || 'Founder / Marketing Lead'}
Observed Problem: ${lead.problem}
Opportunity: ${lead.opportunity}
Qualification Score: ${lead.qualificationScore}/100

STRUCTURE:
Observation ➔ Relevant Problem ➔ Possible Value / Solution ➔ Low-friction Question (e.g. 3-min Loom offer)

RULES:
- Concise, polite, non-spammy.
- NEVER invent facts about their revenue or team.
- Focus strictly on verified website observations.`;

    const generated = await ai.generateStructured<any>(
      prompt,
      generateLeadOutreachOutputSchema,
      'You are a freelance web engineering consultant writing high-value personalized discovery emails.'
    );

    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        outreachDraft: generated.fullDraft,
        status: lead.status === 'DISCOVERED' ? 'OUTREACH_DRAFT' : lead.status,
      },
    });

    res.json({
      lead: updated,
      draft: generated.fullDraft,
      breakdown: generated,
      guidance: 'Outreach draft ready — review and send manually.',
    });
  } catch (error) {
    next(error);
  }
});
