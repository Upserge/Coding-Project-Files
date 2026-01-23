import { Component } from '@angular/core';
import { JsonPipe } from '@angular/common';

interface Pet {
  name: string;
  noise: string;
  }

@Component({
  selector: 'app-home',
  imports: [
    JsonPipe,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  title = 'Home';
  welcomeMessage = 'Welcome to Week 2 Angular';
  goal = ' Today we practice components, routes, and interpolation';

  pets: Pet[] = [
      { name: 'Dog', noise: 'Woof' },
      { name: 'Cat', noise: 'Meow' },
      { name: 'Cow', noise: 'Moo' },
      { name: 'Sheep', noise: 'Baa' },
      { name: 'Cortana', noise: 'Hello, I am Cortana'},
  ];

    selectPet(petName: string) {
      alert(`You selected: ${petName}`);
  }
}
