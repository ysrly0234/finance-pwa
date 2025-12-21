import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ICreditCard } from '../../shared/models/credit-card.model';
import { CreditCardService } from '../../shared/services/credit-card.service';
import { AccountService } from '../../shared/services/account.service';
import { IAccount } from '../../shared/models/account.model';
import { CreditCardFormComponent } from './credit-card-form/credit-card-form.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-credit-cards',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './credit-cards.component.html',
  styleUrl: './credit-cards.component.scss'
})
export class CreditCardsComponent implements OnInit {
  private creditCardService = inject(CreditCardService);
  private accountService = inject(AccountService);
  private dialog = inject(MatDialog);

  creditCards = signal<ICreditCard[]>([]);
  accounts = signal<IAccount[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.creditCardService.getCreditCards().subscribe(cards => this.creditCards.set(cards));
    this.accountService.getAccounts().subscribe(accs => this.accounts.set(accs));
  }

  getAccountName(accountId: string): string {
    return this.accounts().find(a => a.id === accountId)?.name || 'חשבון לא ידוע';
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(CreditCardFormComponent, {
      width: '400px',
      data: { accounts: this.accounts() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.creditCardService.createCreditCard(result).subscribe(() => this.loadData());
      }
    });
  }

  openEditDialog(card: ICreditCard) {
    const dialogRef = this.dialog.open(CreditCardFormComponent, {
      width: '400px',
      data: { card, accounts: this.accounts() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.creditCardService.updateCreditCard({ ...card, ...result }).subscribe(() => this.loadData());
      }
    });
  }

  deleteCard(card: ICreditCard) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'מחיקת כרטיס',
        message: `האם אתה בטוח שברצונך למחוק את הכרטיס "${card.displayName}"?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.creditCardService.deleteCreditCard(card.id).subscribe(() => this.loadData());
      }
    });
  }
}
