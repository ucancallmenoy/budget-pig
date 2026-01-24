export type DebtType = 
  | 'credit_card'
  | 'student_loan'
  | 'personal_loan'
  | 'mortgage'
  | 'car_loan'
  | 'other';

export type PaymentFrequency = 'monthly' | 'biweekly';

export interface MonthlyPayment {
  monthId: string;
  amount: number;
  paidAt: Date;
}

export interface Debt {
  _id: string;
  userId: string;
  name: string;
  type: DebtType;
  originalBalance: number;
  minimumPayment: number;
  monthlyPayments: MonthlyPayment[];
  durationMonths?: number;
  interestRate?: number;
  paymentFrequency: PaymentFrequency;
  paymentDueDate: number;
  lastPaymentDate?: Date;
  totalPaidAllTime: number;
  createdAt: Date;
  updatedAt: Date;
  startMonth: number;
  startYear: number;
}

export interface CreateDebtInput {
  name: string;
  type: DebtType;
  originalBalance: number;
  minimumPayment: number;
  durationMonths?: number;
  interestRate?: number;
  paymentFrequency: PaymentFrequency;
  paymentDueDate: number;
  startMonth: number;
  startYear: number;
}

export interface UpdateDebtInput {
  name?: string;
  type?: DebtType;
  originalBalance?: number;
  minimumPayment?: number;
  durationMonths?: number;
  interestRate?: number;
  paymentFrequency?: PaymentFrequency;
  paymentDueDate?: number;
}

export interface RecordDebtPaymentInput {
  debtId: string;
  monthId: string;
  amount: number;
}