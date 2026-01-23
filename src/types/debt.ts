export type DebtType = 
  | 'credit_card'
  | 'student_loan'
  | 'personal_loan'
  | 'mortgage'
  | 'car_loan'
  | 'other';

export interface Debt {
  _id: string;
  userId: string;
  monthId: string;
  name: string;
  type: DebtType;
  balance: number;
  minimumPayment: number;
  paidAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDebtInput {
  monthId: string;
  name: string;
  type: DebtType;
  balance: number;
  minimumPayment: number;
  paidAmount?: number;
}

export interface UpdateDebtInput {
  name?: string;
  type?: DebtType;
  balance?: number;
  minimumPayment?: number;
  paidAmount?: number;
}