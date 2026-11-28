import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackendConfigService } from '../core/backend-config.service';
import { Workout, WorkoutExercise, WorkoutSet } from './models/workout';

export interface AddSetRequest {
  workoutId: number;
  exerciseId: number;
}

/** Partial update: only the fields present are applied, the rest keep their stored value. */
export interface SaveSetRequest {
  id: number;
  kg?: number;
  reps?: number;
  durationSeconds?: number;
  distanceMeters?: number;
  status?: boolean;
}

export interface DeleteSetRequest {
  id: number;
}

export interface DeleteExerciseRequest {
  workoutExerciseId: number;
}

export interface DeleteWorkoutRequest {
  id: number;
}

export interface SaveExerciseNotesRequest {
  workoutExerciseId?: number;
  id?: number;
  notes: string;
}

export interface SaveExerciseRestTimerRequest {
  workoutExerciseId: number;
  restTimerSeconds: number;
}

@Injectable({
  providedIn: 'root',
})
export class WorkoutService {
  private readonly http = inject(HttpClient);
  private readonly backendConfig = inject(BackendConfigService);

  private get apiUrl(): string {
    return this.backendConfig.apiUrl();
  }

  getWorkoutList(): Observable<Workout[]> {
    return this.http.get<Workout[]>(`${this.apiUrl}/workout/list`);
  }

  getWorkout(workoutId: number): Observable<Workout> {
    return this.http.get<Workout>(`${this.apiUrl}/workout/${workoutId}`);
  }

  newWorkout(title?: string): Observable<Workout> {
    return this.http.post<Workout>(`${this.apiUrl}/workout/add`, {
      title: title || undefined,
    });
  }

  updateWorkoutTitle(workoutId: number, title: string): Observable<Workout> {
    return this.http.put<Workout>(`${this.apiUrl}/workout/${workoutId}/title`, {
      title,
    });
  }

  updateExerciseList(workoutId: number, exerciseIds: number[]): Observable<boolean> {
    console.log('workoutid', workoutId);
    console.log('exercise list', exerciseIds);
    return this.http.post<boolean>(`${this.apiUrl}/workout/${workoutId}/exercise`, {
      workoutId: workoutId,
      exerciseIds: exerciseIds,
    });
  }

  addSet(workoutId: number, exerciseId: number): Observable<Workout> {
    const request: AddSetRequest = { workoutId, exerciseId };
    return this.http.post<Workout>(`${this.apiUrl}/workout/addSet`, request);
  }

  saveSet(request: SaveSetRequest): Observable<WorkoutSet> {
    return this.http.post<WorkoutSet>(`${this.apiUrl}/workout/saveSet`, request);
  }

  deleteSet(setId: number): Observable<boolean> {
    const request: DeleteSetRequest = { id: setId };
    return this.http.post<boolean>(`${this.apiUrl}/workout/deleteSet`, request);
  }

  deleteExercise(workoutExerciseId: number): Observable<boolean> {
    const request: DeleteExerciseRequest = { workoutExerciseId };
    return this.http.post<boolean>(`${this.apiUrl}/workout/deleteExercise`, request);
  }

  saveExerciseNotes(workoutExerciseId: number, notes: string): Observable<WorkoutExercise> {
    const request: SaveExerciseNotesRequest = {
      workoutExerciseId,
      notes,
    };
    return this.http.post<WorkoutExercise>(`${this.apiUrl}/workout/updateExerciseNotes`, request);
  }

  updateExerciseNotes(workoutExerciseId: number, notes: string): Observable<WorkoutExercise> {
    return this.saveExerciseNotes(workoutExerciseId, notes);
  }

  saveExerciseRestTimer(workoutExerciseId: number, restTimerSeconds: number): Observable<WorkoutExercise> {
    const request: SaveExerciseRestTimerRequest = {
      workoutExerciseId,
      restTimerSeconds,
    };
    return this.http.post<WorkoutExercise>(`${this.apiUrl}/workout/updateExerciseRestTimer`, request);
  }

  startWorkout(workoutId: number): Observable<Workout> {
    return this.http.post<Workout>(`${this.apiUrl}/workout/startWorkout`, {
      workoutId,
    });
  }

  completeWorkout(workoutId: number): Observable<Workout> {
    return this.http.post<Workout>(`${this.apiUrl}/workout/completeWorkout`, {
      workoutId,
    });
  }

  deleteWorkout(workoutId: number): Observable<boolean> {
    const request: DeleteWorkoutRequest = { id: workoutId };
    return this.http.post<boolean>(`${this.apiUrl}/workout/delete`, request);
  }
}

