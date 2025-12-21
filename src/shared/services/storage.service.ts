import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { MockAuthService } from './mock-auth.service';

@Injectable({ providedIn: 'root' })
export class StorageService {
    private authService = inject(MockAuthService);

    constructor() { }

    private getFullKey(key: string): string {
        const userId = this.authService.currentUser()?.id || 'anonymous';
        return `${userId}_${key}`;
    }

    getItem<T>(key: string): Observable<T | null> {
        if (environment.storageType === 'firebase') {
            return throwError(() => new Error('Firebase storage is not supported yet.'));
        }
        const item = localStorage.getItem(this.getFullKey(key));
        return of(item ? JSON.parse(item) : null);
    }

    setItem<T>(key: string, value: T): Observable<void> {
        if (environment.storageType === 'firebase') {
            return throwError(() => new Error('Firebase storage is not supported yet.'));
        }
        localStorage.setItem(this.getFullKey(key), JSON.stringify(value));
        return of(void 0);
    }

    removeItem(key: string): Observable<void> {
        if (environment.storageType === 'firebase') {
            return throwError(() => new Error('Firebase storage is not supported yet.'));
        }
        localStorage.removeItem(this.getFullKey(key));
        return of(void 0);
    }
}
