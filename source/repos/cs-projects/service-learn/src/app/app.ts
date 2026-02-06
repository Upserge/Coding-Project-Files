import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { First } from './first.js';
import { Second } from './second/second.js';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

}
