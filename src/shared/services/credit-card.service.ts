import { Injectable, inject } from '@angular/core';
import { Observable, of, map } from 'rxjs';
import { CreditCardCancellationReason, ICreditCard, CreditCardStatus } from '../models/credit-card.model';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class CreditCardService {
    private storage = inject(StorageService);
    private readonly STORAGE_KEY = 'credit-cards';

    getCreditCards(): Observable<ICreditCard[]> {
        return this.storage.getItem<ICreditCard[]>(this.STORAGE_KEY).pipe(
            map(cards => {
                if (!cards) return [];

                let hasChanges = false;
                const updatedCards = cards.map(card => {
                    if (card.status === 'active' && card.expiryDate && this.isExpired(card.expiryDate)) {
                        hasChanges = true;
                        return {
                            ...card,
                            status: 'inactive' as CreditCardStatus,
                            cancellationReason: CreditCardCancellationReason.EXPIRED
                        };
                    }
                    return card;
                });

                if (hasChanges) {
                    this.storage.setItem(this.STORAGE_KEY, updatedCards).subscribe();
                }

                return updatedCards;
            })
        );
    }

    createCreditCard(cardData: Omit<ICreditCard, 'id' | 'status'>): Observable<ICreditCard> {
        const newCard: ICreditCard = {
            ...cardData,
            id: this.generateId(),
            status: 'active'
        };

        return this.getCreditCards().pipe(
            map(cards => {
                const updatedCards = [...cards, newCard];
                this.storage.setItem(this.STORAGE_KEY, updatedCards).subscribe();
                return newCard;
            })
        );
    }

    cancelCreditCard(id: string, reason: CreditCardCancellationReason, note?: string): Observable<void> {
        return this.getCreditCards().pipe(
            map(cards => {
                const index = cards.findIndex(c => c.id === id);
                if (index !== -1) {
                    const updatedCards = [...cards];
                    updatedCards[index] = {
                        ...updatedCards[index],
                        status: 'inactive',
                        cancellationReason: reason,
                        cancellationNote: note
                    };
                    this.storage.setItem(this.STORAGE_KEY, updatedCards).subscribe();
                }
            })
        );
    }

    reactivateCreditCard(id: string): Observable<void> {
        return this.getCreditCards().pipe(
            map(cards => {
                const index = cards.findIndex(c => c.id === id);
                if (index !== -1) {
                    const card = cards[index];

                    if (card.expiryDate && this.isExpired(card.expiryDate)) {
                        throw new Error('אי אפשר להפעיל מחדש כרטיס אשראי שתאריך התוקף שלו חלף');
                    }

                    const updatedCards = [...cards];
                    updatedCards[index] = {
                        ...updatedCards[index],
                        status: 'active',
                        cancellationReason: undefined,
                        cancellationNote: undefined
                    };
                    this.storage.setItem(this.STORAGE_KEY, updatedCards).subscribe();
                }
            })
        );
    }

    getCardsByAccount(accountId: string): Observable<ICreditCard[]> {
        return this.getCreditCards().pipe(
            map(cards => cards.filter(c => c.chargeAccountId === accountId))
        );
    }

    hasActiveCards(accountId: string): Observable<boolean> {
        return this.getCardsByAccount(accountId).pipe(
            map(cards => cards.some(c => c.status === 'active'))
        );
    }

    hasAnyCards(accountId: string): Observable<boolean> {
        return this.getCardsByAccount(accountId).pipe(
            map(cards => cards.length > 0)
        );
    }

    updateCreditCard(updatedCard: ICreditCard): Observable<ICreditCard> {
        return this.getCreditCards().pipe(
            map(cards => {
                const index = cards.findIndex(c => c.id === updatedCard.id);
                if (index !== -1) {
                    const updatedCards = [...cards];
                    updatedCards[index] = updatedCard;
                    this.storage.setItem(this.STORAGE_KEY, updatedCards).subscribe();
                }
                return updatedCard;
            })
        );
    }

    deleteCreditCard(id: string): Observable<void> {
        return this.getCreditCards().pipe(
            map(cards => {
                const updatedCards = cards.filter(c => c.id !== id);
                this.storage.setItem(this.STORAGE_KEY, updatedCards).subscribe();
            })
        );
    }

    private isExpired(expiryDate: string): boolean {
        const [month, year] = expiryDate.split('/').map(Number);
        if (!month || !year) return false;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed

        if (year < currentYear) return true;
        if (year === currentYear && month < currentMonth) return true;

        return false;
    }

    private generateId(): string {
        return `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
