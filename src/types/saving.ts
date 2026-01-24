export type SavingGoalType = 'monthly' | 'long_term';

export interface Saving {
  _id: string;
  userId: string;
  monthId?: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  goalType: SavingGoalType;
  targetDate?: Date; 
  startDate: Date;
  category?: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSavingInput {
  monthId?: string;
  name: string;
  targetAmount: number;
  savedAmount?: number;
  goalType: SavingGoalType;
  targetDate?: Date;
  category?: string;
}

export interface UpdateSavingInput {
  name?: string;
  targetAmount?: number;
  savedAmount?: number;
  goalType?: SavingGoalType;
  targetDate?: Date;
  category?: string;
  isCompleted?: boolean;
}

export interface SavingContribution {
  _id: string;
  savingId: string;
  amount: number;
  date: Date;
  note?: string;
}