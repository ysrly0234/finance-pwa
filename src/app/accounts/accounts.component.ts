import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { IAccount } from '../../shared/models/account.model';
import { AccountService } from '../../shared/services/account.service';
import { AccountFormComponent } from './account-form/account-form.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatChipsModule
  ],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss'
})
export class AccountsComponent implements OnInit {
  private accountService = inject(AccountService);
  private dialog = inject(MatDialog);

  accounts = signal<IAccount[]>([]);
  isLoading = signal(false);

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
      data: {}
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

  onDelete(id: string) {
    const account = this.accounts().find(a => a.id === id);
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'מחיקת חשבון',
        message: `האם אתה בטוח שברצונך למחוק את החשבון "${account?.name}"?`
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
            console.error('Error deleting account', err);
            this.isLoading.set(false);
          }
        });
      }
    });
  }

  getAccountTypeName(account: IAccount): string {
    return account.accountType?.name || 'לא צוין';
  }
}
