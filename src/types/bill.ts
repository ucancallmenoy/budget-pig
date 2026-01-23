export type BillCategory = 
  | 'utilities'
  | 'rent'
  | 'insurance'
  | 'subscription'
  | 'loan'
  | 'other';

export interface Bill {
  _id: string;
  userId: string;
  monthId: string;
  name: string;
  category: BillCategory;
  amount: number;
  dueDate: Date;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBillInput {
  monthId: string;
  name: string;
  category: BillCategory;
  amount: number;
  dueDate: Date;
  isPaid?: boolean;
}

export interface UpdateBillInput {
  name?: string;
  category?: BillCategory;
  amount?: number;
  dueDate?: Date;
  isPaid?: boolean;
}