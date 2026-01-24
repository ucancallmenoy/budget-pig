import { z } from 'zod';

export const billCategories = ['utilities', 'rent', 'insurance', 'subscription', 'loan', 'other'] as const;
export const billRecurrences = ['monthly', 'yearly', 'one_time'] as const;

export const createBillSchema = z.object({
  monthId: z.string().min(1, 'Month ID is required'),
  name: z.string().min(1, 'Name is required').max(100),
  category: z.enum(billCategories),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  dueDate: z.number().min(1, 'Due date must be between 1-31').max(31),
  isRecurring: z.boolean().default(false),
  recurrence: z.enum(billRecurrences).default('one_time'),
});

export const updateBillSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.enum(billCategories).optional(),
  amount: z.number().min(0.01).optional(),
  dueDate: z.number().min(1).max(31).optional(),
  isRecurring: z.boolean().optional(),
  recurrence: z.enum(billRecurrences).optional(),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;