import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { UserService } from '../../shared/services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  profileForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', Validators.maxLength(50)],
    dateOfBirth: [null as Date | null],
    nickname: ['', Validators.maxLength(50)]
  });

  displayName = this.userService.displayName;

  constructor() {
    effect(() => {
      const user = this.userService.user();
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName || '',
        dateOfBirth: user.dateOfBirth || null,
        nickname: user.nickname || ''
      }, { emitEvent: false });
    });
  }

  ngOnInit(): void { }

  onSubmit() {
    if (this.profileForm.valid) {
      const formValue = this.profileForm.value;
      this.userService.updateUser({
        firstName: formValue.firstName!,
        lastName: formValue.lastName || undefined,
        dateOfBirth: formValue.dateOfBirth || undefined,
        nickname: formValue.nickname || undefined
      });
    }
  }
}
