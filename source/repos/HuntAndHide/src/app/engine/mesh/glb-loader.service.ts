import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface GlbEntry {
  key: string;
  path: string;
}

/**
 * Preloads GLB models into an in-memory cache.
 * After `preloadAll()` resolves, call `getModel(key)` synchronously
 * to obtain a deep-cloned THREE.Group ready for scene insertion.
 */
@Injectable({ providedIn: 'root' })
export class GlbLoaderService {
  private readonly loader = new GLTFLoader();
  private readonly cache = new Map<string, THREE.Group>();

  preloadAll(entries: GlbEntry[]): Promise<void> {
    const tasks = entries.map(e => this.load(e));
    return Promise.all(tasks).then(() => void 0);
  }

  getModel(key: string): THREE.Group | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    return cached.clone();
  }

  private load(entry: GlbEntry): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.loader.load(
        entry.path,
        (gltf: GLTF) => {
          this.cache.set(entry.key, gltf.scene);
          resolve();
        },
        undefined,
        (err) => {
          console.error(`[GlbLoader] Failed to load "${entry.key}" from ${entry.path}`, err);
          reject(err);
        },
      );
    });
  }
}
