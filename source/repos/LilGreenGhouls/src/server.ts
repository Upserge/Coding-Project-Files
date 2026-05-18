import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore, orderBy, query, where } from 'firebase/firestore/lite';
import { join } from 'node:path';
import { Post } from './app/core/models/post.model';
import { RssService } from './app/core/services/rss.service';
import { normalizePost } from './app/core/utils/post-media.util';
import { environment } from './environments/environment';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
const firebaseApp = initializeApp(environment.firebase);
const firestore = getFirestore(firebaseApp);
const rssService = new RssService();

app.get('/feed', async (req, res, next) => {
  try {
    const posts = await getPublishedPosts();
    const xml = rssService.generateFeed(posts, getSiteUrl(req));

    res
      .status(200)
      .type('application/rss+xml; charset=utf-8')
      .set('Cache-Control', 'public, max-age=300, s-maxage=900')
      .send(xml);
  } catch (error) {
    next(error);
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

async function getPublishedPosts(): Promise<Post[]> {
  const postsQuery = query(
    collection(firestore, 'posts'),
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc'),
  );
  const snap = await getDocs(postsQuery);

  return snap.docs.map(docSnap => normalizePost({ id: docSnap.id, ...docSnap.data() } as Post));
}

function getSiteUrl(req: express.Request): string {
  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProto || req.protocol;
  return `${protocol}://${req.get('host')}`;
}
