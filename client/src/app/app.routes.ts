import { Routes } from '@angular/router';
import { Test } from './test/test';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';

export const routes: Routes = [
    { path: 'test', component: Test },
    { path: 'login', component: Login },
    { path: 'register', component: Register }
];
