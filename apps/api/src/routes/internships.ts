import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@linkedin-growth/database';
import {
  createInternshipSchema,
  updateInternshipSchema,
  calculateInternshipMatch,
} from '@linkedin-growth/shared';
import { validateBody } from '../middlewares/validate.js';

export const internshipsRouter = Router();

// GET /api/internships
internshipsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, remote, minScore, search, role } = req.query;

    const where: any = {};
    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }
    if (remote === 'true') {
      where.remote = true;
    }
    if (minScore && typeof minScore === 'string') {
      const scoreNum = parseInt(minScore, 10);
      if (!isNaN(scoreNum)) {
        where.matchScore = { gte: scoreNum };
      }
    }
    if (role && typeof role === 'string' && role !== 'ALL') {
      where.role = { contains: role, mode: 'insensitive' };
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { company: { contains: q, mode: 'insensitive' } },
        { role: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
      ];
    }

    const internships = await prisma.internship.findMany({
      where,
      orderBy: [{ matchScore: 'desc' }, { deadline: 'asc' }],
    });

    res.json(internships);
  } catch (error) {
    next(error);
  }
});

// GET /api/internships/:id
internshipsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const internship = await prisma.internship.findUnique({
      where: { id },
    });
    if (!internship) {
      res.status(404).json({ error: 'Not Found', message: 'Internship not found' });
      return;
    }
    res.json(internship);
  } catch (error) {
    next(error);
  }
});

// POST /api/internships
internshipsRouter.post('/', validateBody(createInternshipSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const settings = await prisma.userSettings.findFirst();

    // Recalculate match score based on user profile settings
    let matchScore = data.matchScore || 50;
    let matchReasons = data.matchReasons || [];

    if (settings) {
      const calculated = calculateInternshipMatch(data, {
        targetRoles: settings.targetRoles,
        targetLocations: settings.targetLocations,
        targetSkills: settings.targetTechnologies,
      });
      matchScore = calculated.matchScore;
      matchReasons = calculated.matchReasons;
    }

    const internship = await prisma.internship.create({
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : null,
        postedAt: data.postedAt ? new Date(data.postedAt) : null,
        matchScore,
        matchReasons,
      },
    });
    res.status(201).json(internship);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/internships/:id
internshipsRouter.patch('/:id', validateBody(updateInternshipSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = req.body;
    const updateData: any = { ...data };
    if (data.deadline !== undefined) {
      updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    }
    if (data.postedAt !== undefined) {
      updateData.postedAt = data.postedAt ? new Date(data.postedAt) : null;
    }

    const internship = await prisma.internship.update({
      where: { id },
      data: updateData,
    });
    res.json(internship);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/internships/:id
internshipsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.internship.delete({
      where: { id },
    });
    res.json({ message: 'Internship deleted successfully', id });
  } catch (error) {
    next(error);
  }
});
