import { z } from 'zod';

export const createCategoryBudgetSchema = z.object({
  year: z.number().min(2000).max(2100),
  month: z.number().min(1).max(12),
  category: z.string().min(1, 'Category is required'),
  budgetAmount: z.number().min(0, 'Budget amount must be positive'),
});

export const updateCategoryBudgetSchema = z.object({
  budgetAmount: z.number().min(0).optional(),
});

export type CreateCategoryBudgetInput = z.infer<typeof createCategoryBudgetSchema>;
export type UpdateCategoryBudgetInput = z.infer<typeof updateCategoryBudgetSchema>;
