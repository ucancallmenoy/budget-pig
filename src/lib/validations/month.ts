import { z } from 'zod';

export const createMonthSchema = z.object({
  year: z.number().min(2000).max(2100),
  month: z.number().min(1).max(12),
  totalIncome: z.number().min(0),
});

export const updateMonthSchema = z.object({
  totalIncome: z.number().min(0).optional(),
});

export type CreateMonthInput = z.infer<typeof createMonthSchema>;
export type UpdateMonthInput = z.infer<typeof updateMonthSchema>;