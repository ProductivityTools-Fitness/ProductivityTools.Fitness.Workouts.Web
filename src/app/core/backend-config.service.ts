import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../environments/environment';

export interface BackendOption {
  id: string;
  label: string;
  url: string;
  isBackup?: boolean;
}

const STORAGE_KEY = 'pt_fitness_api_url';

export const PROD_BACKEND_OPTIONS: readonly BackendOption[] = [
  {
    id: 'prod',
    label: 'Prod (default)',
    url: 'https://fitness-workouts-api.productivitytools.top/api',
  },
  {
    id: 'cloud',
    label: 'Cloud (backup)',
    url: 'https://fitness-workouts-api-cloud.productivitytools.top/api',
    isBackup: true,
  },
  {
    id: 'ubuntu',
    label: 'Ubuntu (backup)',
    url: 'https://fitness-workouts-api-ubuntu.productivitytools.top/api',
    isBackup: true,
  },
];

export const DEV_LOCAL_OPTION: BackendOption = {
  id: 'local',
  label: 'Local (:8084)',
  url: 'http://localhost:8084/api',
};

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

@Injectable({
  providedIn: 'root',
})
export class BackendConfigService {
  readonly options: readonly BackendOption[] = environment.production
    ? PROD_BACKEND_OPTIONS
    : [DEV_LOCAL_OPTION, ...PROD_BACKEND_OPTIONS];

  private readonly defaultUrl = normalizeUrl(environment.apiUrl);

  readonly selectedUrl = signal<string>(this.loadInitialUrl());

  readonly selectedOption = computed<BackendOption>(() => {
    const current = this.selectedUrl();
    return (
      this.options.find((o) => normalizeUrl(o.url) === current) ?? {
        id: 'custom',
        label: current,
        url: current,
      }
    );
  });

  readonly apiUrl = computed<string>(() => this.selectedUrl());

  selectBackend(url: string): boolean {
    const normalized = normalizeUrl(url);
    if (!normalized || normalized === this.selectedUrl()) {
      return false;
    }
    this.selectedUrl.set(normalized);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, normalized);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
    return true;
  }

  resetToDefault(): void {
    this.selectedUrl.set(this.defaultUrl);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }

  private loadInitialUrl(): string {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && saved.trim() !== '') {
          const normalized = normalizeUrl(saved);
          if (this.options.some((o) => normalizeUrl(o.url) === normalized)) {
            return normalized;
          }
        }
      }
    } catch {
      // Ignore storage errors
    }
    return this.defaultUrl;
  }
}
