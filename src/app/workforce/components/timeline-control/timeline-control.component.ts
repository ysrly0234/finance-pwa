import { Component, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-timeline-control',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule],
  template: `
    <div class="timeline-container" dir="rtl">
      <div class="controls-group">
        <mat-form-field appearance="outline" class="date-field">
          <mat-label>תאריך</mat-label>
          <input matInput [matDatepicker]="picker" [ngModel]="date()" (ngModelChange)="onDateChange($event)">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" class="time-field">
            <mat-label>שעה</mat-label>
            <mat-select [ngModel]="selectedTime()" (selectionChange)="onTimeChange($event.value)">
                <mat-option *ngFor="let t of timeSlots" [value]="t">
                    {{ t }}
                </mat-option>
            </mat-select>
        </mat-form-field>
      </div>
    </div>
  `,
  styles: [`
    .timeline-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .controls-group {
      display: flex;
      gap: 8px; /* Tight gap */
      align-items: center;
    }
    .date-field {
        width: 160px;
    }
    .time-field {
      width: 100px; /* Minimal width for time */
    }
    /* Material override for cleaner look if needed */
    ::ng-deep .time-field .mat-mdc-form-field-infix {
        width: auto !important;
    }
    
    /* .info { color: #666; ... } removed */
  `]
})
export class TimelineControlComponent {
  date = model<Date>(new Date());
  timeChange = output<Date>();

  timeSlots: string[] = [];
  selectedTime = model<string>('09:00');

  constructor() {
    this.generateTimeSlots();
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes() >= 30 ? '30' : '00';
    this.selectedTime.set(`${h.toString().padStart(2, '0')}:${m}`);
  }

  generateTimeSlots() {
    for (let i = 0; i < 24; i++) {
      const h = i.toString().padStart(2, '0');
      this.timeSlots.push(`${h}:00`, `${h}:30`);
    }
  }

  onDateChange(newDate: Date) {
    this.date.set(newDate);
    this.emitFullDate();
  }

  onTimeChange(newTime: string) {
    this.selectedTime.set(newTime);
    this.emitFullDate();
  }

  private emitFullDate() {
    const d = new Date(this.date());
    const [h, m] = this.selectedTime().split(':').map(Number);
    d.setHours(h, m, 0, 0);
    this.timeChange.emit(d);
  }
}
