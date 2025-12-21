import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class StorageService {

    constructor() { }

    getItem<T>(key: string): Observable<T | null> {
        if (environment.storageType === 'firebase') {
            return throwError(() => new Error('Firebase storage is not supported yet.'));
        }
        const item = localStorage.getItem(key);
        return of(item ? JSON.parse(item) : null);
    }

    setItem<T>(key: string, value: T): Observable<void> {
        if (environment.storageType === 'firebase') {
            return throwError(() => new Error('Firebase storage is not supported yet.'));
        }
        localStorage.setItem(key, JSON.stringify(value));
        return of(void 0);
    }

    removeItem(key: string): Observable<void> {
        if (environment.storageType === 'firebase') {
            return throwError(() => new Error('Firebase storage is not supported yet.'));
        }
        localStorage.removeItem(key);
        return of(void 0);
    }
}
