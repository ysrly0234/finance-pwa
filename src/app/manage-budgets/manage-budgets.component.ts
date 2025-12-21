import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BudgetListComponent } from './budget-list/budget-list.component';
import { BudgetFormComponent } from './budget-form/budget-form.component';
import { BudgetService } from '../../shared/services/budget.service';
import { IBudget } from '../../shared/models/budget.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-manage-budgets',
  standalone: true,
  imports: [
    CommonModule,
    BudgetListComponent,
    BudgetFormComponent,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './manage-budgets.component.html',
  styleUrl: './manage-budgets.component.scss'
})
export class ManageBudgetsComponent implements OnInit {
  private budgetService = inject(BudgetService);

  budgets = signal<IBudget[]>([]);
  showForm = signal(false);
  selectedBudget = signal<IBudget | null>(null);
  isLoading = signal(false);

  ngOnInit(): void {
    this.loadBudgets();
  }

  loadBudgets() {
    this.budgetService.getBudgets().subscribe(b => this.budgets.set(b));
  }

  onCreate() {
    this.selectedBudget.set(null);
    this.showForm.set(true);
  }

  onEdit(budget: IBudget) {
    this.selectedBudget.set(budget);
    this.showForm.set(true);
  }

  onDelete(id: string) {
    this.isLoading.set(true);
    this.budgetService.deleteBudget(id).subscribe({
      next: () => {
        this.loadBudgets();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error deleting budget', err);
        this.isLoading.set(false);
      }
    });
  }

  onSave(budgetData: IBudget | Omit<IBudget, 'id'>) {
    this.isLoading.set(true);
    let obs: Observable<IBudget>;

    if ('id' in budgetData) {
      obs = this.budgetService.updateBudget(budgetData as IBudget);
    } else {
      obs = this.budgetService.createBudget(budgetData);
    }

    obs.subscribe({
      next: () => {
        this.showForm.set(false);
        this.loadBudgets();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error saving budget', err);
        this.isLoading.set(false);
      }
    });
  }

  onCancel() {
    this.showForm.set(false);
    this.selectedBudget.set(null);
  }
}
