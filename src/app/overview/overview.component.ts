import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AccountService } from '../../shared/services/account.service';
import { CreditCardService } from '../../shared/services/credit-card.service';
import { TransactionService } from '../../shared/services/transaction.service';
import { BudgetService } from '../../shared/services/budget.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { IExpense, IIncome } from '../../shared/models/transaction.model';
import { TransactionFormComponent, TransactionFormData } from '../transactions/transaction-form/transaction-form.component';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatDialogModule,
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
  private dialog = inject(MatDialog);
  private router = inject(Router);

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
    return 0; // Placeholder as discussed
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

  // --- Actions ---

  quickAddTransaction(type: 'expense' | 'income') {
    const dialogRef = this.dialog.open(TransactionFormComponent, {
      data: {
        type,
        accounts: this.accounts(),
        creditCards: this.cards().filter(c => c.status === 'active'),
        budgets: this.budgets()
      } as TransactionFormData,
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.type === 'expense') {
          this.transactionService.createExpense(result.data).subscribe();
        } else {
          this.transactionService.createIncome(result.data).subscribe();
        }
      }
    });
  }

  goToTransactions() {
    this.router.navigate(['/transactions']);
  }

  goToBudgets() {
    this.router.navigate(['/budgets']);
  }

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
