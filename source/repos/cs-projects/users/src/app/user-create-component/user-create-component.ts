import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { inject } from '@angular/core';
import { UsersService, User, UsersCollection } from '../users-service.js';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-create-component',
  imports: [RouterModule, FormsModule],
  templateUrl: './user-create-component.html',
  styleUrl: './user-create-component.css',
})
export class UserCreateComponent {
  usersService = inject(UsersService);
}
