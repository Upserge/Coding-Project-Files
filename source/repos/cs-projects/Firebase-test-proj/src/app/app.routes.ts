import { Routes } from '@angular/router';
import { TestComponent } from './test-component/test-component';

export const routes: Routes = [
  {
    path: '**',
    redirectTo: 'TestComponent',
    pathMatch: 'full',
  }
];
