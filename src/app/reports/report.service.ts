import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackendConfigService } from '../core/backend-config.service';
import { TrainingReport } from './models/training-report';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly backendConfig = inject(BackendConfigService);

  getTrainingReport(days = 90): Observable<TrainingReport> {
    return this.http.get<TrainingReport>(`${this.backendConfig.apiUrl()}/reports/training`, {
      params: { days },
    });
  }
}
