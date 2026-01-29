import { Routes } from '@angular/router';
import { Test } from './test/test';
import { PaymentMember } from './pages/payment-member/payment-member';

export const routes: Routes = [
    { path: 'test', component: Test },
    { path: 'payment-member', component: PaymentMember }
];
