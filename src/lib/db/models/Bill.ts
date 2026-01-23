import mongoose, { Schema, Model } from 'mongoose';
import { Bill } from '@/types/bill';

interface BillDocument extends Omit<Bill, '_id'>, mongoose.Document {}

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
      type: Date,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

BillSchema.index({ userId: 1, monthId: 1 });

export const BillModel: Model<BillDocument> =
  mongoose.models.Bill || mongoose.model<BillDocument>('Bill', BillSchema);