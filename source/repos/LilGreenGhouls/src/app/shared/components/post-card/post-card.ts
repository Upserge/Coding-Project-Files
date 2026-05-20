import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Post } from '../../../core/models/post.model';
import { getPostAdventureDate } from '../../../core/utils/post-date.util';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './post-card.html',
  styleUrl: './post-card.css',
})
export class PostCardComponent {
  readonly post = input.required<Post>();

  protected adventureDate(post: Post): Date {
    return getPostAdventureDate(post);
  }
}
