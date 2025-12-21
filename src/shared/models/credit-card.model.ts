export interface ICreditCard {
    id: string;
    displayName: string;
    monthlyChargeDate: number; // 1-31
    chargeAccountId: string;
    isVirtual?: boolean | null; // null = not specified
}
