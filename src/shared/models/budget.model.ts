export interface IBudgetCycle {
  type: 'monthly' | 'bi-monthly' | 'yearly' | 'custom';
  customValue?: number;
  customUnit?: 'month' | 'year';
}

export interface IBudget {
  id: string;
  name: string;
  description?: string;
  cycle: IBudgetCycle;
  amount: number;
  isAccumulating: boolean;
  importance: 'high' | 'medium' | 'low';
}
