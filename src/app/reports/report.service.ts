import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TrainingReport } from './models/training-report';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly http = inject(HttpClient);

  getTrainingReport(days = 90): Observable<TrainingReport> {
    return this.http.get<TrainingReport>(`${environment.apiUrl}/reports/training`, {
      params: { days },
    });
  }
}
