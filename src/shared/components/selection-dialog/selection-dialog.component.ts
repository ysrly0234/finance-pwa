import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

export interface SelectionDialogData {
    title: string;
    message: string;
    options: { value: string; label: string }[];
}

@Component({
    selector: 'app-selection-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatRadioModule, MatFormFieldModule, MatInputModule, FormsModule],
    template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      <mat-radio-group [(ngModel)]="selectedOption" class="options-group">
        @for (opt of data.options; track opt.value) {
          <mat-radio-button [value]="opt.value">{{ opt.label }}</mat-radio-button>
        }
      </mat-radio-group>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>הערת ביטול (אופציונלי)</mat-label>
        <input matInput [(ngModel)]="cancellationNote" maxlength="32" placeholder="למשל: הכרטיס נבלע בכספומט">
        <mat-hint align="end">{{ cancellationNote.length }}/32</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">ביטול</button>
      <button mat-raised-button color="warn" [disabled]="!selectedOption" (click)="onYesClick()">אישור</button>
    </mat-dialog-actions>
  `,
    styles: [`
    .options-group {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin: 1rem 0;
    }
    .full-width {
      width: 100%;
      margin-top: 1rem;
    }
  `]
})
export class SelectionDialogComponent {
    selectedOption: string = '';
    cancellationNote: string = '';

    constructor(
        public dialogRef: MatDialogRef<SelectionDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: SelectionDialogData
    ) { }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onYesClick(): void {
        this.dialogRef.close({ reason: this.selectedOption, note: this.cancellationNote });
    }
}
