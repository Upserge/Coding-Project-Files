import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { applyVisualTier } from './app/content/visual-tier';

applyVisualTier();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
