import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { ViewerShellComponent } from './layout/viewer-shell/viewer-shell';
import { AdminShellComponent } from './layout/admin-shell/admin-shell';
import { NotFoundComponent } from './features/not-found/not-found';

export const routes: Routes = [
  {
    path: '',
    component: ViewerShellComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/viewer/viewer.routes').then(m => m.viewerRoutes),
      },
    ],
  },
  {
    path: 'admin',
    component: AdminShellComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/admin/admin.routes').then(m => m.adminRoutes),
      },
    ],
  },
  {
    path: '**',
    component: ViewerShellComponent,
    children: [
      { path: '', component: NotFoundComponent },
    ],
  },
];
