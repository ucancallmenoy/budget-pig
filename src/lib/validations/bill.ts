import { z } from 'zod';

export const billCategories = ['utilities', 'rent', 'insurance', 'subscription', 'loan', 'other'] as const;

export const createBillSchema = z.object({
  monthId: z.string().min(1, 'Month ID is required'),
  name: z.string().min(1, 'Name is required').max(100),
  category: z.enum(billCategories),
  amount: z.number().min(0, 'Amount must be positive'),
  dueDate: z.string().or(z.date()),
  isPaid: z.boolean().optional().default(false),
});

export const updateBillSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.enum(billCategories).optional(),
  amount: z.number().min(0).optional(),
  dueDate: z.string().or(z.date()).optional(),
  isPaid: z.boolean().optional(),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;