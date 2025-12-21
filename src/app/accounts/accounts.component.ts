import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { IAccount } from '../../shared/models/account.model';
import { AccountService } from '../../shared/services/account.service';
import { CreditCardService } from '../../shared/services/credit-card.service';
import { AccountFormComponent } from './account-form/account-form.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss'
})
export class AccountsComponent implements OnInit {
  private accountService = inject(AccountService);
  private creditCardService = inject(CreditCardService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  accounts = signal<IAccount[]>([]);
  isLoading = signal(false);
  showInactive = signal(false);

  filteredAccounts = computed(() => {
    const accs = this.accounts();
    return this.showInactive() ? accs : accs.filter(a => a.status === 'active');
  });

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts() {
    this.isLoading.set(true);
    this.accountService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading accounts', err);
        this.isLoading.set(false);
      }
    });
  }

  onCreate() {
    const dialogRef = this.dialog.open(AccountFormComponent, {
      width: '400px',
      data: { account: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.accountService.createAccount(result).subscribe(() => this.loadAccounts());
      }
    });
  }

  onEdit(account: IAccount) {
    const dialogRef = this.dialog.open(AccountFormComponent, {
      width: '400px',
      data: { account }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.accountService.updateAccount({ ...account, ...result }).subscribe(() => this.loadAccounts());
      }
    });
  }

  onCloseAccount(account: IAccount) {
    this.creditCardService.hasActiveCards(account.id).subscribe(hasActive => {
      if (hasActive) {
        this.snackBar.open('אי אפשר להפוך חשבון ללא פעיל כל עוד מקושרים אליו כרטיסי אשראי פעילים', 'סגור', { duration: 5000 });
        return;
      }

      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: {
          title: 'סימון חשבון כלא פעיל',
          message: `האם אתה בטוח שברצונך להפוך את החשבון "${account.name}" ללא פעיל?`
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.accountService.closeAccount(account.id).subscribe({
            next: () => this.loadAccounts(),
            error: (err) => this.snackBar.open(err.message, 'סגור', { duration: 5000 })
          });
        }
      });
    });
  }

  onDelete(id: string) {
    const account = this.accounts().find(a => a.id === id);
    if (!account) return;

    this.creditCardService.hasAnyCards(id).subscribe(hasCards => {
      if (hasCards) {
        this.snackBar.open('אי אפשר למחוק חשבון שמקושר אליו כרטיס אשראי', 'סגור', { duration: 5000 });
        return;
      }

      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: {
          title: 'מחיקת חשבון',
          message: `האם אתה בטוח שברצונך למחוק לצמיתות את החשבון "${account.name}"?`
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.isLoading.set(true);
          this.accountService.deleteAccount(id).subscribe({
            next: () => {
              this.loadAccounts();
            },
            error: (err) => {
              this.snackBar.open(err.message, 'סגור', { duration: 5000 });
              this.isLoading.set(false);
            }
          });
        }
      });
    });
  }

  getAccountTypeName(account: IAccount): string {
    return account.accountType?.name || 'ללא סוג';
  }
}
