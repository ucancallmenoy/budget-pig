import mongoose, { Schema, Model } from 'mongoose';

export interface BillOverride {
  _id: string;
  userId: string;
  billId: string;
  /** Period key like "2026-02" or "2026-02-P1" */
  periodKey: string;
  year: number;
  month: number;
  /** Overridden field values (partial bill fields) */
  overrides: {
    name?: string;
    category?: string;
    amount?: number;
    dueDate?: number;
  };
  /** If true, this bill is suppressed (hidden/deleted) for this period */
  isSuppressed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface BillOverrideDocument extends Omit<BillOverride, '_id'>, mongoose.Document {}

const BillOverrideSchema = new Schema<BillOverrideDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    billId: {
      type: String,
      required: true,
      index: true,
    },
    periodKey: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    overrides: {
      name: String,
      category: String,
      amount: Number,
      dueDate: Number,
    },
    isSuppressed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

BillOverrideSchema.index({ userId: 1, billId: 1, periodKey: 1 }, { unique: true });

export const BillOverrideModel: Model<BillOverrideDocument> =
  mongoose.models.BillOverride ||
  mongoose.model<BillOverrideDocument>('BillOverride', BillOverrideSchema);
