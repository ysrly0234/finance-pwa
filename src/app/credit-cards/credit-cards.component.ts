import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { ICreditCard, CreditCardCancellationReason } from '../../shared/models/credit-card.model';
import { CreditCardService } from '../../shared/services/credit-card.service';
import { AccountService } from '../../shared/services/account.service';
import { IAccount } from '../../shared/models/account.model';
import { CreditCardFormComponent } from './credit-card-form/credit-card-form.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { SelectionDialogComponent } from '../../shared/components/selection-dialog/selection-dialog.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-credit-cards',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    FormsModule
  ],
  templateUrl: './credit-cards.component.html',
  styleUrl: './credit-cards.component.scss'
})
export class CreditCardsComponent implements OnInit {
  private creditCardService = inject(CreditCardService);
  private accountService = inject(AccountService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  creditCards = signal<ICreditCard[]>([]);
  accounts = signal<IAccount[]>([]);
  showInactive = signal(false);

  filteredCards = computed(() => {
    const cards = this.creditCards();
    return this.showInactive() ? cards : cards.filter(c => c.status === 'active');
  });

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

  cancelCard(card: ICreditCard) {
    const dialogRef = this.dialog.open(SelectionDialogComponent, {
      width: '400px',
      data: {
        title: 'ביטול כרטיס',
        message: `מדוע ברצונך לבטל את הכרטיס "${card.displayName}"?`,
        options: [
          { value: CreditCardCancellationReason.CANCELLED, label: 'מבוטל' },
          { value: CreditCardCancellationReason.EXPIRED, label: 'פג תוקף' },
          { value: CreditCardCancellationReason.LOST_OR_STOLEN, label: 'אבד או נגנב' },
          { value: CreditCardCancellationReason.OTHER, label: 'אחר' }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.reason) {
        this.creditCardService.cancelCreditCard(card.id, result.reason, result.note).subscribe(() => this.loadData());
      }
    });
  }

  reactivateCard(card: ICreditCard) {
    this.accountService.getAccounts().subscribe(accounts => {
      const account = accounts.find(a => a.id === card.chargeAccountId);
      if (!account || account.status !== 'active') {
        this.snackBar.open('אי אפשר להפעיל כרטיס אשראי המקושר לחשבון לא פעיל', 'סגור', { duration: 5000 });
        return;
      }

      this.creditCardService.reactivateCreditCard(card.id).subscribe(() => {
        this.loadData();
        this.snackBar.open('הכרטיס הופעל מחדש בהצלחה', 'סגור', { duration: 3000 });
      });
    });
  }

  deleteCard(card: ICreditCard) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'מחיקת כרטיס',
        message: `האם אתה בטוח שברצונך למחוק לצמיתות את הכרטיס "${card.displayName}"?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.creditCardService.deleteCreditCard(card.id).subscribe(() => this.loadData());
      }
    });
  }

  getReasonLabel(reason?: CreditCardCancellationReason): string {
    const options = [
      { value: CreditCardCancellationReason.CANCELLED, label: 'מבוטל' },
      { value: CreditCardCancellationReason.EXPIRED, label: 'פג תוקף' },
      { value: CreditCardCancellationReason.LOST_OR_STOLEN, label: 'אבד או נגנב' },
      { value: CreditCardCancellationReason.OTHER, label: 'אחר' }
    ];
    return options.find(o => o.value === reason)?.label || reason || '';
  }
}
