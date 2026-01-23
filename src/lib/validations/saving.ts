import { z } from 'zod';

export const createSavingSchema = z.object({
  monthId: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(100),
  targetAmount: z.number().min(0, 'Target amount must be positive'),
  savedAmount: z.number().min(0).optional().default(0),
  goalType: z.enum(['monthly', 'long_term']),
  targetDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  category: z.string().optional(),
});

export const updateSavingSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetAmount: z.number().min(0).optional(),
  savedAmount: z.number().min(0).optional(),
  goalType: z.enum(['monthly', 'long_term']).optional(),
  targetDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  category: z.string().optional(),
  isCompleted: z.boolean().optional(),
});

export const addContributionSchema = z.object({
  savingId: z.string().min(1),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  note: z.string().optional(),
});

export type CreateSavingInput = z.infer<typeof createSavingSchema>;
export type UpdateSavingInput = z.infer<typeof updateSavingSchema>;
export type AddContributionInput = z.infer<typeof addContributionSchema>;