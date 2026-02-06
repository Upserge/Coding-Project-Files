import { Routes } from '@angular/router';
import { Second } from './second/second';
import { Home } from './home/home';

export const routes: Routes = [
  {
    path: 'second',
    component: Second,
  },

  {
    path: 'home',
    component: Home,
  },

  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full',
  }
];
