import { Routes } from '@angular/router';
import { Test } from './test/test';
import { PaymentMember } from './pages/payment-member/payment-member';
import { PaymentNonMember } from './pages/payment-non-member/payment-non-member';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { HomePage } from './pages/home-page/home-page';
import { Orders } from './pages/orders/orders';
import { OrderDetail } from './pages/order-detail/order-detail';

export const routes: Routes = [
    { path: 'test', component: Test },
    { path: '', component: HomePage }, 
    { path: 'payment-member', component: PaymentMember },
    { path: 'payment-non-member', component: PaymentNonMember },
    { path: 'forgot-password', component: ForgotPassword },
    { path: 'orders', component: Orders },
    { path: 'order-detail', component: OrderDetail },

];
