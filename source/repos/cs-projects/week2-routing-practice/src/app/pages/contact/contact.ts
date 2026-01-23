import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  imports: [],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  title = 'Contact';
  description = 'This page is showing off all the places you can hit to hire me :)';
  Phone = 'REDACTED (just email me)';
  Email = 'jasoncsalas@gmail.com';
  linkedIn = 'linkedin.com/in/jasoncsalas';
}
