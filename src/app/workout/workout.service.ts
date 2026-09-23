import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
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

  getWorkoutList(): Observable<Workout[]> {
    return this.http.get<Workout[]>(`${environment.apiUrl}/workout/list`);
  }

  getWorkout(workoutId: number): Observable<Workout> {
    return this.http.get<Workout>(`${environment.apiUrl}/workout/${workoutId}`);
  }

  newWorkout(title?: string): Observable<Workout> {
    return this.http.post<Workout>(`${environment.apiUrl}/workout/add`, {
      title: title || undefined,
    });
  }

  updateWorkoutTitle(workoutId: number, title: string): Observable<Workout> {
    return this.http.put<Workout>(`${environment.apiUrl}/workout/${workoutId}/title`, {
      title,
    });
  }

  updateExerciseList(workoutId: number, exerciseIds: number[]): Observable<boolean> {
    console.log('workoutid', workoutId);
    console.log('exercise list', exerciseIds);
    return this.http.post<boolean>(`${environment.apiUrl}/workout/${workoutId}/exercise`, {
      workoutId: workoutId,
      exerciseIds: exerciseIds,
    });
  }

  addSet(workoutId: number, exerciseId: number): Observable<Workout> {
    const request: AddSetRequest = { workoutId, exerciseId };
    return this.http.post<Workout>(`${environment.apiUrl}/workout/addSet`, request);
  }

  saveSet(request: SaveSetRequest): Observable<WorkoutSet> {
    return this.http.post<WorkoutSet>(`${environment.apiUrl}/workout/saveSet`, request);
  }

  deleteSet(setId: number): Observable<boolean> {
    const request: DeleteSetRequest = { id: setId };
    return this.http.post<boolean>(`${environment.apiUrl}/workout/deleteSet`, request);
  }

  saveExerciseNotes(workoutExerciseId: number, notes: string): Observable<WorkoutExercise> {
    const request: SaveExerciseNotesRequest = {
      workoutExerciseId,
      notes,
    };
    return this.http.post<WorkoutExercise>(`${environment.apiUrl}/workout/updateExerciseNotes`, request);
  }

  updateExerciseNotes(workoutExerciseId: number, notes: string): Observable<WorkoutExercise> {
    return this.saveExerciseNotes(workoutExerciseId, notes);
  }

  saveExerciseRestTimer(workoutExerciseId: number, restTimerSeconds: number): Observable<WorkoutExercise> {
    const request: SaveExerciseRestTimerRequest = {
      workoutExerciseId,
      restTimerSeconds,
    };
    return this.http.post<WorkoutExercise>(`${environment.apiUrl}/workout/updateExerciseRestTimer`, request);
  }

  completeWorkout(workoutId: number): Observable<Workout> {
    return this.http.post<Workout>(`${environment.apiUrl}/workout/completeWorkout`, {
      workoutId,
    });
  }

  deleteWorkout(workoutId: number): Observable<boolean> {
    const request: DeleteWorkoutRequest = { id: workoutId };
    return this.http.post<boolean>(`${environment.apiUrl}/workout/delete`, request);
  }
}

