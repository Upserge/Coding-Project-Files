import { Routes } from '@angular/router';
import { Add } from './add/add';
import { Books } from './books/books';

export const routes: Routes = [
  {
    path: 'Add',
    component: Add
  },

  {
    path: 'Books',
    component: Books
  },
  
  {
    path: '**',
    redirectTo: 'Books',
    pathMatch: 'full'
  },
];
