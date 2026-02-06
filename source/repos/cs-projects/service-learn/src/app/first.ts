import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root', //singleton service
})
export class First {
  pets = ['dog', 'cat', 'hamster'];

}
