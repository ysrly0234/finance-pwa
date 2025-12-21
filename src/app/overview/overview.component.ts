import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AccountService } from '../../shared/services/account.service';
import { CreditCardService } from '../../shared/services/credit-card.service';
import { TransactionService } from '../../shared/services/transaction.service';
import { BudgetService } from '../../shared/services/budget.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { IExpense, IIncome } from '../../shared/models/transaction.model';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    RouterModule,
    BaseChartDirective
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

  private monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  // --- Summary Cards Logic ---

  totalBalance = computed(() => {
    // Note: IAccount doesn't have a balance field in the interface provided earlier,
    // assuming it might have 'balance' or we sum something else.
    // Based on previous error, IAccount has NO balance.
    // I will sum Income - Expense of all time? Or just display 0/Placeholder if data missing.
    // For now, let's sum up all accounts if they had initial balance??
    // Actually, Accounts usually have a balance. If the model is missing it, I used 0 previously.
    // I'll stick to 0 to avoid error until model is fixed.
    return 0;
  });

  currentMonthStats = computed(() => {
    const now = new Date();
    const currentMonthTransactions = this.transactions().filter(t => {
      const date = this.getDate(t);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const income = currentMonthTransactions
      .filter(t => !this.isExpense(t))
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = currentMonthTransactions
      .filter(t => this.isExpense(t))
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expense };
  });

  // --- Bar Chart: Income vs Expenses (Last 6 Months) ---

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' }
    }
  };
  public barChartType: ChartType = 'bar';

  barChartData = computed<ChartData<'bar'>>(() => {
    const all = this.transactions();
    const now = new Date();
    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];

    // Iterate last 6 months (including current)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(this.monthNames[d.getMonth()]);

      const monthTrans = all.filter(t => {
        const date = this.getDate(t);
        return date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
      });

      const inc = monthTrans.filter(t => !this.isExpense(t)).reduce((s, t) => s + t.amount, 0);
      const exp = monthTrans.filter(t => this.isExpense(t)).reduce((s, t) => s + t.amount, 0);

      incomeData.push(inc);
      expenseData.push(exp);
    }

    return {
      labels: labels,
      datasets: [
        { data: incomeData, label: 'הכנסות', backgroundColor: '#10b981', borderRadius: 4 },
        { data: expenseData, label: 'הוצאות', backgroundColor: '#ef4444', borderRadius: 4 }
      ]
    };
  });

  // --- Pie Chart: Expenses by Budget (Current Month) ---

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };
  public pieChartType: ChartType = 'doughnut';

  pieChartData = computed<ChartData<'doughnut'>>(() => {
    const now = new Date();
    const expenses = this.transactions().filter(t => {
      const date = this.getDate(t);
      return this.isExpense(t) &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();
    }) as IExpense[];

    const budgetMap = new Map<string, number>();
    const budgets = this.budgets();

    expenses.forEach(e => {
      const budgetName = budgets.find(b => b.id === e.budgetId)?.name || 'אחר';
      budgetMap.set(budgetName, (budgetMap.get(budgetName) || 0) + e.amount);
    });

    return {
      labels: Array.from(budgetMap.keys()),
      datasets: [{
        data: Array.from(budgetMap.values()),
        backgroundColor: [
          '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308',
          '#22c55e', '#06b6d4', '#64748b'
        ]
      }]
    };
  });

  // --- Recent Transactions ---
  recentTransactions = computed(() => {
    // Sorted by date desc
    const sorted = [...this.transactions()].sort((a, b) =>
      this.getDate(b).getTime() - this.getDate(a).getTime()
    );
    return sorted.slice(0, 5);
  });

  // --- Helpers ---

  isExpense(t: IExpense | IIncome): t is IExpense {
    return 'executionDate' in t;
  }

  getDate(t: IExpense | IIncome): Date {
    return this.isExpense(t) ? t.executionDate : t.receiptDate;
  }
}
