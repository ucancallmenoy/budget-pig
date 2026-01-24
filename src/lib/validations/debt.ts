import { z } from 'zod';

export const debtTypes = ['credit_card', 'student_loan', 'personal_loan', 'mortgage', 'car_loan', 'other'] as const;
export const paymentFrequencies = ['monthly', 'biweekly'] as const;

export const createDebtSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(debtTypes),
  originalBalance: z.number().min(0, 'Balance must be positive'),
  minimumPayment: z.number().min(0, 'Minimum payment must be positive'),
  durationMonths: z.number().min(1).optional().default(1),
  interestRate: z.number().min(0).optional().default(0),
  paymentFrequency: z.enum(paymentFrequencies),
  paymentDueDate: z.number().min(1).max(31),
  startMonth: z.number().min(1).max(12),
  startYear: z.number().min(2000).max(2100),
});

export const updateDebtSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(debtTypes).optional(),
  originalBalance: z.number().min(0).optional(),
  minimumPayment: z.number().min(0).optional(),
  durationMonths: z.number().min(1).optional(),
  interestRate: z.number().min(0).optional(),
  paymentFrequency: z.enum(paymentFrequencies).optional(),
  paymentDueDate: z.number().min(1).max(31).optional(),
});

export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;