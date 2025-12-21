import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BudgetListComponent } from './budget-list.component';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { IBudget } from '../../../shared/models/budget.model';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('BudgetListComponent', () => {
    let component: BudgetListComponent;
    let fixture: ComponentFixture<BudgetListComponent>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;

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
        const spy = jasmine.createSpyObj('MatDialog', ['open']);

        await TestBed.configureTestingModule({
            imports: [BudgetListComponent, ConfirmationDialogComponent, NoopAnimationsModule],
            providers: [
                { provide: MatDialog, useValue: spy }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(BudgetListComponent);
        component = fixture.componentInstance;
        dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        fixture.componentRef.setInput('budgets', mockBudgets);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display budgets', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('mat-card-title')?.textContent).toContain('Test Budget');
    });

    it('should emit edit event', () => {
        let emittedBudget: IBudget | undefined;
        component.edit.subscribe(b => emittedBudget = b);

        component.onEdit(mockBudgets[0]);
        expect(emittedBudget).toEqual(mockBudgets[0]);
    });

    it('should open delete dialog and emit delete event on confirmation', fakeAsync(() => {
        let emittedId: string | undefined;
        component.delete.subscribe(id => emittedId = id);

        const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null });
        dialogSpy.open.and.returnValue(dialogRefSpyObj);

        component.onDelete('1');
        tick();

        expect(dialogSpy.open).toHaveBeenCalled();
        expect(emittedId).toBe('1');
    }));

    it('should not emit delete event on cancellation', fakeAsync(() => {
        let emittedId: string | undefined;
        component.delete.subscribe(id => emittedId = id);

        const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(false), close: null });
        dialogSpy.open.and.returnValue(dialogRefSpyObj);

        component.onDelete('1');
        tick();

        expect(dialogSpy.open).toHaveBeenCalled();
        expect(emittedId).toBeUndefined();
    }));
});
