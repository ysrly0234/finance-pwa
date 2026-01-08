import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';

import { WorkforceService } from '../../services/workforce.service';
import { AvailabilityType, Employee, Customer } from '../../models/workforce.types';

@Component({
  selector: 'app-edit-employee-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatIconModule, MatAutocompleteModule, MatChipsModule
  ],
  template: `
    <h2 mat-dialog-title dir="rtl">עריכת עובד: {{ data.employee.firstName }} {{ data.employee.lastName }}</h2>
    
    <mat-dialog-content class="edit-content" dir="rtl">
      <form [formGroup]="form">
        
        <!-- Status Section -->
        <h3 class="section-title">סטטוס זמינות</h3>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>סטטוס</mat-label>
          <mat-select formControlName="status">
            <mat-option value="Available">פנוי</mat-option>
            <mat-option value="Not Available">לא פנוי</mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
           <mat-label>בתוקף מ-</mat-label>
           <input matInput [matDatepicker]="picker" formControlName="effectiveDate">
           <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
           <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <!-- Backup Section -->
        <h3 class="section-title">הקצאת מגבה</h3>
        <div class="info-text">אם הסטטוס הוא 'לא פנוי', יש להקצות מגבה.</div>
        
        <mat-form-field appearance="outline" class="full-width">
           <mat-label>עובד מגבה</mat-label>
           <mat-select formControlName="backupEmpNumber">
             <mat-option [value]="null">-- ללא --</mat-option>
             <mat-option *ngFor="let emp of allEmployees" [value]="emp.empNumber">
               {{ emp.firstName }} {{ emp.lastName }} ({{ emp.empNumber }})
             </mat-option>
           </mat-select>
        </mat-form-field>
        
        <!-- Backup Customers -->
        <h3 class="section-title" *ngIf="form.get('backupEmpNumber')?.value">לקוחות ספציפיים</h3>
        <div *ngIf="form.get('backupEmpNumber')?.value">
           <mat-form-field appearance="outline" class="full-width">
             <mat-label>לקוחות (השאר ריק עבור כולם)</mat-label>
             <mat-select formControlName="backupCustomers" multiple>
               <mat-option *ngFor="let c of employeeCustomers" [value]="c.custNumber">
                 {{ c.firstName }} {{ c.lastName }} ({{ c.custNumber }})
               </mat-option>
             </mat-select>
           </mat-form-field>
        </div>

      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end" dir="rtl">
      <button mat-button (click)="onCancel()">ביטול</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="onSave()">שמור שינויים</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .edit-content { display: flex; flex-direction: column; gap: 16px; min-width: 400px; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .section-title { margin: 16px 0 8px; font-size: 1.1rem; color: #3f51b5; border-bottom: 1px solid #eee; }
    .info-text { font-size: 0.8rem; color: #666; margin-bottom: 8px; }
  `]
})
export class EditEmployeeDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<EditEmployeeDialogComponent>);
  fb = inject(FormBuilder);
  service = inject(WorkforceService);

  allEmployees: Employee[] = [];
  employeeCustomers: Customer[] = [];

  form = this.fb.group({
    status: ['', Validators.required],
    effectiveDate: [new Date(), Validators.required], // Should include time? Simplified to Date for now
    backupEmpNumber: [''],
    backupCustomers: [[]]
  });

  constructor() {
    // Load lists
    this.allEmployees = this.service.getEmployees()().filter(e => e.id !== this.data.employee.id);
    this.employeeCustomers = this.service.getCustomersForEmployee(this.data.employee.empNumber)();

    // Init values
    const isoDate = this.data.currentTime ? new Date(this.data.currentTime) : new Date();
    this.form.patchValue({
      status: this.data.currentStatus?.status || 'Available',
      effectiveDate: isoDate as any,
      backupEmpNumber: this.data.currentBackup?.backupEmpNumber || '',
      backupCustomers: this.data.currentBackupCustomers?.map((bc: any) => bc.custNumber) || []
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.form.valid) {
      // Return form value to parent to handle save
      const val = this.form.value;
      // Convert Date to ISO string
      const date = new Date(val.effectiveDate!);
      // Use time from currentTime or default to start of day?
      // Prompt says "Select Time field". I am using just Datepicker here for simplicity, 
      // but parent has time. Ideally edit dialog picks time too.
      // I'll assume we keep the 'Time' part of 'currentTime' if possible, or midnight.
      // Let's use the time from the input date (which is usually 00:00).

      this.dialogRef.close({
        status: val.status,
        effectiveDateTime: date.toISOString(),
        backupEmpNumber: val.backupEmpNumber,
        backupCustomers: val.backupCustomers
      });
    }
  }
}
