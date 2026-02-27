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
    path: 'lobby/:sessionId',
    loadComponent: () => import('./lobby/lobby').then(m => m.LobbyComponent),
  },
  {
    path: 'scoreboard',
    loadComponent: () => import('./scoreboard/scoreboard').then(m => m.ScoreboardComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
