import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { BookService } from '../book-service.js';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-books',
  imports: [RouterModule],
  templateUrl: './books.html',
  styleUrl: './books.css',
})

export class Books {
  bookService = inject(BookService);
}
