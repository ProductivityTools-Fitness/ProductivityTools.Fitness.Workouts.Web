import { TestBed } from '@angular/core/testing';
import { BackendConfigService, PROD_BACKEND_OPTIONS } from './backend-config.service';
import { environment } from '../../environments/environment';

describe('BackendConfigService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should default to environment.apiUrl when nothing is stored', () => {
    const service = TestBed.inject(BackendConfigService);
    expect(service.apiUrl()).toBe(environment.apiUrl);
  });

  it('should expose all 3 production backends (default + 2 backups)', () => {
    const service = TestBed.inject(BackendConfigService);
    const urls = service.options.map((o) => o.url);
    for (const opt of PROD_BACKEND_OPTIONS) {
      expect(urls).toContain(opt.url);
    }
  });

  it('should persist selected backend in localStorage and restore it', () => {
    const service = TestBed.inject(BackendConfigService);
    const cloudUrl = 'https://fitness-workouts-api-cloud.productivitytools.top/api';

    expect(service.selectBackend(cloudUrl)).toBe(true);
    expect(service.apiUrl()).toBe(cloudUrl);
    expect(service.selectedOption().id).toBe('cloud');
    expect(localStorage.getItem('pt_fitness_api_url')).toBe(cloudUrl);

    // Selecting the same URL again returns false
    expect(service.selectBackend(cloudUrl)).toBe(false);

    // Resetting restores default
    service.resetToDefault();
    expect(service.apiUrl()).toBe(environment.apiUrl);
    expect(localStorage.getItem('pt_fitness_api_url')).toBeNull();
  });
});
