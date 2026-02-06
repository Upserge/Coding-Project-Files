import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { BookService } from '../book-service.js';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add',
  imports: [FormsModule],
  templateUrl: './add.html',
  styleUrl: './add.css',
})
export class Add {

  bookService = inject(BookService);
  
}
