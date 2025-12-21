import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { AccountService } from '../../shared/services/account.service';
import { CreditCardService } from '../../shared/services/credit-card.service';
import { TransactionService } from '../../shared/services/transaction.service';
import { BudgetService } from '../../shared/services/budget.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    RouterModule
  ],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent {
  private accountService = inject(AccountService);
  private cardService = inject(CreditCardService);
  private transactionService = inject(TransactionService);
  private budgetService = inject(BudgetService);

  accounts = toSignal(this.accountService.getAccounts(), { initialValue: [] });
  cards = toSignal(this.cardService.getCreditCards(), { initialValue: [] });
  transactions = toSignal(this.transactionService.getAllTransactions(), { initialValue: [] });
  budgets = toSignal(this.budgetService.getBudgets(), { initialValue: [] });

  totalBalance = computed(() => {
    return 0; // this.accounts().reduce((acc, curr) => acc + curr.balance, 0);
  });

  monthlyExpenses = computed(() => {
    const now = new Date();
    return this.transactions()
      .filter(t => {
        const date = 'executionDate' in t ? t.executionDate : t.receiptDate;
        return date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear() &&
          'executionDate' in t; // Only expenses
      })
      .reduce((acc, curr) => acc + curr.amount, 0);
  });

  monthlyBudget = computed(() => {
    // Simplified budget calculation (sum of all monthly budget amounts)
    return this.budgets()
      .filter(b => b.cycle.type === 'monthly')
      .reduce((acc, b) => acc + b.amount, 0);
  });

  budgetProgress = computed(() => {
    const budget = this.monthlyBudget();
    if (budget === 0) return 0;
    return (this.monthlyExpenses() / budget) * 100;
  });

  recentTransactions = computed(() => {
    return this.transactions().slice(0, 5);
  });
}
