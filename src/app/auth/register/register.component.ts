import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MockAuthService } from '../../../shared/services/mock-auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule
    ],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss'
})
export class RegisterComponent {
    private fb = inject(FormBuilder);
    private authService = inject(MockAuthService);
    private router = inject(Router);

    registerForm = this.fb.group({
        firstName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
    });

    errorMsg = signal<string | null>(null);
    hidePassword = signal(true);

    togglePasswordVisibility() {
        this.hidePassword.update(v => !v);
    }

    onSubmit() {
        if (this.registerForm.valid) {
            const { firstName, email, password } = this.registerForm.value;
            const success = this.authService.register({ firstName: firstName!, email: email! } as any, password!);

            if (success) {
                this.router.navigate(['/']);
            } else {
                this.errorMsg.set('האימייל כבר קיים במערכת');
            }
        }
    }
}
