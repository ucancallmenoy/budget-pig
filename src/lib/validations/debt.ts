import { z } from 'zod';

export const debtTypes = ['credit_card', 'student_loan', 'personal_loan', 'mortgage', 'car_loan', 'other'] as const;

export const createDebtSchema = z.object({
  monthId: z.string().min(1, 'Month ID is required'),
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(debtTypes),
  balance: z.number().min(0, 'Balance must be positive'),
  minimumPayment: z.number().min(0, 'Minimum payment must be positive'),
  paidAmount: z.number().min(0).optional().default(0),
});

export const updateDebtSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(debtTypes).optional(),
  balance: z.number().min(0).optional(),
  minimumPayment: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional(),
});

export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;