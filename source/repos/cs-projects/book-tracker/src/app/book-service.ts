import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  public books: { title: string; author: string; id: number }[] = [];
  newTitle: string = '';
  newAuthor: string = '';
  addBook() {
    if (!this.newTitle || !this.newAuthor) {
      alert('Please provide both title and author');
      this.newTitle = '';
      this.newAuthor = '';
      return;
    }
    const newBook = {
      title: this.newTitle,
      author: this.newAuthor,
      id: this.books.length + 1,
    };
    this.books.push(newBook);
    this.newTitle = '';
    this.newAuthor = '';
    console.log(this.books);
  }

  getBooks() {
    return this.books;
  }
}
