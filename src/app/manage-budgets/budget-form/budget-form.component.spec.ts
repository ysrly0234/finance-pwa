import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BudgetFormComponent } from './budget-form.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { IBudget } from '../../../shared/models/budget.model';

describe('BudgetFormComponent', () => {
    let component: BudgetFormComponent;
    let fixture: ComponentFixture<BudgetFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BudgetFormComponent, NoopAnimationsModule]
        })
            .compileComponents();

        fixture = TestBed.createComponent(BudgetFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.budgetForm.get('cycleType')?.value).toBe('monthly');
        expect(component.budgetForm.get('amount')?.value).toBe(0);
    });

    it('should update form when input budget changes', fakeAsync(() => {
        const mockBudget: IBudget = {
            id: '1',
            name: 'Test',
            amount: 100,
            cycle: { type: 'monthly' },
            isAccumulating: false,
            importance: 'high'
        };

        fixture.componentRef.setInput('budget', mockBudget);
        fixture.detectChanges();

        // Effect runs asynchronously and uses setTimeout
        tick(100);

        expect(component.budgetForm.get('name')?.value).toBe('Test');
        expect(component.budgetForm.get('amount')?.value).toBe(100);
    }));

    it('should emit save event with valid form data', () => {
        spyOn(component.save, 'emit');

        component.budgetForm.patchValue({
            name: 'New Budget',
            amount: 500,
            cycleType: 'monthly',
            importance: 'medium'
        });

        component.onSubmit();

        expect(component.save.emit).toHaveBeenCalledWith(jasmine.objectContaining({
            name: 'New Budget',
            amount: 500
        }));
    });

    it('should emit cancel event', () => {
        spyOn(component.cancel, 'emit');
        component.onCancel();
        expect(component.cancel.emit).toHaveBeenCalled();
    });
});
