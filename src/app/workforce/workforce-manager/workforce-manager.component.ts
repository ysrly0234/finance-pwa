import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { WorkforceService } from '../services/workforce.service';
import { Employee, Department, AvailabilityStatus } from '../models/workforce.types';
import { EmployeeCardComponent } from '../components/employee-card/employee-card.component';
import { TimelineControlComponent } from '../components/timeline-control/timeline-control.component';
import { EditAvailabilityDialogComponent } from '../components/edit-availability-dialog/edit-availability-dialog.component';
import { ManageBackupsDialogComponent } from '../components/manage-backups-dialog/manage-backups-dialog.component';
import { BatchStatusDialogComponent } from '../components/batch-status-dialog/batch-status-dialog.component';

@Component({
  selector: 'app-workforce-manager',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatToolbarModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatInputModule, MatFormFieldModule, MatCheckboxModule,
    MatDialogModule, MatSnackBarModule,
    EmployeeCardComponent, TimelineControlComponent
  ],
  template: `
    <div class="manager-container">
      <mat-toolbar color="primary" dir="rtl">
        <span class="toolbar-title">ניהול עובדים וזמינות</span>
      </mat-toolbar>

      <div class="controls-bar" dir="rtl">
        <!-- Department Selector -->
        <mat-form-field appearance="outline" class="dept-select">
            <mat-label>מחלקה</mat-label>
            <mat-select [ngModel]="selectedDeptIndex()" (selectionChange)="onDeptChange($event.value)">
                <mat-option *ngFor="let dept of departments(); let i = index" [value]="i">{{ dept.deptName }}</mat-option>
            </mat-select>
        </mat-form-field>
        
        <div class="filter-row">
            <app-timeline-control (timeChange)="onTimeChange($event)"></app-timeline-control>
            
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>חיפוש עובדים</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input matInput [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="שם או מספר עובד">
            </mat-form-field>
        </div>
      </div>

      <div class="grid-container" dir="rtl">
        <app-employee-card 
          *ngFor="let node of displayedNodes()"
          [employee]="node.employee"
          [availability]="node.availability"
          [nextAvailability]="node.nextAvailability"
          [activeBackups]="node.activeBackups"
          [phone]="node.phone"
          (onEditStates)="openEditStates(node.employee)"
          (onManageBackups)="openManageBackups(node.employee)"
        ></app-employee-card>

        <div *ngIf="displayedNodes().length === 0" class="no-results">
           לא נמצאו עובדים במחלקה זו.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .manager-container { display: flex; flex-direction: column; height: 100vh; background-color: #f5f5f5; }
    .spacer { flex: 1 1 auto; }
    .controls-bar { 
        background: white; padding: 10px 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); z-index: 10;
        display: flex; flex-wrap: wrap; align-items: center; gap: 20px;
    }
    .dept-select { min-width: 200px; margin-bottom: -1.25em; }
    .filter-row { display: flex; flex-wrap: wrap; gap: 20px; align-items: center; }
    .search-field { width: 250px; margin-bottom: -1.25em; }
    
    .actions-bar {
      background: #e3f2fd;
      padding: 10px 20px;
      display: flex;
      gap: 10px;
      align-items: center;
      border-bottom: 1px solid #bbdefb;
    }
    .action-btn { background: white; color: #1565c0; border-color: #1565c0; }
    .selection-count { font-weight: bold; color: #1565c0; margin-right: 10px; }
    
    .grid-container {
      flex: 1;
      padding: 20px;
      display: flex;
      flex-wrap: wrap;
      align-content: flex-start;
      overflow-y: auto;
      align-items: flex-start;
    }
    .no-results {
      width: 100%;
      text-align: center;
      margin-top: 50px;
      color: #777;
      font-size: 1.2rem;
    }
  `]
})
export class WorkforceManagerComponent {
  service = inject(WorkforceService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);

  departments = this.service.getDepartments();
  selectedDeptIndex = signal(0);

  currentTime = signal(new Date());
  searchQuery = signal('');

  constructor() {
    this.currentTime.set(new Date());
  }

  currentDept = computed(() => this.departments()[this.selectedDeptIndex()]);

  // Data Source calculated
  deptEmployees = computed(() => {
    const dept = this.currentDept();
    if (!dept) return [];
    return this.service.getEmployeesByDept(dept.deptNumber)();
  });

  displayedNodes = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const list = this.deptEmployees();
    const time = this.currentTime();

    return list.filter(e => {
      return !query || e.firstName.toLowerCase().includes(query) || e.lastName.toLowerCase().includes(query) || e.empNumber.toLowerCase().includes(query);
    }).map(e => {
      const availWindow = this.service.getAvailabilityWindow(e.empNumber, time);
      // Note: Backup Window logic in service was singular, but I updated card to list multple.
      // Let's stick to singular active backup for now or mock the list.
      // The service logic I updated returns 'current' and 'next'.
      // For UI, I want a list of active backups. 
      // I will use `getBackupWindow(e.empNumber, time).current` as the primary one.
      const backupWindow = this.service.getBackupWindow(e.empNumber, time);

      const activeBackups = [];
      if (backupWindow.current) {
        const b = backupWindow.current;
        const backupEmp = this.service.getEmployees()().find(bec => bec.empNumber === b.backupEmpNumber);
        const name = backupEmp ? `${backupEmp.firstName} ${backupEmp.lastName}` : b.backupEmpNumber;
        // Customers
        const specificCusts = this.service.getBackupCustomers(b.id).map((bc: any) => bc.custNumber);
        activeBackups.push({ name, empNumber: b.backupEmpNumber, customers: specificCusts });
      }

      const phone = this.service.getEmployeePhone(e.empNumber)();

      return {
        employee: e,
        availability: availWindow.current,
        nextAvailability: availWindow.next,
        activeBackups,
        phone
      };
    });
  });

  onDeptChange(index: number) {
    this.selectedDeptIndex.set(index);
  }

  onTimeChange(t: Date) {
    this.currentTime.set(t);
  }

  // Actions
  openEditStates(e: Employee) {
    this.dialog.open(EditAvailabilityDialogComponent, {
      data: { employee: e, currentTime: this.currentTime() }
    });
  }

  openManageBackups(e: Employee) {
    this.dialog.open(ManageBackupsDialogComponent, {
      data: { employee: e, currentTime: this.currentTime() }
    });
  }
}
