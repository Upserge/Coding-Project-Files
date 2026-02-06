import { Routes } from '@angular/router';
import { ToDo } from './to-do/to-do';

export const routes: Routes = [
  {
    path: 'ToDo',
    component: ToDo
  },

  {
    path: '**',
    redirectTo: 'ToDo',
    pathMatch: 'full'
  }
];
