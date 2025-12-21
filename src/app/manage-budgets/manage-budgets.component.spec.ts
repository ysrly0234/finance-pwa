import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageBudgetsComponent } from './manage-budgets.component';
import { BudgetService } from '../../shared/services/budget.service';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { IBudget } from '../../shared/models/budget.model';

describe('ManageBudgetsComponent', () => {
    let component: ManageBudgetsComponent;
    let fixture: ComponentFixture<ManageBudgetsComponent>;
    let budgetServiceSpy: jasmine.SpyObj<BudgetService>;

    const mockBudgets: IBudget[] = [
        {
            id: '1',
            name: 'Test Budget',
            amount: 100,
            cycle: { type: 'monthly' },
            isAccumulating: false,
            importance: 'medium'
        }
    ];

    beforeEach(async () => {
        const spy = jasmine.createSpyObj('BudgetService', ['getBudgets', 'createBudget', 'updateBudget', 'deleteBudget']);

        await TestBed.configureTestingModule({
            imports: [ManageBudgetsComponent, NoopAnimationsModule],
            providers: [
                { provide: BudgetService, useValue: spy }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ManageBudgetsComponent);
        component = fixture.componentInstance;
        budgetServiceSpy = TestBed.inject(BudgetService) as jasmine.SpyObj<BudgetService>;

        budgetServiceSpy.getBudgets.and.returnValue(of(mockBudgets));

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load budgets on init', () => {
        expect(budgetServiceSpy.getBudgets).toHaveBeenCalled();
        expect(component.budgets()).toEqual(mockBudgets);
    });

    it('should show form on create', () => {
        component.onCreate();
        expect(component.showForm()).toBeTrue();
        expect(component.selectedBudget()).toBeNull();
    });

    it('should show form on edit', () => {
        component.onEdit(mockBudgets[0]);
        expect(component.showForm()).toBeTrue();
        expect(component.selectedBudget()).toEqual(mockBudgets[0]);
    });

    it('should delete budget and reload', () => {
        budgetServiceSpy.deleteBudget.and.returnValue(of(undefined));

        component.onDelete('1');

        expect(budgetServiceSpy.deleteBudget).toHaveBeenCalledWith('1');
        expect(budgetServiceSpy.getBudgets).toHaveBeenCalledTimes(2); // Init + Reload
    });

    it('should save new budget and reload', () => {
        const newBudget: Omit<IBudget, 'id'> = {
            name: 'New',
            amount: 200,
            cycle: { type: 'monthly' },
            isAccumulating: false,
            importance: 'low'
        };

        budgetServiceSpy.createBudget.and.returnValue(of({ ...newBudget, id: '2' }));

        component.onSave(newBudget);

        expect(budgetServiceSpy.createBudget).toHaveBeenCalled();
        expect(component.showForm()).toBeFalse();
        expect(budgetServiceSpy.getBudgets).toHaveBeenCalledTimes(2);
    });
});
