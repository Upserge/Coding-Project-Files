import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, Timestamp } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  /** Firebase auth user as a signal (null when signed out) */
  readonly firebaseUser = toSignal(user(this.auth), { initialValue: null });

  /** App user profile from Firestore */
  readonly appUser = signal<AppUser | null>(null);

  /** Whether the current user has admin role */
  readonly isAdmin = computed(() => this.appUser()?.role === 'admin');

  /** Whether any user is currently signed in */
  readonly isSignedIn = computed(() => !!this.firebaseUser());

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(this.auth, provider);
    const fbUser = credential.user;

    const userDocRef = doc(this.firestore, `users/${fbUser.uid}`);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      // Update last login
      const existingData = userSnap.data() as AppUser;
      await setDoc(userDocRef, { ...existingData, lastLogin: Timestamp.now() });
      this.appUser.set({ ...existingData, lastLogin: Timestamp.now() });
    } else {
      // Create new viewer user
      const newUser: AppUser = {
        uid: fbUser.uid,
        displayName: fbUser.displayName ?? 'Anonymous Ghost',
        email: fbUser.email ?? '',
        photoURL: fbUser.photoURL ?? '',
        role: 'viewer',
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
      };
      await setDoc(userDocRef, newUser);
      this.appUser.set(newUser);
    }
  }

  async signOutUser(): Promise<void> {
    await signOut(this.auth);
    this.appUser.set(null);
  }

  /** Re-hydrate appUser from Firestore (e.g., on app init if already signed in) */
  async loadUserProfile(uid: string): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      this.appUser.set(userSnap.data() as AppUser);
    }
  }
}
