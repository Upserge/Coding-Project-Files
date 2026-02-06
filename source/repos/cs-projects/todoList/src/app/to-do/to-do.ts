import { Component } from '@angular/core';
import { ToDoService } from '../to-do-service';
import { inject } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-to-do',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './to-do.html',
  styleUrl: './to-do.css',
})
export class ToDo {
  toDoService = inject(ToDoService);

  formGroup = new FormGroup({
    content: new FormControl(''),
  })

  readAllTodos() {
    return this.toDoService.readAllTodos();
  }

  createToDo() {
    return this.toDoService.createToDo(this.formGroup.get('content')?.value ?? '');
  }
}
