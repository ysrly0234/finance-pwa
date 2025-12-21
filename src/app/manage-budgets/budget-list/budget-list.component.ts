import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { IBudget } from '../../../shared/models/budget.model';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressBarModule
  ],
  templateUrl: './budget-list.component.html',
  styleUrl: './budget-list.component.scss'
})
export class BudgetListComponent {
  budgets = input<(IBudget & { status$?: Observable<any> })[]>([]);
  edit = output<IBudget>();
  delete = output<string>();

  private dialog = inject(MatDialog);

  onEdit(budget: IBudget) {
    this.edit.emit(budget);
  }

  onDelete(id: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { title: 'מחיקת תקציב', message: 'האם אתה בטוח שברצונך למחוק תקציב זה?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.delete.emit(id);
      }
    });
  }

  getCycleLabel(budget: IBudget): string {
    const { type, customValue, customUnit } = budget.cycle;
    switch (type) {
      case 'monthly': return 'חודשי';
      case 'bi-monthly': return 'דו-חודשי';
      case 'yearly': return 'שנתי';
      case 'custom':
        const unitLabel = customUnit === 'month' ? 'חודשים' : 'שנים';
        return `כל ${customValue} ${unitLabel}`;
      default: return '';
    }
  }
}
