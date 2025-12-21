import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { IAccount } from '../../shared/models/account.model';
import { AccountService } from '../../shared/services/account.service';

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
    // TODO: Open dialog for creating account
    console.log('Create account');
  }

  onEdit(account: IAccount) {
    // TODO: Open dialog for editing account
    console.log('Edit account', account);
  }

  onDelete(id: string) {
    if (confirm('האם אתה בטוח שברצונך למחוק חשבון זה?')) {
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
  }

  getAccountTypeName(account: IAccount): string {
    return account.accountType?.name || 'לא צוין';
  }
}
