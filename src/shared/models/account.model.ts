export interface IAccountType {
    id: string;
    name: string;
    logoUrl?: string;
    category: 'bank' | 'digital-wallet' | 'other';
}

export interface IAccount {
    id: string;
    name: string;
    accountType?: IAccountType;
    ownerIds: string[]; // User IDs
}
