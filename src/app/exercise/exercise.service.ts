import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Exercise } from './models/exercise';
import { ExerciseHistoryEntry } from './models/exercise-history';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ExerciseService {
  private readonly http = inject(HttpClient);

  getExerciseList(): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(`${environment.apiUrl}/exercise/list`);
  }

  getExerciseById(id: number): Observable<Exercise> {
    return this.http.get<Exercise>(`${environment.apiUrl}/exercise/${id}`);
  }

  updateExerciseSettings(id: number, settings: { wakeLockSentinel: boolean }): Observable<Exercise> {
    return this.http.post<Exercise>(`${environment.apiUrl}/exercise/${id}/settings`, settings);
  }

  /** Past performances of the exercise by the current user, newest first. */
  getExerciseHistory(id: number, limit = 20): Observable<ExerciseHistoryEntry[]> {
    return this.http.get<ExerciseHistoryEntry[]>(`${environment.apiUrl}/exercise/${id}/history`, {
      params: { limit },
    });
  }
}


