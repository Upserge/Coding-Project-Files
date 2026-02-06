import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { inject } from '@angular/core';
import { User, UsersCollection, UsersService } from '../users-service.js';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-edit-component',
  imports: [FormsModule, RouterModule],
  templateUrl: './user-edit-component.html',
  styleUrl: './user-edit-component.css',
})
export class UserEditComponent {

  usersService = inject(UsersService);

}

export const deleteUserById = (params: {
  id: string;
  collection: UsersCollection;
}): UsersCollection => {
  const { id, collection } = params;

  const copiedCollection = { ...collection };
  delete copiedCollection[id];

  return copiedCollection;
}

export type UserUpdateFields = Partial<Omit<User, 'id'>>;

export const updateUserById = (params: {
  id: string;
  collection: UsersCollection;
  updates: Partial<Omit<User, 'id'>>;
}): UsersCollection => {
  const { id, collection, updates } = params;

  const existingUser = collection[id];
  if (!existingUser) {
    return collection;
  }

  return {
    ...collection,
    [id]: {
      ...existingUser,
      ...updates,
    },
  };
};
