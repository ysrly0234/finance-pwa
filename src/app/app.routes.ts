import { Routes } from '@angular/router';
import { OverviewDashboardComponent } from './overview-dashboard/overview-dashboard.component';
import { ManageBudgetsComponent } from './manage-budgets/manage-budgets.component';
import { ProfileComponent } from './app/profile/profile.component';
import { AccountsComponent } from './app/accounts/accounts.component';
import { CreditCardsComponent } from './app/credit-cards/credit-cards.component';
import { TransactionsComponent } from './app/transactions/transactions.component';

export const routes: Routes = [
    { path: '', component: OverviewDashboardComponent },
    { path: 'budgets', component: ManageBudgetsComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'accounts', component: AccountsComponent },
    { path: 'credit-cards', component: CreditCardsComponent },
    { path: 'transactions', component: TransactionsComponent },
    { path: '**', redirectTo: '' }
];
