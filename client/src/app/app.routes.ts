import { Routes } from '@angular/router';
import { Test } from './test/test';
import { PaymentMember } from './pages/payment-member/payment-member';
import { PaymentNonMember } from './pages/payment-non-member/payment-non-member';
import { ForgotPassword } from './pages/forgot-password/forgot-password';

export const routes: Routes = [
    { path: 'test', component: Test },
    { path: 'payment-member', component: PaymentMember },
    { path: 'payment-non-member', component: PaymentNonMember },
    { path: 'forgot-password', component: ForgotPassword }
];
