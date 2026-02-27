import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./menu/menu').then(m => m.MenuComponent),
  },
  {
    path: 'game/:sessionId',
    loadComponent: () => import('./game/game').then(m => m.GameComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
