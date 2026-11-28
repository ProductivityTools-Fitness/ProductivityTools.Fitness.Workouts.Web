import { Component, inject, signal, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { NotificationComponent } from './notification/notification.component';
import { NotificationService } from './notification/notification.service';
import { DebugBarComponent } from './debug-bar/debug-bar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationComponent, DebugBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly authService = inject(AuthService);
  readonly notificationService = inject(NotificationService);
  avatarLoadError = signal<boolean>(false);

  constructor() {
    effect(() => {
      this.authService.currentUser();
      this.avatarLoadError.set(false);
    });

    if (typeof window !== 'undefined') {
      (window as unknown as { testNotification401?: () => void }).testNotification401 = () => {
        this.notificationService.showError(
          'Brak autoryzacji (401). Twoja sesja wygasła lub nie masz dostępu. Zaloguj się, aby kontynuować.',
          {
            label: 'Zaloguj się',
            callback: () => {
              window.location.href = '/login';
            },
          },
          8000
        );
      };
    }
  }

  logout(): void {
    this.authService.logout();
  }
}




