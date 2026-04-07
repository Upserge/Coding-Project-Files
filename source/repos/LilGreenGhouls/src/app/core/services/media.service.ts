import { Injectable, inject } from '@angular/core';
import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask,
} from '@angular/fire/storage';

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

@Injectable({ providedIn: 'root' })
export class MediaService {
  private storage = inject(Storage);

  /**
   * Upload a file to Firebase Storage with progress tracking and a timeout.
   * Returns the public download URL on success.
   */
  uploadFile(
    file: File,
    path: string,
    onProgress?: (percent: number) => void,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  ): Promise<string> {
    const storageRef = ref(this.storage, path);
    const task: UploadTask = uploadBytesResumable(storageRef, file);

    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        task.cancel();
        reject(new Error(`Upload timed out after ${timeoutMs / 1000}s for ${file.name}`));
      }, timeoutMs);

      task.on(
        'state_changed',
        (snapshot) => {
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          );
          onProgress?.(percent);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
        async () => {
          clearTimeout(timer);
          try {
            const url = await getDownloadURL(task.snapshot!.ref);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        },
      );
    });
  }

  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(this.storage, path);
    await deleteObject(storageRef);
  }
}
