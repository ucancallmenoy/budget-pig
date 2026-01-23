export interface Month {
  _id: string;
  userId: string;
  year: number;
  month: number; // 1-12
  totalIncome: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMonthInput {
  year: number;
  month: number;
  totalIncome: number;
}

export interface UpdateMonthInput {
  totalIncome?: number;
}