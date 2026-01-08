import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee, EmployeePhone, AvailabilityStatus, BackupEmployee, BackupCustomer, Customer } from '../../models/workforce.types';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-employee-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <mat-card class="employee-card" dir="rtl">
      <div class="card-header-custom">
           <div class="avatar-container">
             <div class="avatar-placeholder">
               {{ employee().firstName[0] }}{{ employee().lastName[0] }}
             </div>
             <div class="status-icon" [class.available]="availability()?.status === 'Available'" [class.unavailable]="availability()?.status === 'Not Available'">
               <mat-icon>{{ availability()?.status === 'Available' ? 'check_circle' : 'do_not_disturb_on' }}</mat-icon>
             </div>
           </div>
           <div class="header-text">
             <mat-card-title>{{ employee().firstName }} {{ employee().lastName }}</mat-card-title>
             <mat-card-subtitle>מספר עובד: {{ employee().empNumber }}</mat-card-subtitle>
           </div>
      </div>
      
      <mat-card-content class="content-area">
        <div class="status-timer-row" *ngIf="availability()">
            <div class="timer-item">
                <span class="label">התחלה:</span>
                <span class="value">{{ statusStartTime }}</span>
            </div>
            <div class="timer-item">
                <span class="label">סיום:</span>
                <span class="value">{{ statusEndTime }}</span>
            </div>
        </div>

        <!-- Description Tooltip or Text if exists -->
        <div class="status-description" *ngIf="availability()?.description">
            <mat-icon class="tiny-icon">info</mat-icon> {{ availability()!.description }}
        </div>

        <div class="info-row">
          <mat-icon class="small-icon">phone</mat-icon>
          <span>{{ phone()?.phoneNumber || 'אין טלפון' }} ({{ getPurposeHebrew(phone()?.purpose) }})</span>
        </div>

        <!-- Backup List Section -->
        <div class="backup-list" *ngIf="activeBackups().length > 0; else noBackup">
           <div class="section-label">מגבים פעילים עכשיו:</div>
           <div class="backup-item" *ngFor="let b of activeBackups()">
               <div class="backup-row">
                   <mat-icon class="shield-icon">security</mat-icon>
                   <span class="backup-name">{{ b.name }} ({{ b.empNumber }})</span>
               </div>
               <div class="backup-meta">
                   <span *ngIf="b.customers.length === 0" class="badge-all">כל הלקוחות</span>
                   <span *ngIf="b.customers.length > 0" class="badge-specific">{{ b.customers.length }} לקוחות</span>
               </div>
           </div>
        </div>
        <ng-template #noBackup>
            <div class="no-backup-msg" *ngIf="availability()?.status === 'Not Available'">
                <mat-icon color="warn">warning</mat-icon> אין מגבה!
            </div>
        </ng-template>

      </mat-card-content>

      <mat-card-actions align="end">
        <button mat-button color="accent" (click)="onManageBackups.emit(employee())">
            <mat-icon>security</mat-icon> מגבים
        </button>
        <button mat-button (click)="onEditStates.emit(employee())">עריכת מצבים</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .employee-card {
      margin: 10px;
      width: 340px;
      transition: all 0.3s ease;
      position: relative;
      overflow: visible; 
    }
    /* Removed .selected styles */
    .card-header-custom {
        display: flex;
        padding: 16px 16px 0;
        gap: 16px;
        align-items: center;
    }
    .avatar-container {
        position: relative;
    }
    .avatar-placeholder {
      width: 50px; height: 50px;
      background-color: #e0e0e0;
      border-radius: 50%;
      color: #555;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.2rem;
    }
    .status-icon {
        position: absolute;
        bottom: -4px;
        left: -4px;
        border-radius: 50%;
        background: white;
        width: 24px; height: 24px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .status-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .status-icon.available { color: #4caf50; }
    .status-icon.unavailable { color: #f44336; }

    .content-area { padding-top: 16px; font-size: 0.9rem; }
    
    .status-timer-row {
        display: flex; justify-content: space-between;
        background: #f5f5f5; padding: 8px; border-radius: 4px;
        margin-bottom: 8px; font-size: 0.8rem;
    }
    .timer-item { display: flex; flex-direction: column; }
    .label { color: #777; font-size: 0.7rem; text-transform: uppercase; }
    .value { font-weight: 500; }

    .status-description {
        font-size: 0.8rem; color: #555; font-style: italic; margin-bottom: 12px;
        display: flex; align-items: center; gap: 4px;
    }
    .tiny-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; }

    .info-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: #555; }
    .small-icon { font-size: 18px; width: 18px; height: 18px; }

    .backup-list {
        background: #fff8e1;
        border: 1px solid #ffecb3;
        border-radius: 4px;
        padding: 8px;
        margin-top: 8px;
    }
    .section-label { font-size: 0.75rem; color: #f57c00; font-weight: bold; margin-bottom: 4px; }
    .backup-item {
        display: flex; justify-content: space-between; align-items: center;
        padding: 4px 0; border-bottom: 1px dashed #ffe0b2;
    }
    .backup-item:last-child { border-bottom: none; }
    .backup-row { display: flex; align-items: center; gap: 6px; }
    .shield-icon { font-size: 16px; width: 16px; height: 16px; color: #ff9800; }
    .backup-name { font-weight: 500; font-size: 0.85rem; }
    .backup-meta { display: flex; gap: 4px; }
    .badge-all { background: #4caf50; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 8px; }
    .badge-specific { background: #2196f3; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 8px; }
    
    .no-backup-msg { color: #d32f2f; display: flex; align-items: center; gap: 4px; font-weight: bold; margin-top: 8px; }
  `]
})
export class EmployeeCardComponent {
  employee = input.required<Employee>();
  availability = input<AvailabilityStatus | undefined>();
  nextAvailability = input<AvailabilityStatus | undefined>();
  phone = input<EmployeePhone | undefined>();

  // Complex object for backups to display list
  activeBackups = input<{ name: string, empNumber: string, customers: string[] }[]>([]);

  onEditStates = output<Employee>();
  onManageBackups = output<Employee>();

  getPurposeHebrew(purpose?: string) {
    switch (purpose) {
      case 'Primary': return 'ראשי';
      case 'Mobile': return 'נייד';
      case 'Work': return 'עבודה';
      default: return purpose || '';
    }
  }

  get statusEndTime() {
    if (this.nextAvailability()) {
      return new Date(this.nextAvailability()!.effectiveDateTime).toLocaleString('he-IL');
    }
    return 'עד להודעה חדשה';
  }

  get statusStartTime() {
    if (this.availability()) {
      return new Date(this.availability()!.effectiveDateTime).toLocaleString('he-IL');
    }
    return 'לא ידוע';
  }
}
