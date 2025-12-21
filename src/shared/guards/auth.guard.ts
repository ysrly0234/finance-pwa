import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { MockAuthService } from '../services/mock-auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(MockAuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
};
