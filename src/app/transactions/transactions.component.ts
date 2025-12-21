import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { TransactionService } from '../../shared/services/transaction.service';
import { AccountService } from '../../shared/services/account.service';
import { CreditCardService } from '../../shared/services/credit-card.service';
import { BudgetService } from '../../shared/services/budget.service';
import { IExpense, IIncome, TransactionTargetType } from '../../shared/models/transaction.model';
import { TransactionFormComponent, TransactionFormData } from './transaction-form/transaction-form.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { toSignal } from '@angular/core/rxjs-interop';

interface MonthlyTransactions {
  date: Date;
  transactions: (IExpense | IIncome)[];
  totalIncome: number;
  totalExpense: number;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatChipsModule,
    MatCardModule,
    MatMenuModule,
    MatExpansionModule
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent {
  private transactionService = inject(TransactionService);
  private accountService = inject(AccountService);
  private cardService = inject(CreditCardService);
  private budgetService = inject(BudgetService);
  private dialog = inject(MatDialog);

  transactions = toSignal(this.transactionService.getAllTransactions(), { initialValue: [] });
  accounts = toSignal(this.accountService.getAccounts(), { initialValue: [] });
  cards = toSignal(this.cardService.getCreditCards(), { initialValue: [] });
  budgets = toSignal(this.budgetService.getBudgets(), { initialValue: [] });

  currentYear = signal(new Date().getFullYear());

  // Helper because months in JS are 0-indexed
  private monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  getMonthName(date: Date): string {
    return this.monthNames[date.getMonth()];
  }

  groupedTransactions = computed<MonthlyTransactions[]>(() => {
    const year = this.currentYear();
    const all = this.transactions();

    // 1. Filter by Year
    const byYear = all.filter(t => {
      const date = this.getDate(t);
      return date.getFullYear() === year;
    });

    // 2. Group by Month
    const groups = new Map<number, (IExpense | IIncome)[]>();
    byYear.forEach(t => {
      const month = this.getDate(t).getMonth();
      if (!groups.has(month)) {
        groups.set(month, []);
      }
      groups.get(month)!.push(t);
    });

    // 3. Construct Result
    // Goal: Show months from [MaxMonth] down to 0.
    // If year === currentYear, MaxMonth = currentMonth.
    // If year < currentYear, MaxMonth = 11 (December).
    // If year > currentYear, show nothing (or handled by empty state if user navigated there? User said "future months not appear").

    const now = new Date();
    const currentYr = now.getFullYear();
    const currentMth = now.getMonth();

    let maxMonth = 11;

    if (year === currentYr) {
      maxMonth = currentMth;
    } else if (year > currentYr) {
      return []; // Future year - show nothing? Or maybe just don't show future months? 
      // If user created a future transaction, they might want to see it, but requirements say "Future months... not appear".
      // Let's stick to: if year > currentYear, we return empty, OR we only show months that HAVE data?
      // User said: "months that passed... should appear". Implies future ones shouldn't.
      // But if I have a transaction in future? 
      // Current implementation behavior:
      // If I have transaction in future year, it WOULD appear because I iterate map keys.
      // New requirement focus: "Empty past months SHOULD appear".
      // So I will iterate 0..maxMonth. 
      // But I should also check if there are any transactions in future months (grouped) and arguably show them?
      // Strict interpretation: Only show months <= Now.
      // If data exists in future, it won't optionally appear unless I check the map keys too.
      // I'll stick to the "Past/Present" rule for empty months.
      // If there is data in a future month, I should probably show it (it's not "empty").

      // Logic: Union of (0..maxMonth) AND (keys in groups).
      // Then sort descending.
    }

    const monthsToShow = new Set<number>();

    // Add all months from 0 to maxMonth (if year <= currentYear)
    if (year <= currentYr) {
      for (let i = 0; i <= maxMonth; i++) {
        monthsToShow.add(i);
      }
    }

    // Add any months that actually have data (even if future, just in case user added one)
    for (const m of groups.keys()) {
      monthsToShow.add(m);
    }

    // If it's pure future year (year > currentYr), the loop above handles it (only months with data appear).

    const sortedMonths = Array.from(monthsToShow).sort((a, b) => b - a);

    const result: MonthlyTransactions[] = [];

    sortedMonths.forEach(month => {
      // Filter out future months if they are empty? 
      // The set construction handles this: we only added 0..maxMonth for current/past years. 
      // Future months only added if they have data.

      // Additional check for current year: if month > currentMonth and NO data, don't show.
      if (year === currentYr && month > currentMth && !groups.has(month)) {
        return;
      }

      const monthTransactions = groups.get(month) || [];

      // Sort transactions execution date desc
      monthTransactions.sort((a, b) => this.getDate(b).getTime() - this.getDate(a).getTime());

      const totalIncome = monthTransactions
        .filter(t => !this.isExpense(t))
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = monthTransactions
        .filter(t => this.isExpense(t))
        .reduce((sum, t) => sum + t.amount, 0);

      result.push({
        date: new Date(year, month, 1),
        transactions: monthTransactions,
        totalIncome,
        totalExpense
      });
    });

    return result;
  });

  // Calculate generic yearly totals if needed, or we rely on the monthly breakdown
  totalYearIncome = computed(() => {
    return this.groupedTransactions().reduce((sum, g) => sum + g.totalIncome, 0);
  });

  totalYearExpenses = computed(() => {
    return this.groupedTransactions().reduce((sum, g) => sum + g.totalExpense, 0);
  });

  prevYear() {
    this.currentYear.update(y => y - 1);
  }

  nextYear() {
    this.currentYear.update(y => y + 1);
  }

  openExpenseForm() {
    this.openForm('expense');
  }

  openIncomeForm() {
    this.openForm('income');
  }

  private openForm(type: 'expense' | 'income') {
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

  editTransaction(t: IExpense | IIncome) {
    const type = this.isExpense(t) ? 'expense' : 'income';
    const dialogRef = this.dialog.open(TransactionFormComponent, {
      data: {
        transaction: t,
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
          this.transactionService.updateExpense(result.data).subscribe();
        } else {
          this.transactionService.updateIncome(result.data).subscribe();
        }
      }
    });
  }

  deleteTransaction(t: IExpense | IIncome) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'מחיקת תנועה',
        message: 'האם אתה בטוח שברצונך למחוק תנועה זו?',
        confirmText: 'מחק',
        cancelText: 'ביטול'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        if ('executionDate' in t) {
          this.transactionService.deleteExpense(t.id).subscribe();
        } else {
          this.transactionService.deleteIncome(t.id).subscribe();
        }
      }
    });
  }

  isExpense(t: IExpense | IIncome): t is IExpense {
    return 'executionDate' in t;
  }

  getDate(t: IExpense | IIncome): Date {
    return this.isExpense(t) ? t.executionDate : t.receiptDate;
  }

  getBudgetName(id?: string): string {
    if (!id) return '';
    return this.budgets().find(b => b.id === id)?.name || 'לא ידוע';
  }

  getBudgetId(t: IExpense | IIncome): string | undefined {
    return this.isExpense(t) ? t.budgetId : undefined;
  }

  getCreditCardId(t: IExpense | IIncome): string | undefined {
    return this.isExpense(t) ? t.creditCardId : undefined;
  }

  getTargetType(t: IExpense | IIncome): string | undefined {
    return !this.isExpense(t) ? (t as IIncome).targetType : undefined;
  }

  getReceivingAccountId(t: IExpense | IIncome): string | undefined {
    return !this.isExpense(t) ? (t as IIncome).receivingAccountId : undefined;
  }

  getReceivingCreditCardId(t: IExpense | IIncome): string | undefined {
    return !this.isExpense(t) ? (t as IIncome).receivingCreditCardId : undefined;
  }

  getAccountName(id?: string): string {
    if (!id) return '';
    return this.accounts().find(a => a.id === id)?.name || 'לא ידוע';
  }

  getCardName(id?: string): string {
    if (!id) return '';
    return this.cards().find(c => c.id === id)?.displayName || 'לא ידוע';
  }
}
