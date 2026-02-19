import mongoose, { Schema, Model } from 'mongoose';
import { Debt } from '@/types/debt';

interface DebtDocument extends Omit<Debt, '_id'>, mongoose.Document {}

const MonthlyPaymentSchema = new Schema({
  monthId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paidAt: {
    type: Date,
    default: Date.now,
  },
});

const DebtSchema = new Schema<DebtDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['credit_card', 'student_loan', 'personal_loan', 'mortgage', 'car_loan', 'other'],
    },
    originalBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumPayment: {
      type: Number,
      required: true,
      min: 0,
    },
    monthlyPayments: {
      type: [MonthlyPaymentSchema],
      default: [],
    },
    durationMonths: {
      type: Number,
      min: 1,
      default: 1,
    },
    interestRate: {
      type: Number,
      min: 0,
      default: 0,
    },
    paymentFrequency: {
      type: String,
      required: true,
      enum: ['monthly', 'biweekly', 'per_period'],
      default: 'monthly',
    },
    paymentDueDate: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },
    lastPaymentDate: {
      type: Date,
    },
    totalPaidAllTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    startMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    startYear: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

DebtSchema.index({ userId: 1 });
DebtSchema.index({ userId: 1, startYear: 1, startMonth: 1 });

export const DebtModel: Model<DebtDocument> =
  mongoose.models.Debt || mongoose.model<DebtDocument>('Debt', DebtSchema);