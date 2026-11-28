import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, tap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { NotificationService } from '../notification/notification.service';
import { DebugStatusService } from '../core/debug-status.service';

function shortPath(url: string): string {
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    return parsed.pathname.replace(/^\/api/, '') || '/';
  } catch {
    return url;
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);
  const debugStatus = inject(DebugStatusService);
  const router = inject(Router);
  const startedAt = Date.now();
  const label = `${req.method} ${shortPath(req.url)}`;

  debugStatus.pending(label);

  return from(authService.getIdToken()).pipe(
    switchMap((token) => {
      let authReq = req;

      if (token && !req.headers.has('Authorization')) {
        authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      return next(authReq).pipe(
        tap((event) => {
          if (event instanceof HttpResponse) {
            debugStatus.success(`${label} (${event.status})`, Date.now() - startedAt);
          }
        })
      );
    }),
    catchError((error: unknown) => {
      const status =
        error instanceof HttpErrorResponse
          ? error.status
          : typeof error === 'object' && error !== null && 'status' in error
            ? Number((error as { status: unknown }).status)
            : undefined;

      debugStatus.error(`${label} → ${status ?? 'ERR'}`, Date.now() - startedAt);

      console.warn('[authInterceptor] Caught HTTP error:', {
        url: req.url,
        status,
        statusText: error instanceof HttpErrorResponse ? error.statusText : (error as any)?.statusText,
        error,
      });

      if (status === 401) {
        notificationService.showError(
          'Brak autoryzacji (401). Twoja sesja wygasła lub nie masz dostępu. Zaloguj się, aby kontynuować.',
          {
            label: 'Zaloguj się',
            callback: () => {
              router.navigate(['/login']);
            },
          },
          8000
        );
      } else if (status === 403) {
        notificationService.showError(
          'Brak uprawnień (403). Nie posiadasz dostępu do tego zasobu.',
          {
            label: 'Zaloguj się',
            callback: () => {
              router.navigate(['/login']);
            },
          },
          8000
        );
      } else if (status === 0) {
        notificationService.showError(
          'Błąd sieci lub CORS (status 0). Jeśli serwer zwrócił 401, upewnij się, że odpowiedź zawiera nagłówek CORS (Access-Control-Allow-Origin).',
          undefined,
          8000
        );
      }

      return throwError(() => error);
    })
  );
};
