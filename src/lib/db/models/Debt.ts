import mongoose, { Schema, Model } from 'mongoose';
import { Debt } from '@/types/debt';

interface DebtDocument extends Omit<Debt, '_id'>, mongoose.Document {}

const DebtSchema = new Schema<DebtDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    monthId: {
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
    balance: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumPayment: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

DebtSchema.index({ userId: 1, monthId: 1 });

export const DebtModel: Model<DebtDocument> =
  mongoose.models.Debt || mongoose.model<DebtDocument>('Debt', DebtSchema);