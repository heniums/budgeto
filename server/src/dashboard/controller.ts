import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getUser } from '../auth/middleware';
import { notFoundError } from '../errors';
import {
  getSummary,
  getWidgetsByUser,
  saveWidgetsByUser,
  getWidgetData,
} from './service';

export async function summaryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = getUser(req);
    const result = await getSummary(user.sub);
    res.status(200).json({ summary: result });
  } catch (error) {
    next(error);
  }
}

const widgetConfigSchema = z.object({
  widgetId: z.string().min(1).max(64),
  visible: z.boolean(),
  order: z.number().int().min(0),
  colSpan: z.number().int().min(1).max(2).default(1),
  rowSpan: z.number().int().min(1).max(4).default(1),
  config: z.record(z.any()).default({}),
});

const saveWidgetsBodySchema = z.object({
  widgets: z.array(widgetConfigSchema),
});

export async function listWidgetsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = getUser(req);
    const result = await getWidgetsByUser(user.sub);
    res.status(200).json({ widgets: result });
  } catch (error) {
    next(error);
  }
}

export async function saveWidgetsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = getUser(req);
    const { widgets } = saveWidgetsBodySchema.parse(req.body);
    const result = await saveWidgetsByUser(user.sub, widgets);
    res.status(200).json({ widgets: result });
  } catch (error) {
    next(error);
  }
}

const VALID_WIDGET_IDS = new Set([
  'net-worth',
  'income-vs-expense',
  'monthly-cash-flow',
  'spending-by-category',
  'top-spending-categories',
  'wallet-balance-breakdown',
  'balance-by-wallet',
  'budget-progress',
  'recent-transactions',
  'biggest-expense',
  'daily-spending-rate',
  'quick-shortcuts',
]);

const widgetDataBodySchema = z.object({
  config: z.record(z.any()).default({}),
});

export async function widgetDataHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = getUser(req);
    const { widgetId } = req.params;
    if (!widgetId || !VALID_WIDGET_IDS.has(widgetId)) {
      return next(notFoundError());
    }
    const { config } = widgetDataBodySchema.parse(req.body ?? {});
    const data = await getWidgetData(user.sub, widgetId, config);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
}
