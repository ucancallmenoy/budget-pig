import mongoose, { Schema, Model } from 'mongoose';
import { Saving } from '@/types/saving';

interface SavingDocument extends Omit<Saving, '_id'>, mongoose.Document {}

const SavingSchema = new Schema<SavingDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    monthId: {
      type: String,
      required: false, 
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    savedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    goalType: {
      type: String,
      enum: ['monthly', 'long_term'],
      required: true,
      default: 'monthly',
    },
    targetDate: {
      type: Date,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    category: {
      type: String,
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

SavingSchema.index({ userId: 1, goalType: 1 });
SavingSchema.index({ userId: 1, monthId: 1 });

export const SavingModel: Model<SavingDocument> =
  mongoose.models.Saving || mongoose.model<SavingDocument>('Saving', SavingSchema);