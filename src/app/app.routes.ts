import { Routes } from '@angular/router';
import { OverviewComponent } from './overview/overview.component';
import { ManageBudgetsComponent } from './manage-budgets/manage-budgets.component';
import { ProfileComponent } from './profile/profile.component';
import { AccountsComponent } from './accounts/accounts.component';
import { CreditCardsComponent } from './credit-cards/credit-cards.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { authGuard } from '../shared/guards/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';

export const routes: Routes = [
    { path: '', component: OverviewComponent, canActivate: [authGuard] },
    { path: 'budgets', component: ManageBudgetsComponent, canActivate: [authGuard] },
    { path: 'accounts', component: AccountsComponent, canActivate: [authGuard] },
    { path: 'credit-cards', component: CreditCardsComponent, canActivate: [authGuard] },
    { path: 'transactions', component: TransactionsComponent, canActivate: [authGuard] },
    { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
    { path: 'auth/login', component: LoginComponent },
    { path: 'auth/register', component: RegisterComponent },
    { path: '**', redirectTo: 'auth/login' }
];
