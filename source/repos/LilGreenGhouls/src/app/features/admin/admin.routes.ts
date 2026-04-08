import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent),
  },
  {
    path: 'posts',
    loadComponent: () => import('./post-list/post-list').then(m => m.PostListComponent),
  },
  {
    path: 'posts/new',
    loadComponent: () => import('./post-editor/post-editor').then(m => m.PostEditorComponent),
  },
  {
    path: 'posts/:id/edit',
    loadComponent: () => import('./post-editor/post-editor').then(m => m.PostEditorComponent),
  },
  {
    path: 'subscribers',
    loadComponent: () => import('./subscriber-list/subscriber-list').then(m => m.SubscriberListComponent),
  },
  {
    path: 'comments',
    loadComponent: () => import('./comment-moderation/comment-moderation').then(m => m.CommentModerationComponent),
  },
];
