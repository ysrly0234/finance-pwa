export type CreditCardStatus = 'active' | 'inactive';

export enum CreditCardCancellationReason {
    CANCELLED = 'cancelled',
    EXPIRED = 'expired',
    LOST_OR_STOLEN = 'lostOrStolen',
    OTHER = 'other'
}

export interface ICreditCard {
    id: string;
    displayName: string;
    monthlyChargeDate: number; // 1-31
    chargeAccountId: string;
    isVirtual?: boolean | null; // null = not specified
    status: CreditCardStatus;
    cancellationReason?: CreditCardCancellationReason;
    cancellationNote?: string;
    expiryDate?: string; // MM/YYYY
}
