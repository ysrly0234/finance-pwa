import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { IAccount, IAccountType } from '../../../shared/models/account.model';
import { AccountService } from '../../../shared/services/account.service';

export interface AccountFormData {
    account: IAccount | null;
}

@Component({
    selector: 'app-account-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule
    ],
    templateUrl: './account-form.component.html',
    styleUrl: './account-form.component.scss'
})
export class AccountFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<AccountFormComponent>);
    private accountService = inject(AccountService);

    accountForm = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(50)]],
        accountType: [null as IAccountType | null, [Validators.required]]
    });

    isEdit = false;
    accountTypes: IAccountType[] = [];

    constructor(@Inject(MAT_DIALOG_DATA) public data: AccountFormData) {
        this.accountTypes = this.accountService.getAccountTypes();
        if (data.account) {
            this.isEdit = true;
            this.accountForm.patchValue({
                name: data.account.name,
                accountType: data.account.accountType || null
            });
        }
    }

    ngOnInit(): void { }

    compareAccountTypes(t1: IAccountType, t2: IAccountType): boolean {
        return t1 && t2 ? t1.id === t2.id : t1 === t2;
    }

    onSubmit() {
        if (this.accountForm.valid) {
            this.dialogRef.close(this.accountForm.value);
        }
    }

    onCancel() {
        this.dialogRef.close();
    }
}
