import { Routes } from '@angular/router';
import { Test } from './test/test';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { ProductDetail } from './pages/product-detail/product-detail';
import { ProductDetailConcept } from './pages/product-detail-concept/product-detail-concept';

export const routes: Routes = [
    { path: 'test', component: Test },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'product', component: ProductDetail },
    { path: 'product/:id', component: ProductDetail },
    { path: 'product-concept', component: ProductDetailConcept }
];
