import { Routes } from '@angular/router';
import { Test } from './test/test';
import { Login } from './pages/auth/login/login';
import { ForgotPassword } from './pages/auth/forgot-password/forgot-password';
import { ResetPassword } from './pages/auth/reset-password/reset-password';
import { BlogList } from './pages/blogs/blog-list/blog-list';
import { BlogForm } from './pages/blogs/blog-form/blog-form';
import { Blog} from './pages/blogs/blog/blog';
import { Dashboard } from './pages/dashboard/dashboard';
import { FaqList } from './pages/faqs/faq-list/faq-list';
import { FaqForm } from './pages/faqs/faq-form/faq-form';
import { OrderList } from './pages/orders/order-list/order-list';
import { OrderDetail } from './pages/orders/order-detail/order-detail';
import { AddOrder } from './pages/orders/add-order/add-order';
import { ProductList } from './pages/products/product-list/product-list';
import { ProductForm } from './pages/products/product-form/product-form';
import { Profile } from './pages/profile/profile';
import { PromotionList } from './pages/promotions/promotion-list/promotion-list';
import { PromotionForm } from './pages/promotions/promotion-form/promotion-form';
import { UserForm } from './pages/users/user-form/user-form';
import { UserList } from './pages/users/user-list/user-list';


export const routes: Routes = [
    { path: 'test', component: Test },
    { path: 'login', component: Login },
    { path: 'forgot-password', component: ForgotPassword },
    { path: 'reset-password', component: ResetPassword },
    { path: 'blog-list', component: BlogList },
    { path: 'blog-form', component: BlogForm },
    { path: 'blog-form/:id', component: BlogForm },
    { path: 'blog', component: Blog },
    { path: 'dashboard', component: Dashboard },
    { path: 'faq-list', component: FaqList },
    { path: 'faq-form', component: FaqForm },
    { path: 'faq-form/:id', component: FaqForm },
    { path: 'order-list', component: OrderList },
    { path: 'order-detail', component: OrderDetail },
    { path: 'order-detail/:id', component: OrderDetail },
    { path: 'add-order', component: AddOrder },
    { path: 'product-list', component: ProductList },
    { path: 'product-form', component: ProductForm },
    { path: 'product-form/:id', component: ProductForm },
    { path: 'profile', component: Profile },
    { path: 'promotion-list', component: PromotionList },
    { path: 'promotion-form', component: PromotionForm },
    { path: 'promotion-form/:id', component: PromotionForm },
    { path: 'user-list', component: UserList },
    { path: 'user-form', component: UserForm },
    { path: 'user-form/:id', component: UserForm },
    

];
