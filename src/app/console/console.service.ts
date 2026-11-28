import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackendConfigService } from '../core/backend-config.service';

@Injectable({
  providedIn: 'root',
})
export class ConsoleService {
  private readonly http = inject(HttpClient);
  private readonly backendConfig = inject(BackendConfigService);

  getServerName(): Observable<string> {
    return this.http.get(`${this.backendConfig.apiUrl()}/debug/serverName`, {
      responseType: 'text',
    });
  }
}

