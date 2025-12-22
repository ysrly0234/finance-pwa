import { Component, computed, effect, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { IBudget } from '../../../shared/models/budget.model';

@Component({
  selector: 'app-budget-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  templateUrl: './budget-form.component.html',
  styleUrl: './budget-form.component.scss'
})
export class BudgetFormComponent {
  budget = input<IBudget | null>(null);
  save = output<Omit<IBudget, 'id'> | IBudget>();
  cancel = output<void>();

  private fb = inject(FormBuilder);

  budgetForm = this.fb.group({
    id: [null as string | null],
    name: ['', [Validators.required, Validators.maxLength(32)]],
    description: ['', [Validators.maxLength(128)]],
    cycleType: ['monthly', Validators.required],
    customValue: [1, [Validators.min(1), Validators.pattern('^[0-9]*$')]],
    customUnit: ['month'],
    amount: [null as number | null, [Validators.required, Validators.min(0)]],
    isAccumulating: [false],
    importance: [null as 'high' | 'medium' | 'low' | null, Validators.required]
  });

  // Signals for form values
  cycleTypeValue = toSignal(this.budgetForm.get('cycleType')!.valueChanges, { initialValue: 'monthly' });
  customValueValue = toSignal(this.budgetForm.get('customValue')!.valueChanges, { initialValue: 1 });

  // Computed signals for template logic
  isCustomCycle = computed(() => this.cycleTypeValue() === 'custom');

  customUnitLabel = computed(() => {
    const val = this.customValueValue();
    return val == 1 ? 'חודש' : 'חודשים';
  });

  customUnitYearLabel = computed(() => {
    const val = this.customValueValue();
    return val == 1 ? 'שנה' : 'שנים';
  });

  constructor() {
    effect(() => {
      const budget = this.budget();
      console.log('BudgetFormComponent effect triggered. Budget:', budget);
      if (budget) {
        // Use setTimeout to ensure the form controls (especially MatSelect) are ready
        setTimeout(() => {
          console.log('Patching form with importance:', budget.importance);
          this.budgetForm.patchValue({
            id: budget.id,
            name: budget.name,
            description: budget.description,
            cycleType: budget.cycle.type,
            customValue: budget.cycle.customValue || 1,
            customUnit: budget.cycle.customUnit || 'month',
            amount: budget.amount,
            isAccumulating: budget.isAccumulating,
            importance: budget.importance
          });
          console.log('Form value after patch:', this.budgetForm.value);
        });
      } else {
        this.budgetForm.reset({
          cycleType: 'monthly',
          customValue: 1,
          customUnit: 'month',
          amount: null,
          isAccumulating: false
        });
      }
    });
  }

  onSubmit() {
    if (this.budgetForm.valid) {
      const formValue = this.budgetForm.value;
      const budgetData: any = {
        name: formValue.name,
        description: formValue.description,
        amount: formValue.amount,
        isAccumulating: formValue.isAccumulating,
        importance: formValue.importance,
        cycle: {
          type: formValue.cycleType,
          customValue: formValue.cycleType === 'custom' ? formValue.customValue : undefined,
          customUnit: formValue.cycleType === 'custom' ? formValue.customUnit : undefined
        }
      };

      if (formValue.id) {
        budgetData.id = formValue.id;
      }

      this.save.emit(budgetData);
    } else {
      this.budgetForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
