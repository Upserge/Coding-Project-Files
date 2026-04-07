import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, Timestamp } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppUser } from '../models/user.model';
import { environment } from '../../../environments/environment';

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

  constructor() {
    // Auto-hydrate appUser when Firebase restores the session on page refresh
    effect(() => {
      const fbUser = this.firebaseUser();
      if (fbUser && !this.appUser()) {
        this.loadUserProfile(fbUser.uid);
      }
    });
  }

  private resolveRole(email: string): 'admin' | 'viewer' {
    return environment.adminEmails.includes(email) ? 'admin' : 'viewer';
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(this.auth, provider);
    const fbUser = credential.user;

    const userDocRef = doc(this.firestore, `users/${fbUser.uid}`);
    const userSnap = await getDoc(userDocRef);
    const role = this.resolveRole(fbUser.email ?? '');

    if (userSnap.exists()) {
      const existingData = userSnap.data() as AppUser;
      const updated = { ...existingData, role, lastLogin: Timestamp.now() };
      await setDoc(userDocRef, updated);
      this.appUser.set(updated);
    } else {
      const newUser: AppUser = {
        uid: fbUser.uid,
        displayName: fbUser.displayName ?? 'Anonymous Ghost',
        email: fbUser.email ?? '',
        photoURL: fbUser.photoURL ?? '',
        role,
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
