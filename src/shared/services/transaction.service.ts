import { Injectable, inject } from '@angular/core';
import { Observable, map, combineLatest, BehaviorSubject, switchMap, tap, of } from 'rxjs';
import { IExpense, IIncome } from '../models/transaction.model';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class TransactionService {
    private storage = inject(StorageService);
    private readonly EXPENSES_KEY = 'expenses';
    private readonly INCOMES_KEY = 'incomes';

    private refresh$ = new BehaviorSubject<void>(undefined);

    getExpenses(): Observable<IExpense[]> {
        return this.refresh$.pipe(
            switchMap(() => this.storage.getItem<IExpense[]>(this.EXPENSES_KEY)),
            map(expenses => (expenses || []).map(e => ({
                ...e,
                executionDate: new Date(e.executionDate)
            })))
        );
    }

    getIncomes(): Observable<IIncome[]> {
        return this.refresh$.pipe(
            switchMap(() => this.storage.getItem<IIncome[]>(this.INCOMES_KEY)),
            map(incomes => (incomes || []).map(i => ({
                ...i,
                receiptDate: new Date(i.receiptDate)
            })))
        );
    }

    getAllTransactions(): Observable<(IExpense | IIncome)[]> {
        return combineLatest([this.getExpenses(), this.getIncomes()]).pipe(
            map(([expenses, incomes]) => {
                const all = [...expenses, ...incomes];
                return all.sort((a, b) => {
                    const dateA = 'executionDate' in a ? a.executionDate : (a as IIncome).receiptDate;
                    const dateB = 'executionDate' in b ? b.executionDate : (b as IIncome).receiptDate;
                    return dateB.getTime() - dateA.getTime();
                });
            })
        );
    }

    createExpense(expenseData: Omit<IExpense, 'id'>): Observable<IExpense> {
        const newExpense: IExpense = {
            ...expenseData,
            id: this.generateId('exp')
        };

        // We need to fetch current state *once* to append, avoiding the infinite loop of refresh$
        return this.storage.getItem<IExpense[]>(this.EXPENSES_KEY).pipe(
            map(expenses => (expenses || [])),
            switchMap(expenses => {
                const updatedExpenses = [...expenses, newExpense];
                return this.storage.setItem(this.EXPENSES_KEY, updatedExpenses);
            }),
            map(() => newExpense),
            tap(() => this.refresh$.next(undefined))
        );
    }

    updateExpense(updatedExpense: IExpense): Observable<IExpense> {
        return this.storage.getItem<IExpense[]>(this.EXPENSES_KEY).pipe(
            map(expenses => (expenses || [])),
            switchMap(expenses => {
                const index = expenses.findIndex(e => e.id === updatedExpense.id);
                if (index !== -1) {
                    const updatedExpenses = [...expenses];
                    updatedExpenses[index] = updatedExpense;
                    return this.storage.setItem(this.EXPENSES_KEY, updatedExpenses);
                }
                return of(undefined);
            }),
            map(() => updatedExpense),
            tap(() => this.refresh$.next(undefined))
        );
    }

    deleteExpense(id: string): Observable<void> {
        return this.storage.getItem<IExpense[]>(this.EXPENSES_KEY).pipe(
            map(expenses => (expenses || [])),
            switchMap(expenses => {
                const updatedExpenses = expenses.filter(e => e.id !== id);
                return this.storage.setItem(this.EXPENSES_KEY, updatedExpenses);
            }),
            map(() => undefined),
            tap(() => this.refresh$.next(undefined))
        );
    }

    createIncome(incomeData: Omit<IIncome, 'id'>): Observable<IIncome> {
        const newIncome: IIncome = {
            ...incomeData,
            id: this.generateId('inc')
        };

        return this.storage.getItem<IIncome[]>(this.INCOMES_KEY).pipe(
            map(incomes => (incomes || [])),
            switchMap(incomes => {
                const updatedIncomes = [...incomes, newIncome];
                return this.storage.setItem(this.INCOMES_KEY, updatedIncomes);
            }),
            map(() => newIncome),
            tap(() => this.refresh$.next(undefined))
        );
    }

    updateIncome(updatedIncome: IIncome): Observable<IIncome> {
        return this.storage.getItem<IIncome[]>(this.INCOMES_KEY).pipe(
            map(incomes => (incomes || [])),
            switchMap(incomes => {
                const index = incomes.findIndex(i => i.id === updatedIncome.id);
                if (index !== -1) {
                    const updatedIncomes = [...incomes];
                    updatedIncomes[index] = updatedIncome;
                    return this.storage.setItem(this.INCOMES_KEY, updatedIncomes);
                }
                return of(undefined);
            }),
            map(() => updatedIncome),
            tap(() => this.refresh$.next(undefined))
        );
    }

    deleteIncome(id: string): Observable<void> {
        return this.storage.getItem<IIncome[]>(this.INCOMES_KEY).pipe(
            map(incomes => (incomes || [])),
            switchMap(incomes => {
                const updatedIncomes = incomes.filter(i => i.id !== id);
                return this.storage.setItem(this.INCOMES_KEY, updatedIncomes);
            }),
            map(() => undefined),
            tap(() => this.refresh$.next(undefined))
        );
    }

    private generateId(prefix: string): string {
        return `${prefix} -${Date.now()} -${Math.random().toString(36).substr(2, 9)} `;
    }
}
