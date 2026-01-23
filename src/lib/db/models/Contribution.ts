import mongoose, { Schema, Model } from 'mongoose';
import { SavingContribution } from '@/types/saving';

interface SavingContributionDocument extends Omit<SavingContribution, '_id'>, mongoose.Document {}

const SavingContributionSchema = new Schema<SavingContributionDocument>(
  {
    savingId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SavingContributionModel: Model<SavingContributionDocument> =
  mongoose.models.SavingContribution || 
  mongoose.model<SavingContributionDocument>('SavingContribution', SavingContributionSchema);