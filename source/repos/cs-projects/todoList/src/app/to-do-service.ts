import { Injectable } from '@angular/core';


export interface todoItem {
  id: string,
  content: string,
  completed: boolean,
}

export interface todoCollection {
  [id: string]: todoItem;
}

@Injectable({
  providedIn: 'root',
})

export class ToDoService {
  private todos: todoCollection = {};

  createToDo(content: string): todoItem {
    const newToDo = {
      id: crypto.randomUUID(),
      content,
      completed: false,
    }

    this.todos[newToDo.id] = newToDo;
    return newToDo;
  }

  readAllTodos(): todoItem[] {
    return Object.values(this.todos);
  }

}
