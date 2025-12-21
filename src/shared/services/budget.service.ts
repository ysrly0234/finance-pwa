import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { IBudget } from '../models/budget.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private storage = inject(StorageService);
  private readonly STORAGE_KEY = 'budgets';

  getBudgets(): Observable<IBudget[]> {
    return this.storage.getItem<IBudget[]>(this.STORAGE_KEY).pipe(
      map(budgets => budgets || [])
    );
  }

  createBudget(budget: Omit<IBudget, 'id'>): Observable<IBudget> {
    const newBudget: IBudget = {
      ...budget,
      id: this.generateId()
    };

    return this.getBudgets().pipe(
      switchMap(budgets => {
        const updatedBudgets = [...budgets, newBudget];
        return this.storage.setItem(this.STORAGE_KEY, updatedBudgets).pipe(
          map(() => newBudget)
        );
      })
    );
  }

  updateBudget(updatedBudget: IBudget): Observable<IBudget> {
    console.log('Updating budget:', updatedBudget);
    return this.getBudgets().pipe(
      switchMap(budgets => {
        const index = budgets.findIndex(b => b.id === updatedBudget.id);
        if (index !== -1) {
          const updatedBudgets = [...budgets];
          updatedBudgets[index] = updatedBudget;
          return this.storage.setItem(this.STORAGE_KEY, updatedBudgets).pipe(
            map(() => updatedBudget)
          );
        }
        console.error('Budget not found for update:', updatedBudget.id);
        return throwError(() => new Error('Budget not found'));
      })
    );
  }

  deleteBudget(id: string): Observable<void> {
    console.log('Deleting budget with ID:', id);
    return this.getBudgets().pipe(
      switchMap(budgets => {
        console.log('Current budgets:', budgets);
        const index = budgets.findIndex(b => b.id === id);
        if (index !== -1) {
          const updatedBudgets = budgets.filter(b => b.id !== id);
          return this.storage.setItem(this.STORAGE_KEY, updatedBudgets);
        }
        console.error('Budget not found for delete:', id);
        return throwError(() => new Error('Budget not found'));
      })
    );
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}
