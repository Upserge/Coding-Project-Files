import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { First } from '../first';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FormsModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

  newPet: string = '';
  firstService = inject(First);

  addPet() {
    this.firstService.pets.push(this.newPet);
    this.newPet = '';
  }

}
