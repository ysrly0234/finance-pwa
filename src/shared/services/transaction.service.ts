import { Injectable, inject } from '@angular/core';
import { Observable, map, combineLatest } from 'rxjs';
import { IExpense, IIncome } from '../models/transaction.model';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class TransactionService {
    private storage = inject(StorageService);
    private readonly EXPENSES_KEY = 'expenses';
    private readonly INCOMES_KEY = 'incomes';

    getExpenses(): Observable<IExpense[]> {
        return this.storage.getItem<IExpense[]>(this.EXPENSES_KEY).pipe(
            map(expenses => (expenses || []).map(e => ({
                ...e,
                executionDate: new Date(e.executionDate)
            })))
        );
    }

    getIncomes(): Observable<IIncome[]> {
        return this.storage.getItem<IIncome[]>(this.INCOMES_KEY).pipe(
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
                    const dateA = 'executionDate' in a ? a.executionDate : a.receiptDate;
                    const dateB = 'executionDate' in b ? b.executionDate : b.receiptDate;
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

        return this.getExpenses().pipe(
            map(expenses => {
                const updatedExpenses = [...expenses, newExpense];
                this.storage.setItem(this.EXPENSES_KEY, updatedExpenses).subscribe();
                return newExpense;
            })
        );
    }

    updateExpense(updatedExpense: IExpense): Observable<IExpense> {
        return this.getExpenses().pipe(
            map(expenses => {
                const index = expenses.findIndex(e => e.id === updatedExpense.id);
                if (index !== -1) {
                    const updatedExpenses = [...expenses];
                    updatedExpenses[index] = updatedExpense;
                    this.storage.setItem(this.EXPENSES_KEY, updatedExpenses).subscribe();
                }
                return updatedExpense;
            })
        );
    }

    deleteExpense(id: string): Observable<void> {
        return this.getExpenses().pipe(
            map(expenses => {
                const updatedExpenses = expenses.filter(e => e.id !== id);
                this.storage.setItem(this.EXPENSES_KEY, updatedExpenses).subscribe();
            })
        );
    }

    createIncome(incomeData: Omit<IIncome, 'id'>): Observable<IIncome> {
        const newIncome: IIncome = {
            ...incomeData,
            id: this.generateId('inc')
        };

        return this.getIncomes().pipe(
            map(incomes => {
                const updatedIncomes = [...incomes, newIncome];
                this.storage.setItem(this.INCOMES_KEY, updatedIncomes).subscribe();
                return newIncome;
            })
        );
    }

    updateIncome(updatedIncome: IIncome): Observable<IIncome> {
        return this.getIncomes().pipe(
            map(incomes => {
                const index = incomes.findIndex(i => i.id === updatedIncome.id);
                if (index !== -1) {
                    const updatedIncomes = [...incomes];
                    updatedIncomes[index] = updatedIncome;
                    this.storage.setItem(this.INCOMES_KEY, updatedIncomes).subscribe();
                }
                return updatedIncome;
            })
        );
    }

    deleteIncome(id: string): Observable<void> {
        return this.getIncomes().pipe(
            map(incomes => {
                const updatedIncomes = incomes.filter(i => i.id !== id);
                this.storage.setItem(this.INCOMES_KEY, updatedIncomes).subscribe();
            })
        );
    }

    private generateId(prefix: string): string {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
