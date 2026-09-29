import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@linkedin-growth/database';
import { updateSettingsSchema } from '@linkedin-growth/shared';
import { validateBody } from '../middlewares/validate.js';

export const settingsRouter = Router();

// GET /api/settings
settingsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let settings = await prisma.userSettings.findFirst();
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {},
      });
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/settings
settingsRouter.patch('/', validateBody(updateSettingsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    let settings = await prisma.userSettings.findFirst();

    if (settings) {
      settings = await prisma.userSettings.update({
        where: { id: settings.id },
        data,
      });
    } else {
      settings = await prisma.userSettings.create({
        data,
      });
    }

    res.json(settings);
  } catch (error) {
    next(error);
  }
});
