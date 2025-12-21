import { TestBed } from '@angular/core/testing';
import { BudgetService } from './budget.service';
import { StorageService } from './storage.service';
import { of } from 'rxjs';
import { IBudget } from '../models/budget.model';

describe('BudgetService', () => {
    let service: BudgetService;
    let storageServiceSpy: jasmine.SpyObj<StorageService>;

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

    beforeEach(() => {
        const spy = jasmine.createSpyObj('StorageService', ['getItem', 'setItem']);

        TestBed.configureTestingModule({
            providers: [
                BudgetService,
                { provide: StorageService, useValue: spy }
            ]
        });
        service = TestBed.inject(BudgetService);
        storageServiceSpy = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return budgets from storage', (done) => {
        storageServiceSpy.getItem.and.returnValue(of(mockBudgets));

        service.getBudgets().subscribe(budgets => {
            expect(budgets).toEqual(mockBudgets);
            expect(storageServiceSpy.getItem).toHaveBeenCalled();
            done();
        });
    });

    it('should add a new budget', (done) => {
        storageServiceSpy.getItem.and.returnValue(of([]));
        storageServiceSpy.setItem.and.returnValue(of(undefined));

        const newBudget: Omit<IBudget, 'id'> = {
            name: 'New Budget',
            amount: 200,
            cycle: { type: 'yearly' },
            isAccumulating: true,
            importance: 'high'
        };

        service.createBudget(newBudget).subscribe(budget => {
            expect(budget.name).toBe('New Budget');
            expect(budget.id).toBeDefined();
            expect(storageServiceSpy.setItem).toHaveBeenCalled();
            done();
        });
    });

    it('should delete a budget', (done) => {
        storageServiceSpy.getItem.and.returnValue(of(mockBudgets));
        storageServiceSpy.setItem.and.returnValue(of(undefined));

        service.deleteBudget('1').subscribe(() => {
            expect(storageServiceSpy.setItem).toHaveBeenCalled();
            done();
        });
    });
});
