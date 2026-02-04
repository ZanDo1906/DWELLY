import { Routes } from '@angular/router';
import { Test } from './test/test';
import { PaymentMember } from './pages/payment/payment-member/payment-member';
import { PaymentNonMember } from './pages/payment/payment-non-member/payment-non-member';
import { ForgotPassword } from './pages/auth/forgot-password/forgot-password';
import { HomePage } from './pages/home-page/home-page';
import { Orders } from './pages/profile/orders/orders';
import { OrderDetail } from './pages/profile/order-detail/order-detail';
import { UserLayout } from './pages/profile/user-layout/user-layout';
import { Address } from './pages/profile/address/address';
import { Info } from './pages/profile/info/info';
import { Notifications } from './pages/profile/notifications/notifications';
import { Order } from './services/order';
import { Returns } from './pages/profile/returns/returns';
import { Reviews } from './pages/profile/reviews/reviews';
import { Wishlist } from './pages/profile/wishlist/wishlist';

export const routes: Routes = [
    { path: 'test', component: Test },
    { path: '', component: HomePage }, 
    { path: 'payment-member', component: PaymentMember },
    { path: 'payment-non-member', component: PaymentNonMember },
    { path: 'forgot-password', component: ForgotPassword },
    

    // User Layout với sidebar cố định
    {
        path: 'user-layout', component: UserLayout,
        children: [
            { path: 'address', component: Address }, 
            { path: 'info', component: Info }, 
            { path: 'notifications', component: Notifications }, 
            { path: 'orders', component: Orders }, 
            { path: 'order-detail', component: OrderDetail }, 
            { path: 'returns', component: Returns}, 
            { path: 'reviews', component: Reviews}, 
            { path: 'wishlist', component: Wishlist}, 
        ]
    },
    

];
