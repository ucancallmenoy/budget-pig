import mongoose, { Schema, Model } from 'mongoose';
import { Month } from '@/types/month';

interface MonthDocument extends Omit<Month, '_id'>, mongoose.Document {}

const MonthSchema = new Schema<MonthDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
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
    totalIncome: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

MonthSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

export const MonthModel: Model<MonthDocument> =
  mongoose.models.Month || mongoose.model<MonthDocument>('Month', MonthSchema);