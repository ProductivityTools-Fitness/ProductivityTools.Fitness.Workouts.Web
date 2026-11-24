import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  Auth,
} from 'firebase/auth';
import { auth } from '../firebase.config';
import { environment } from '../../environments/environment';

interface UserProfileResponse {
  id: number;
  email: string;
  username: string;
  isAdmin?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth: Auth = auth;
  private readonly http = inject(HttpClient, { optional: true });

  readonly currentUser = signal<User | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly isAdmin = signal<boolean>(false);

  readonly isLoggedIn = computed(() => !!this.currentUser());
  readonly userEmail = computed(() => this.currentUser()?.email ?? null);
  readonly displayName = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return user.displayName || user.email || 'Użytkownik';
  });
  readonly photoURL = computed(() => this.currentUser()?.photoURL ?? null);

  constructor() {
    this.initAuthStateListener();
  }

  protected initAuthStateListener(): void {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      this.isLoading.set(false);
      if (user) {
        this.refreshUserProfile();
      } else {
        this.isAdmin.set(false);
      }
    });
  }

  private refreshUserProfile(): void {
    if (!this.http) {
      return;
    }
    this.http.get<UserProfileResponse>(`${environment.apiUrl}/user/me`).subscribe({
      next: (profile) => this.isAdmin.set(Boolean(profile?.isAdmin)),
      error: () => this.isAdmin.set(false),
    });
  }

  async loginWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(this.auth, provider);
    this.currentUser.set(result.user);
    this.refreshUserProfile();
    return result.user;
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUser.set(null);
    this.isAdmin.set(false);
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    if (this.isLoading()) {
      try {
        await this.auth.authStateReady?.();
      } catch {
        // ignore if not supported
      }
    }
    const user = this.currentUser() || this.auth.currentUser;
    if (!user) return null;
    return user.getIdToken(forceRefresh);
  }
}
