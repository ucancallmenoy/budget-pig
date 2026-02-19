import mongoose, { Schema, Model } from 'mongoose';
import { Transaction } from '@/types/transaction';

interface TransactionDocument extends Omit<Transaction, '_id'>, mongoose.Document {}

const TransactionSchema = new Schema<TransactionDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['income', 'bill_payment', 'debt_payment', 'savings_contribution', 'expense', 'adjustment'],
    },
    direction: {
      type: String,
      required: true,
      enum: ['in', 'out'],
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    period: {
      type: String,
      required: true,
      enum: ['P1', 'P2'],
    },
    monthId: {
      type: String,
      index: true,
    },
    relatedId: {
      type: String,
    },
    relatedModel: {
      type: String,
      enum: ['Bill', 'Debt', 'Saving'],
    },
    category: {
      type: String,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

TransactionSchema.index({ userId: 1, year: 1, month: 1, period: 1 });
TransactionSchema.index({ userId: 1, year: 1, month: 1 });
TransactionSchema.index({ userId: 1, relatedId: 1 });
TransactionSchema.index({ userId: 1, type: 1, year: 1, month: 1 });

export const TransactionModel: Model<TransactionDocument> =
  mongoose.models.Transaction ||
  mongoose.model<TransactionDocument>('Transaction', TransactionSchema);
