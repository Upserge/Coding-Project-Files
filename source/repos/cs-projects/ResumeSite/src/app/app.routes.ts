import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home-page/home-page').then((m) => m.HomePage),
  },
  {
    path: 'work/:slug',
    loadComponent: () => import('./pages/case-study-page/case-study-page').then((m) => m.CaseStudyPage),
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
