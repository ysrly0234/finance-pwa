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
  templateUrl: './timeline-control.component.html',
  styleUrls: ['./timeline-control.component.scss']
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
