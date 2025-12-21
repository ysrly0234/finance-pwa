import { Injectable, inject } from '@angular/core';
import { Observable, of, map } from 'rxjs';
import { CreditCardCancellationReason, ICreditCard } from '../models/credit-card.model';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class CreditCardService {
    private storage = inject(StorageService);
    private readonly STORAGE_KEY = 'credit-cards';

    getCreditCards(): Observable<ICreditCard[]> {
        return this.storage.getItem<ICreditCard[]>(this.STORAGE_KEY).pipe(
            map(cards => cards || [])
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

    private generateId(): string {
        return `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
