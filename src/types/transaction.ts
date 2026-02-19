export type TransactionType =
  | 'income'
  | 'bill_payment'
  | 'debt_payment'
  | 'savings_contribution'
  | 'expense'
  | 'adjustment';

export type TransactionDirection = 'in' | 'out';

export interface Transaction {
  _id: string;
  userId: string;
  type: TransactionType;
  direction: TransactionDirection;
  amount: number;
  date: Date;
  year: number;
  month: number;
  period: 'P1' | 'P2';
  monthId?: string;
  relatedId?: string;
  relatedModel?: 'Bill' | 'Debt' | 'Saving';
  category?: string;
  description: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionInput {
  type: TransactionType;
  direction: TransactionDirection;
  amount: number;
  date?: Date;
  year: number;
  month: number;
  period: 'P1' | 'P2';
  monthId?: string;
  relatedId?: string;
  relatedModel?: 'Bill' | 'Debt' | 'Saving';
  category?: string;
  description: string;
  note?: string;
}
