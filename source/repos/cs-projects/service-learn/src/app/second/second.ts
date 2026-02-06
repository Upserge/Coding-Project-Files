import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { First } from '../first';

@Component({
  selector: 'app-second',
  imports: [],
  templateUrl: './second.html',
  styleUrl: './second.css',
})
export class Second {
  firstService = inject(First);

  testSecond = 'Second Works!'; 
}
