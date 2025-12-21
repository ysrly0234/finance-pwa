import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ICreditCard } from '../../../shared/models/credit-card.model';
import { IAccount } from '../../../shared/models/account.model';
import { AccountService } from '../../../shared/services/account.service';

export interface CreditCardFormData {
    card?: ICreditCard;
    accounts: IAccount[];
}

@Component({
    selector: 'app-credit-card-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatCheckboxModule
    ],
    templateUrl: './credit-card-form.component.html',
    styleUrl: './credit-card-form.component.scss'
})
export class CreditCardFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<CreditCardFormComponent>);

    cardForm = this.fb.group({
        displayName: ['', [Validators.required, Validators.maxLength(50)]],
        monthlyChargeDate: [10, [Validators.required, Validators.min(1), Validators.max(31)]],
        chargeAccountId: ['', [Validators.required]],
        expiryDate: ['', [Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]], // MM/YY
        isVirtual: [false]
    });

    isEdit = false;

    constructor(@Inject(MAT_DIALOG_DATA) public data: CreditCardFormData) {
        if (data.card) {
            this.isEdit = true;
            this.cardForm.patchValue(data.card);

            if (data.card.status === 'inactive') {
                this.cardForm.get('monthlyChargeDate')?.disable();
                this.cardForm.get('chargeAccountId')?.disable();
                this.cardForm.get('expiryDate')?.disable();
                this.cardForm.get('isVirtual')?.disable();
            }
        }
    }

    ngOnInit(): void { }

    onSubmit() {
        if (this.cardForm.valid) {
            this.dialogRef.close(this.cardForm.value);
        }
    }

    onCancel() {
        this.dialogRef.close();
    }
}
