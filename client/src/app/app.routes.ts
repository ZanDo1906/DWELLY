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
import { AboutUs } from './pages/about-us/about-us';
import { BlogDetail } from './pages/blog/blog-detail/blog-detail';
import { BlogList } from './pages/blog/blog-list/blog-list';
import { LoginAlertPopup } from './pages/cart/login-alert-popup/login-alert-popup';
import { CartPage } from './pages/cart/cart-page/cart-page';
import { VoucherPopup } from './pages/cart/voucher-popup/voucher-popup';
import { QRPayment } from './pages/payment/qr-payment/qr-payment';
import { Support } from './pages/policy/support/support';
import { Terms } from './pages/policy/terms/terms';
import { Concept } from './services/concept';
import { ConceptDetail } from './pages/product/concept-detail/concept-detail';
import { ConceptList } from './pages/product/concept-list/concept-list';
import { ProductList } from './pages/product/product-list/product-list';

export const routes: Routes = [
    { path: 'test', component: Test },
    { path: '', component: HomePage }, 
    { path: 'payment-member', component: PaymentMember },
    { path: 'payment-non-member', component: PaymentNonMember },
    { path: 'qr-payment', component: QRPayment },
    { path: 'forgot-password', component: ForgotPassword },
    { path: 'about-us', component: AboutUs },
    { path: 'blog-detail', component: BlogDetail },
    { path: 'blog-list', component: BlogList },
    { path: 'cart-page', component: CartPage },
    { path: 'login-alert-popup', component: LoginAlertPopup },
    { path: 'voucher-popup', component: VoucherPopup },
    { path: 'support', component: Support },
    { path: 'terms', component: Terms },
    { path: 'concept-list', component: ConceptList },
    { path: 'concept-detail', component: ConceptDetail },
    { path: 'product-list', component: ProductList },

    

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
