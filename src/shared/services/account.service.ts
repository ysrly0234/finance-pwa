import { Injectable, inject } from '@angular/core';
import { Observable, of, map } from 'rxjs';
import { IAccount, IAccountType } from '../models/account.model';
import { StorageService } from './storage.service';
import { UserService } from './user.service';
import { CreditCardService } from './credit-card.service';

@Injectable({
    providedIn: 'root'
})
export class AccountService {
    private storage = inject(StorageService);
    private userService = inject(UserService);
    private creditCardService = inject(CreditCardService);
    private readonly STORAGE_KEY = 'accounts';

    // Hard-coded account types (will be moved to Firebase later)
    private accountTypes: IAccountType[] = [
        { id: 'leumi', name: 'בנק לאומי', category: 'bank', logoUrl: '/assets/banks/leumi.png' },
        { id: 'hapoalim', name: 'בנק הפועלים', category: 'bank', logoUrl: '/assets/banks/hapoalim.png' },
        { id: 'mizrahi', name: 'בנק מזרחי טפחות', category: 'bank', logoUrl: '/assets/banks/mizrahi.png' },
        { id: 'discount', name: 'בנק דיסקונט', category: 'bank', logoUrl: '/assets/banks/discount.png' },
        { id: 'bit', name: 'Bit', category: 'digital-wallet', logoUrl: '/assets/wallets/bit.png' },
        { id: 'paybox', name: 'PayBox', category: 'digital-wallet', logoUrl: '/assets/wallets/paybox.png' },
        { id: 'paypal', name: 'PayPal', category: 'digital-wallet', logoUrl: '/assets/wallets/paypal.png' }
    ];

    getAccountTypes(): IAccountType[] {
        return this.accountTypes;
    }

    getAccounts(): Observable<IAccount[]> {
        return this.storage.getItem<IAccount[]>(this.STORAGE_KEY).pipe(
            map(accounts => accounts || [])
        );
    }

    createAccount(accountData: Omit<IAccount, 'id' | 'status'>): Observable<IAccount> {
        const newAccount: IAccount = {
            ...accountData,
            id: this.generateId(),
            ownerIds: accountData.ownerIds?.length ? accountData.ownerIds : [this.userService.user().id],
            status: 'active'
        };

        return this.getAccounts().pipe(
            map(accounts => {
                const updatedAccounts = [...accounts, newAccount];
                this.storage.setItem(this.STORAGE_KEY, updatedAccounts).subscribe();
                return newAccount;
            })
        );
    }

    updateAccount(updatedAccount: IAccount): Observable<IAccount> {
        return this.getAccounts().pipe(
            map(accounts => {
                const index = accounts.findIndex(a => a.id === updatedAccount.id);
                if (index !== -1) {
                    const updatedAccounts = [...accounts];
                    updatedAccounts[index] = updatedAccount;
                    this.storage.setItem(this.STORAGE_KEY, updatedAccounts).subscribe();
                }
                return updatedAccount;
            })
        );
    }

    closeAccount(id: string): Observable<void> {
        return this.creditCardService.hasActiveCards(id).pipe(
            map(hasActive => {
                if (hasActive) {
                    throw new Error('אי אפשר להפוך חשבון ללא פעיל כשיש לו כרטיסי אשראי פעילים');
                }
            }),
            map(() => {
                this.getAccounts().subscribe(accounts => {
                    const index = accounts.findIndex(a => a.id === id);
                    if (index !== -1) {
                        const updatedAccounts = [...accounts];
                        updatedAccounts[index] = { ...updatedAccounts[index], status: 'inactive' };
                        this.storage.setItem(this.STORAGE_KEY, updatedAccounts).subscribe();
                    }
                });
            })
        );
    }

    deleteAccount(id: string): Observable<void> {
        return this.creditCardService.hasAnyCards(id).pipe(
            map(hasCards => {
                if (hasCards) {
                    throw new Error('אי אפשר למחוק חשבון שמקושר אליו כרטיס אשראי');
                }
            }),
            map(() => {
                this.getAccounts().subscribe(accounts => {
                    const updatedAccounts = accounts.filter(a => a.id !== id);
                    this.storage.setItem(this.STORAGE_KEY, updatedAccounts).subscribe();
                });
            })
        );
    }

    private generateId(): string {
        return `account-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
