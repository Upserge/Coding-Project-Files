import { Routes } from '@angular/router';

export const viewerRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then(m => m.HomeComponent),
  },
  {
    path: 'adventures',
    loadComponent: () => import('./adventures/adventures').then(m => m.AdventuresComponent),
  },
  {
    path: 'adventures/:slug',
    loadComponent: () => import('./adventure-detail/adventure-detail').then(m => m.AdventureDetailComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./about/about').then(m => m.AboutComponent),
  },
];
