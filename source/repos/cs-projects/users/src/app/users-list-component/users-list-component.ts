import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { inject } from '@angular/core';
import { UsersService } from '../users-service.js';

@Component({
  selector: 'app-users-list-component',
  imports: [RouterModule],
  templateUrl: './users-list-component.html',
  styleUrl: './users-list-component.css',
})
export class UsersListComponent {
  usersService = inject(UsersService);
}
