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
  templateUrl: './workforce-manager.component.html',
  styleUrls: ['./workforce-manager.component.scss']
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
