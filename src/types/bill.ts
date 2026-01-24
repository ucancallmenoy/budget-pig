export type BillCategory = 
  | 'utilities'
  | 'rent'
  | 'insurance'
  | 'subscription'
  | 'loan'
  | 'other';

export type BillRecurrence = 'monthly' | 'yearly' | 'one_time';

export interface MonthlyBillPayment {
  monthId: string;
  amount: number;
  paidAt: Date;
}

export interface Bill {
  _id: string;
  userId: string;
  monthId: string; // The month when the bill was created
  name: string;
  category: BillCategory;
  amount: number;
  dueDate: number; // Day of month (1-31)
  isRecurring: boolean;
  recurrence: BillRecurrence;
  monthlyPayments: MonthlyBillPayment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBillInput {
  monthId: string;
  name: string;
  category: BillCategory;
  amount: number;
  dueDate: number;
  isRecurring?: boolean;
  recurrence?: BillRecurrence;
}

export interface UpdateBillInput {
  name?: string;
  category?: BillCategory;
  amount?: number;
  dueDate?: number;
  isRecurring?: boolean;
  recurrence?: BillRecurrence;
}

export interface RecordBillPaymentInput {
  billId: string;
  monthId: string;
  amount: number;
}