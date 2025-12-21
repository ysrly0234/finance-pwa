import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { IUser } from '../models/user.model';
import { StorageService } from './storage.service';
import { MockAuthService } from './mock-auth.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private storageService = inject(StorageService);
    private authService = inject(MockAuthService);
    private readonly STORAGE_KEY = 'profile_data';

    private currentUser = signal<IUser>({
        id: 'anonymous',
        firstName: 'אורח',
        lastName: '',
        nickname: undefined,
        dateOfBirth: undefined
    });

    constructor() {
        effect(() => {
            const authUser = this.authService.currentUser();
            if (authUser) {
                this.loadUser();
            } else {
                this.currentUser.set({
                    id: 'anonymous',
                    firstName: 'אורח',
                    lastName: '',
                    nickname: undefined,
                    dateOfBirth: undefined
                });
            }
        }, { allowSignalWrites: true });
    }

    private loadUser() {
        this.storageService.getItem<IUser>(this.STORAGE_KEY).subscribe(user => {
            if (user) {
                this.currentUser.set(user);
            } else {
                // If no profile data exists in storage, use the auth user basic info
                const authUser = this.authService.currentUser();
                if (authUser) {
                    this.currentUser.set(authUser);
                }
            }
        });
    }

    user = this.currentUser.asReadonly();

    displayName = computed(() => {
        const user = this.currentUser();
        if (user.nickname) {
            return user.nickname;
        }
        if (user.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        return user.firstName;
    });

    updateUser(userData: Partial<IUser>) {
        this.currentUser.update(current => {
            const updated = {
                ...current,
                ...userData
            };
            this.storageService.setItem(this.STORAGE_KEY, updated).subscribe();
            return updated;
        });
    }
}
