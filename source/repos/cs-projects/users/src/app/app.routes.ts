import { Routes } from '@angular/router';
import { UserCreateComponent } from './user-create-component/user-create-component';
import { UsersListComponent } from './users-list-component/users-list-component';
import { UserEditComponent } from './user-edit-component/user-edit-component';

export const routes: Routes = [
  {
    path: 'New',
    component: UserCreateComponent
  },

  {
    path: 'Users',
    component: UsersListComponent
  },

  {
    path: 'Edit',
    component: UserEditComponent
  },

  {
    path: '**',
    redirectTo: 'Users',
    pathMatch: 'full'
  },

];
