import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { IExpense, IIncome, TransactionTargetType } from '../../../shared/models/transaction.model';
import { IAccount } from '../../../shared/models/account.model';
import { ICreditCard } from '../../../shared/models/credit-card.model';
import { IBudget } from '../../../shared/models/budget.model';

export interface TransactionFormData {
    transaction?: IExpense | IIncome;
    type?: 'expense' | 'income';
    accounts: IAccount[];
    creditCards: ICreditCard[];
    budgets: IBudget[];
}

@Component({
    selector: 'app-transaction-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonToggleModule,
        MatIconModule,
        MatChipsModule
    ],
    templateUrl: './transaction-form.component.html',
    styleUrl: './transaction-form.component.scss'
})
export class TransactionFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<TransactionFormComponent>);
    public data = inject<TransactionFormData>(MAT_DIALOG_DATA);

    form!: FormGroup;
    isEdit = false;
    transactionType = signal<'expense' | 'income'>('expense');
    targetType = signal<TransactionTargetType>('account');
    paymentMethod = signal<TransactionTargetType>('card');

    ngOnInit(): void {
        this.isEdit = !!this.data.transaction;
        if (this.data.type) {
            this.transactionType.set(this.data.type);
        } else if (this.data.transaction) {
            this.transactionType.set('executionDate' in this.data.transaction ? 'expense' : 'income');
        }

        this.initForm();

        if (this.isEdit && this.data.transaction) {
            this.patchForm();
        }
    }

    private initForm() {
        this.form = this.fb.group({
            amount: [null as number | null, [Validators.required, Validators.min(0.1)]],
            description: ['', [Validators.required]],
            date: [new Date(), [Validators.required]],
            // Expense validation
            budgetId: [''],
            paymentMethod: ['card'],
            creditCardId: [''],
            paymentAccountId: [''],
            // Income validation
            targetType: ['account'],
            receivingAccountId: [''],
            receivingCreditCardId: ['']
        });

        // Dynamic validation based on type
        this.form.valueChanges.subscribe(() => {
            this.updateValidators();
        });

        // Initial validator update
        this.updateValidators();
    }

    private updateValidators() {
        const type = this.transactionType();
        const target = this.targetType(); // Read from signal or form control? Better form control for income

        const budgetCtrl = this.form.get('budgetId');
        const cardCtrl = this.form.get('creditCardId');
        const payAccountCtrl = this.form.get('paymentAccountId');
        const receiveAccountCtrl = this.form.get('receivingAccountId');
        const receiveCardCtrl = this.form.get('receivingCreditCardId');

        if (type === 'expense') {
            budgetCtrl?.setValidators([Validators.required]);

            receiveAccountCtrl?.clearValidators();
            receiveCardCtrl?.clearValidators();

            const method = this.form.get('paymentMethod')?.value;
            if (method === 'card') {
                cardCtrl?.setValidators([Validators.required]);
                payAccountCtrl?.clearValidators();
            } else {
                cardCtrl?.clearValidators();
                payAccountCtrl?.setValidators([Validators.required]);
            }
        } else {
            budgetCtrl?.clearValidators();
            cardCtrl?.clearValidators();
            payAccountCtrl?.clearValidators();

            const currentTargetType = this.form.get('targetType')?.value;
            if (currentTargetType === 'account') {
                receiveAccountCtrl?.setValidators([Validators.required]);
                receiveCardCtrl?.clearValidators();
            } else {
                receiveAccountCtrl?.clearValidators();
                receiveCardCtrl?.setValidators([Validators.required]);
            }
        }

        payAccountCtrl?.updateValueAndValidity({ emitEvent: false });
        budgetCtrl?.updateValueAndValidity({ emitEvent: false });
        cardCtrl?.updateValueAndValidity({ emitEvent: false });
        receiveAccountCtrl?.updateValueAndValidity({ emitEvent: false });
        receiveCardCtrl?.updateValueAndValidity({ emitEvent: false });
    }

    private patchForm() {
        const t = this.data.transaction;
        if (!t) return;

        if (this.transactionType() === 'expense') {
            const exp = t as IExpense;
            this.form.patchValue({
                amount: exp.amount,
                description: exp.description,
                date: exp.executionDate,
                budgetId: exp.budgetId,
                paymentMethod: exp.paymentMethod || 'card',
                creditCardId: exp.creditCardId,
                paymentAccountId: exp.paymentAccountId
            });
            this.paymentMethod.set(exp.paymentMethod || 'card');
        } else {
            const inc = t as IIncome;
            this.form.patchValue({
                amount: inc.amount,
                description: inc.description,
                date: inc.receiptDate,
                targetType: inc.targetType,
                receivingAccountId: inc.receivingAccountId,
                receivingCreditCardId: inc.receivingCreditCardId
            });
            this.targetType.set(inc.targetType);
        }
    }

    onTypeChange(type: 'expense' | 'income') {
        this.transactionType.set(type);
        this.updateValidators();
    }

    onPaymentMethodChange(method: TransactionTargetType) {
        this.paymentMethod.set(method);
        this.form.patchValue({ paymentMethod: method });
        this.updateValidators();
    }

    onTargetTypeChange(type: TransactionTargetType) {
        this.targetType.set(type);
        this.form.patchValue({ targetType: type });
        this.updateValidators();
    }

    onSubmit() {
        if (this.form.valid) {
            const formValue = this.form.value;
            const type = this.transactionType();

            let result: any;

            if (type === 'expense') {
                result = {
                    amount: formValue.amount,
                    description: formValue.description,
                    executionDate: formValue.date,
                    budgetId: formValue.budgetId,
                    paymentMethod: formValue.paymentMethod,
                    creditCardId: formValue.paymentMethod === 'card' ? formValue.creditCardId : undefined,
                    paymentAccountId: formValue.paymentMethod === 'account' ? formValue.paymentAccountId : undefined
                } as Omit<IExpense, 'id'> | IExpense;
            } else {
                result = {
                    amount: formValue.amount,
                    description: formValue.description,
                    receiptDate: formValue.date,
                    targetType: formValue.targetType,
                    receivingAccountId: formValue.targetType === 'account' ? formValue.receivingAccountId : undefined,
                    receivingCreditCardId: formValue.targetType === 'card' ? formValue.receivingCreditCardId : undefined
                } as Omit<IIncome, 'id'> | IIncome;
            }

            if (this.isEdit && this.data.transaction) {
                result.id = this.data.transaction.id;
            }

            this.dialogRef.close({ type, data: result });
        }
    }

    onCancel() {
        this.dialogRef.close();
    }
}
