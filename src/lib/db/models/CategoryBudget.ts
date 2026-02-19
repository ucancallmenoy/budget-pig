import mongoose, { Schema, Model } from 'mongoose';
import { CategoryBudget } from '@/types/budget';

interface CategoryBudgetDocument extends Omit<CategoryBudget, '_id'>, mongoose.Document {}

const CategoryBudgetSchema = new Schema<CategoryBudgetDocument>(
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
    category: {
      type: String,
      required: true,
      trim: true,
    },
    budgetAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

CategoryBudgetSchema.index({ userId: 1, year: 1, month: 1 });
CategoryBudgetSchema.index({ userId: 1, year: 1, month: 1, category: 1 }, { unique: true });

export const CategoryBudgetModel: Model<CategoryBudgetDocument> =
  mongoose.models.CategoryBudget ||
  mongoose.model<CategoryBudgetDocument>('CategoryBudget', CategoryBudgetSchema);
