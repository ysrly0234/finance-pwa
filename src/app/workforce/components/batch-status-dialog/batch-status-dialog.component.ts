import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-batch-status-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatSelectModule, MatFormFieldModule, FormsModule, MatInputModule],
  template: `
    <h2 mat-dialog-title dir="rtl">עדכון סטטוס קבוצתי</h2>
    <mat-dialog-content dir="rtl">
      <p>מעדכן סטטוס עבור <strong>{{ data.count }}</strong> עובדים.</p>
      <p class="text-xs text-gray-500">בתוקף מ-: {{ data.effectiveTime | date:'dd/MM/yyyy HH:mm' }}</p>
      
      <div class="flex flex-col gap-4 mt-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>סטטוס חדש</mat-label>
            <mat-select [(ngModel)]="status">
              <mat-option value="Available">פנוי</mat-option>
              <mat-option value="Not Available">לא פנוי</mat-option>
            </mat-select>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="w-full">
              <mat-label>תיאור (אופציונלי)</mat-label>
              <input matInput [(ngModel)]="description" maxlength="64">
              <mat-hint align="end">{{description.length}}/64</mat-hint>
          </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end" dir="rtl">
      <button mat-button (click)="cancel()">ביטול</button>
      <button mat-flat-button color="primary" [disabled]="!status" (click)="confirm()">עדכן</button>
    </mat-dialog-actions>
  `
})
export class BatchStatusDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<BatchStatusDialogComponent>);

  status = '';
  description = '';

  confirm() {
    this.dialogRef.close({ status: this.status, description: this.description });
  }

  cancel() {
    this.dialogRef.close();
  }
}
