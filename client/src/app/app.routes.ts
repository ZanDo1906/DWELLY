import { Routes } from '@angular/router';
import { Test } from './test/test';
import { HomePage } from './pages/home-page/home-page';

export const routes: Routes = [
    { path: 'test', component: Test },
    { path: '', component: HomePage }, 
];
