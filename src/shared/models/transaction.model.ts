// Payment method is now largely redundant for expenses as they are strictly credit card based in this version,
// but we keep the concept for Income target types.
export type TransactionTargetType = 'account' | 'card';

export interface IExpense {
    id: string;
    amount: number;
    description: string;
    executionDate: Date;
    budgetId: string; // Required: Every expense must be linked to a budget
    paymentMethod: TransactionTargetType; // 'card' or 'account' (for cash/transfer)
    creditCardId?: string; // Required if paymentMethod is 'card'
    paymentAccountId?: string; // Required if paymentMethod is 'account'
}

export interface IIncome {
    id: string;
    amount: number;
    description?: string;
    receiptDate: Date;
    targetType: TransactionTargetType;
    receivingAccountId?: string; // Required if targetType is 'account'
    receivingCreditCardId?: string; // Required if targetType is 'card' (refund)
}
