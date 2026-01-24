import mongoose, { Schema, Model } from 'mongoose';
import { Bill } from '@/types/bill';

interface BillDocument extends Omit<Bill, '_id'>, mongoose.Document {}

const MonthlyBillPaymentSchema = new Schema({
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

const BillSchema = new Schema<BillDocument>(
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
    category: {
      type: String,
      required: true,
      enum: ['utilities', 'rent', 'insurance', 'subscription', 'loan', 'other'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrence: {
      type: String,
      enum: ['monthly', 'yearly', 'one_time'],
      default: 'one_time',
    },
    monthlyPayments: {
      type: [MonthlyBillPaymentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

BillSchema.index({ userId: 1, monthId: 1 });
BillSchema.index({ userId: 1, isRecurring: 1 });

export const BillModel: Model<BillDocument> =
  mongoose.models.Bill || mongoose.model<BillDocument>('Bill', BillSchema);