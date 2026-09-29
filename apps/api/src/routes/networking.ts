import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@linkedin-growth/database';
import {
  NetworkingStatus,
  createContactSchema,
  updateContactSchema,
  updateContactStatusSchema,
  createNetworkingMessageSchema,
  updateNetworkingMessageSchema,
  generateNetworkingMessageOutputSchema,
  VALID_NETWORKING_TRANSITIONS,
  isValidNetworkingStatusTransition,
} from '@linkedin-growth/shared';
import { validateBody } from '../middlewares/validate.js';
import { getAIProvider } from '../ai/factory.js';

export const networkingRouter = Router();

// GET /api/networking/stats
networkingRouter.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const sevenDaysFromNow = new Date(endOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalDiscovered,
      totalReviewing,
      totalApproved,
      totalContacted,
      totalReplied,
      totalFollowUp,
      totalConnected,
      totalArchived,
      followUpsDueToday,
      followUpsOverdue,
      followUpsUpcoming7Days,
      totalContacts,
    ] = await Promise.all([
      prisma.networkingContact.count({ where: { status: NetworkingStatus.DISCOVERED } }),
      prisma.networkingContact.count({ where: { status: NetworkingStatus.REVIEWING } }),
      prisma.networkingContact.count({ where: { status: NetworkingStatus.APPROVED } }),
      prisma.networkingContact.count({ where: { status: NetworkingStatus.CONTACTED } }),
      prisma.networkingContact.count({ where: { status: NetworkingStatus.REPLIED } }),
      prisma.networkingContact.count({ where: { status: NetworkingStatus.FOLLOW_UP } }),
      prisma.networkingContact.count({ where: { status: NetworkingStatus.CONNECTED } }),
      prisma.networkingContact.count({ where: { status: NetworkingStatus.ARCHIVED } }),
      prisma.networkingContact.count({
        where: {
          nextFollowUpAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
          status: { not: NetworkingStatus.ARCHIVED },
        },
      }),
      prisma.networkingContact.count({
        where: {
          nextFollowUpAt: {
            lt: startOfToday,
          },
          status: { not: NetworkingStatus.ARCHIVED },
        },
      }),
      prisma.networkingContact.count({
        where: {
          nextFollowUpAt: {
            gt: endOfToday,
            lte: sevenDaysFromNow,
          },
          status: { not: NetworkingStatus.ARCHIVED },
        },
      }),
      prisma.networkingContact.count(),
    ]);

    res.json({
      totalDiscovered,
      totalReviewing,
      totalApproved,
      totalContacted,
      totalReplied,
      totalFollowUp,
      totalConnected,
      totalArchived,
      followUpsDueToday,
      followUpsOverdue,
      followUpsUpcoming7Days,
      totalContacts,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/networking
networkingRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      category,
      company,
      search,
      followUpDue,
      followUpFilter,
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

    if (company && typeof company === 'string' && company.trim()) {
      where.company = { contains: company.trim(), mode: 'insensitive' };
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { headline: { contains: q, mode: 'insensitive' } },
        { role: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { relevanceReason: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ];
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const sevenDaysFromNow = new Date(endOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    const activeFilter = followUpFilter || (followUpDue === 'true' ? 'due_today' : undefined);

    if (activeFilter === 'due_today') {
      where.nextFollowUpAt = {
        gte: startOfToday,
        lte: endOfToday,
      };
    } else if (activeFilter === 'overdue') {
      where.nextFollowUpAt = {
        lt: startOfToday,
      };
    } else if (activeFilter === 'upcoming_7_days') {
      where.nextFollowUpAt = {
        gt: endOfToday,
        lte: sevenDaysFromNow,
      };
    } else if (activeFilter === 'has_followup') {
      where.nextFollowUpAt = { not: null };
    }

    const [total, items] = await Promise.all([
      prisma.networkingContact.count({ where }),
      prisma.networkingContact.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      items,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/networking/:id
networkingRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const contact = await prisma.networkingContact.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!contact) {
      res.status(404).json({ error: 'Not Found', message: 'Networking contact not found' });
      return;
    }

    res.json(contact);
  } catch (error) {
    next(error);
  }
});

// POST /api/networking
networkingRouter.post('/', validateBody(createContactSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const contact = await prisma.networkingContact.create({
      data: {
        ...data,
        lastInteractionAt: data.lastInteractionAt ? new Date(data.lastInteractionAt) : null,
        nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
      },
      include: {
        messages: true,
      },
    });

    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/networking/:id
networkingRouter.patch('/:id', validateBody(updateContactSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.networkingContact.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Networking contact not found' });
      return;
    }

    const data = req.body;

    // Validate status transition if status is being modified
    if (data.status && data.status !== existing.status) {
      const isAllowed = isValidNetworkingStatusTransition(
        existing.status as NetworkingStatus,
        data.status as NetworkingStatus
      );

      if (!isAllowed) {
        const allowed = VALID_NETWORKING_TRANSITIONS[existing.status as NetworkingStatus] || [];
        res.status(400).json({
          error: 'Invalid Status Transition',
          message: `Cannot transition contact from ${existing.status} to ${data.status}. Allowed transitions: ${allowed.join(', ')}`,
          currentStatus: existing.status,
          attemptedStatus: data.status,
          allowedTransitions: allowed,
        });
        return;
      }
    }

    const updateData: any = { ...data };
    if (data.lastInteractionAt !== undefined) {
      updateData.lastInteractionAt = data.lastInteractionAt ? new Date(data.lastInteractionAt) : null;
    }
    if (data.nextFollowUpAt !== undefined) {
      updateData.nextFollowUpAt = data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null;
    }

    const updated = await prisma.networkingContact.update({
      where: { id },
      data: updateData,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/networking/:id/status
networkingRouter.patch('/:id/status', validateBody(updateContactStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status: targetStatus } = req.body;

    const existing = await prisma.networkingContact.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Networking contact not found' });
      return;
    }

    const isAllowed = isValidNetworkingStatusTransition(
      existing.status as NetworkingStatus,
      targetStatus as NetworkingStatus
    );

    if (!isAllowed) {
      const allowed = VALID_NETWORKING_TRANSITIONS[existing.status as NetworkingStatus] || [];
      res.status(400).json({
        error: 'Invalid Status Transition',
        message: `Cannot transition contact from ${existing.status} to ${targetStatus}. Allowed transitions: ${allowed.join(', ')}`,
        currentStatus: existing.status,
        attemptedStatus: targetStatus,
        allowedTransitions: allowed,
      });
      return;
    }

    const updated = await prisma.networkingContact.update({
      where: { id },
      data: {
        status: targetStatus,
        lastInteractionAt:
          targetStatus === NetworkingStatus.CONTACTED ||
          targetStatus === NetworkingStatus.REPLIED ||
          targetStatus === NetworkingStatus.CONNECTED
            ? new Date()
            : existing.lastInteractionAt,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/networking/:id
networkingRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.networkingContact.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Networking contact not found' });
      return;
    }

    await prisma.networkingContact.delete({
      where: { id },
    });

    res.json({ message: 'Contact deleted successfully', id });
  } catch (error) {
    next(error);
  }
});

// POST /api/networking/:id/generate-message (and /generate-draft for compatibility)
const handleGenerateMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const contact = await prisma.networkingContact.findUnique({
      where: { id },
    });

    if (!contact) {
      res.status(404).json({ error: 'Not Found', message: 'Networking contact not found' });
      return;
    }

    const ai = getAIProvider();
    const prompt = `Generate a concise, authentic, professional networking outreach message for:
Name: ${contact.name}
Role: ${contact.role || 'None'}
Company: ${contact.company || 'None'}
Headline: ${contact.headline || 'None'}
Relevance Reason: ${contact.relevanceReason || 'None'}
Category: ${contact.category}
Notes: ${contact.notes || 'None'}

Safety & Truthfulness Guidelines:
- Max 300 characters / 2-3 sentences.
- Personalize ONLY using verified information explicitly provided above.
- Do NOT invent shared connections, shared schools, fake projects, or mutual acquaintances.
- If information is sparse, craft a clean professional outreach and note that personalization data is limited.`;

    const generated = await ai.generateStructured<any>(
      prompt,
      generateNetworkingMessageOutputSchema,
      'You are a professional networking strategist crafting genuine human-to-human connection notes for a software engineering student.'
    );

    // Create a new NetworkingMessage record
    const messageRecord = await prisma.networkingMessage.create({
      data: {
        contactId: contact.id,
        type: req.body?.type || 'CONNECTION_REQUEST',
        content: generated.message,
        personalizationBasis: generated.personalizationBasis || [],
        status: 'DRAFT',
      },
    });

    // Update contact draft in database
    const updatedContact = await prisma.networkingContact.update({
      where: { id: contact.id },
      data: {
        messageDraft: generated.message,
        status: contact.status === NetworkingStatus.DISCOVERED ? NetworkingStatus.REVIEWING : contact.status,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json({
      contact: updatedContact,
      message: messageRecord,
      draft: generated.message,
      personalizationBasis: generated.personalizationBasis,
      isLimitedPersonalization: generated.isLimitedPersonalization,
      toneNotes: generated.toneNotes,
      guidance: 'Draft only — review and send manually on LinkedIn.',
    });
  } catch (error) {
    next(error);
  }
};

networkingRouter.post('/:id/generate-message', handleGenerateMessage);
networkingRouter.post('/:id/generate-draft', handleGenerateMessage);

// POST /api/networking/:id/messages - Add manual message draft
networkingRouter.post('/:id/messages', validateBody(createNetworkingMessageSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contactId = req.params.id as string;
    const existing = await prisma.networkingContact.findUnique({
      where: { id: contactId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Networking contact not found' });
      return;
    }

    const data = req.body;
    const message = await prisma.networkingMessage.create({
      data: {
        contactId,
        type: data.type || 'CONNECTION_REQUEST',
        content: data.content,
        personalizationBasis: data.personalizationBasis || [],
        status: data.status || 'DRAFT',
      },
    });

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/networking/:id/messages/:messageId - Update message
networkingRouter.patch('/:id/messages/:messageId', validateBody(updateNetworkingMessageSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: contactId, messageId } = req.params as { id: string; messageId: string };

    const existing = await prisma.networkingMessage.findFirst({
      where: { id: messageId, contactId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Networking message not found' });
      return;
    }

    const updated = await prisma.networkingMessage.update({
      where: { id: messageId },
      data: req.body,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/networking/:id/messages/:messageId
networkingRouter.delete('/:id/messages/:messageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: contactId, messageId } = req.params as { id: string; messageId: string };

    const existing = await prisma.networkingMessage.findFirst({
      where: { id: messageId, contactId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Networking message not found' });
      return;
    }

    await prisma.networkingMessage.delete({
      where: { id: messageId },
    });

    res.json({ message: 'Message deleted successfully', id: messageId });
  } catch (error) {
    next(error);
  }
});
