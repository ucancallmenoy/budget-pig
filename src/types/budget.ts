export interface CategoryBudget {
  _id: string;
  userId: string;
  year: number;
  month: number;
  category: string;
  budgetAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryBudgetInput {
  year: number;
  month: number;
  category: string;
  budgetAmount: number;
}

export interface UpdateCategoryBudgetInput {
  budgetAmount?: number;
}

export interface CategoryVariance {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  percentUsed: number;
}
