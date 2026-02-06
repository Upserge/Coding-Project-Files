import { Injectable } from '@angular/core';
import { UserUpdateFields } from './user-edit-component/user-edit-component';

@Injectable({
  providedIn: 'root',
})

export class UsersService {

  public users: UsersCollection = {

  };

newFirstName: string = '';
newLastName: string = '';

getAllUsers() {
  return this.users
}

createUser(firstName: string, lastName: string) {
  var newUser: User = {
    firstName: this.newFirstName,
    lastName: this.newLastName,
    id: (Object.keys(this.users).length + 1).toString()
  }
  this.users[newUser.id] = newUser;
  this.newFirstName = '';
  this.newLastName = '';
  console.log(this.users);
}

updateUser(id: string, updates: UserUpdateFields) {

}

deleteUser(id: string) {

}

User1: User = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
};

}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
}

export interface UsersCollection {
  [id: string]: User;
}
