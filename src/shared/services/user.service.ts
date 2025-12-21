import { Injectable, signal, computed } from '@angular/core';
import { IUser } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    // For now, hardcoded current user. In the future, this will come from authentication
    private currentUser = signal<IUser>({
        id: 'user-1',
        firstName: 'משתמש',
        lastName: 'דוגמה',
        nickname: undefined,
        dateOfBirth: undefined
    });

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
        this.currentUser.update(current => ({
            ...current,
            ...userData
        }));
    }
}
