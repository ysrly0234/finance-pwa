export interface IAccountType {
    id: string;
    name: string;
    logoUrl?: string;
    category: 'bank' | 'digital-wallet' | 'other';
}

export type AccountStatus = 'active' | 'inactive';

export interface IAccount {
    id: string;
    name: string;
    accountType?: IAccountType;
    ownerIds: string[]; // User IDs
    status: AccountStatus;
}
