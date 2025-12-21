export type PaymentMethod = 'cash' | 'credit' | 'account';

export interface IExpense {
    id: string;
    amount: number;
    description: string;
    executionDate: Date;
    budgetId: string;
    paymentMethod: PaymentMethod;
    creditCardId?: string; // Required when paymentMethod is 'credit'
    accountId?: string; // Required when paymentMethod is 'account'
}

export interface IIncome {
    id: string;
    amount: number;
    description?: string;
    receiptDate: Date;
    receivingAccountId: string;
}
