import { Injectable, signal, computed, inject } from '@angular/core';
import { IUser } from '../models/user.model';
import { Router } from '@angular/router';

export interface AuthState {
    user: IUser | null;
    isAuthenticated: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class MockAuthService {
    private router = inject(Router);
    private readonly USERS_DB_KEY = 'mock_users_db';
    private readonly SESSION_KEY = 'mock_session';

    private authState = signal<AuthState>({
        user: null,
        isAuthenticated: false
    });

    currentUser = computed(() => this.authState().user);
    isAuthenticated = computed(() => this.authState().isAuthenticated);

    constructor() {
        this.checkSession();
    }

    private checkSession() {
        const session = localStorage.getItem(this.SESSION_KEY);
        if (session) {
            const user = JSON.parse(session) as IUser;
            this.authState.set({ user, isAuthenticated: true });
        }
    }

    register(userData: Omit<IUser, 'id'>, password: string): boolean {
        const users = this.getUsersDB();
        if (users.find(u => u.email === (userData as any).email)) {
            return false; // Email already exists
        }

        const newUser: IUser & { password?: string, email: string } = {
            ...userData,
            id: `user-${Date.now()}`,
            email: (userData as any).email,
            password: password
        };

        users.push(newUser);
        this.saveUsersDB(users);
        this.login(newUser.email, password);
        return true;
    }

    login(email: string, password: string): boolean {
        const users = this.getUsersDB();
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            const { password, ...sessionUser } = user;
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionUser));
            this.authState.set({ user: sessionUser as IUser, isAuthenticated: true });
            return true;
        }
        return false;
    }

    logout() {
        localStorage.removeItem(this.SESSION_KEY);
        this.authState.set({ user: null, isAuthenticated: false });
        this.router.navigate(['/auth/login']);
    }

    private getUsersDB(): any[] {
        const db = localStorage.getItem(this.USERS_DB_KEY);
        return db ? JSON.parse(db) : [];
    }

    private saveUsersDB(users: any[]) {
        localStorage.setItem(this.USERS_DB_KEY, JSON.stringify(users));
    }
}
