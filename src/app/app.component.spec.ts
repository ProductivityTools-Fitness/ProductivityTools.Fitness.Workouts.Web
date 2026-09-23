import { TestBed } from '@angular/core/testing';
import { signal, computed } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { AuthService } from './auth/auth.service';

describe('AppComponent', () => {
  let mockAuthService: any;

  beforeEach(async () => {
    const currentUserSignal = signal<any>(null);
    const isLoadingSignal = signal<boolean>(false);

    mockAuthService = {
      currentUser: currentUserSignal,
      isLoading: isLoadingSignal,
      isLoggedIn: computed(() => !!currentUserSignal()),
      userEmail: computed(() => currentUserSignal()?.email ?? null),
      displayName: computed(() => currentUserSignal()?.displayName || 'Test User'),
      photoURL: computed(() => currentUserSignal()?.photoURL ?? null),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'ProductivityTools.Fitness',
    );
  });

  it('should render login button when user is not logged in', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const loginLink = compiled.querySelector<HTMLAnchorElement>('.btn-login');
    expect(loginLink).toBeTruthy();
    expect(loginLink?.textContent).toContain('Zaloguj');
  });

  it('should render user info and logout button when user is logged in', async () => {
    mockAuthService.currentUser.set({
      uid: '123',
      email: 'user@test.com',
      displayName: 'Jan Kowalski',
    });

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.user-profile')).toBeTruthy();
    expect(compiled.querySelector('.user-name')?.textContent).toContain('Jan Kowalski');

    const logoutBtn = compiled.querySelector<HTMLButtonElement>('.btn-logout');
    expect(logoutBtn).toBeTruthy();

    logoutBtn?.click();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should render notification component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-notification')).toBeTruthy();
  });

  it('should render navigation links including Hevy import', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('nav a');
    const linkTexts = Array.from(navLinks).map((a) => a.textContent?.trim());
    expect(linkTexts).toContain('Hevy import');
    expect(linkTexts).toContain('Catalogue');
    expect(linkTexts).toContain('Treningi');
  });
});

