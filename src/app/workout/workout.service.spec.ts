import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { WorkoutService } from './workout.service';
import { environment } from '../../environments/environment';
import { Workout } from './models/workout';

describe('WorkoutService', () => {
  let service: WorkoutService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WorkoutService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should post addSet with workoutId and exerciseId', () => {
    const mockWorkout: Workout = {
      id: 5,
      title: 'Trening #5',
      exercises: [],
    };

    service.addSet(5, 10).subscribe((res) => {
      expect(res).toEqual(mockWorkout);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/workout/addSet`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ workoutId: 5, exerciseId: 10 });
    req.flush(mockWorkout);
  });

  it('should post saveSet with SaveSetRequest', () => {
    const mockUpdatedSet = {
      id: 7,
      setNumber: 1,
      weightKg: 85,
      reps: 12,
      isCompleted: true,
    };

    service.saveSet({ id: 7, kg: 85, reps: 12, status: true }).subscribe((res) => {
      expect(res).toEqual(mockUpdatedSet);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/workout/saveSet`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ id: 7, kg: 85, reps: 12, status: true });
    req.flush(mockUpdatedSet);
  });

  it('should post deleteSet with DeleteSetRequest', () => {
    service.deleteSet(15).subscribe((res) => {
      expect(res).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/workout/deleteSet`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ id: 15 });
    req.flush(true);
  });

  it('should post deleteExercise with DeleteExerciseRequest', () => {
    service.deleteExercise(20).subscribe((res) => {
      expect(res).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/workout/deleteExercise`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ workoutExerciseId: 20 });
    req.flush(true);
  });

  it('should post saveExerciseNotes with workoutExerciseId and notes', () => {
    const mockUpdatedExercise = {
      id: 25,
      orderIndex: 1,
      exercise: { id: 1, name: 'Squat', isSystem: true },
      notes: 'Drop set on last set',
    };

    service.saveExerciseNotes(25, 'Drop set on last set').subscribe((res) => {
      expect(res).toEqual(mockUpdatedExercise as any);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/workout/updateExerciseNotes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      workoutExerciseId: 25,
      notes: 'Drop set on last set',
    });
    req.flush(mockUpdatedExercise);
  });

  it('should post completeWorkout with workoutId in URL and body', () => {
    const mockCompletedWorkout: Workout = {
      id: 50,
      title: 'Trening #50',
      status: 'COMPLETED',
      durationSeconds: 3600,
      exercises: [],
    };

    service.completeWorkout(50).subscribe((res) => {
      expect(res).toEqual(mockCompletedWorkout);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/workout/completeWorkout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ workoutId: 50 });
    req.flush(mockCompletedWorkout);
  });

  it('should post deleteWorkout with DeleteWorkoutRequest', () => {
    service.deleteWorkout(42).subscribe((res) => {
      expect(res).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/workout/delete`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ id: 42 });
    req.flush(true);
  });
});
