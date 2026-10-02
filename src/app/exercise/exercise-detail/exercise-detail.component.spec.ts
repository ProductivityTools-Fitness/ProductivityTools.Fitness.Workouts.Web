import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ExerciseDetailComponent } from './exercise-detail.component';
import { ExerciseService } from '../exercise.service';
import { Exercise } from '../models/exercise';
import { ExerciseHistoryEntry } from '../models/exercise-history';

describe('ExerciseDetailComponent', () => {
  let component: ExerciseDetailComponent;
  let fixture: ComponentFixture<ExerciseDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();


    fixture = TestBed.createComponent(ExerciseDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Exercise history chart', () => {
    const bench: Exercise = { id: 1, name: 'Bench Press', isSystem: true, trackingType: 'WEIGHT_REPS' };
    const plank: Exercise = { id: 2, name: 'Plank', isSystem: true, trackingType: 'DURATION' };

    // Newest first, as the API returns it.
    const weightHistory: ExerciseHistoryEntry[] = [
      {
        workoutId: 30,
        startTime: '2026-09-20T10:00:00Z',
        sets: [
          { setNumber: 1, weightKg: 80, reps: 8, isCompleted: true },
          { setNumber: 2, weightKg: 85, reps: 5, isCompleted: true },
          { setNumber: 3, weightKg: 90, reps: 1, isCompleted: false }, // not done - ignored
        ],
      },
      {
        workoutId: 20,
        startTime: '2026-09-13T10:00:00Z',
        sets: [{ setNumber: 1, weightKg: 82.5, reps: 6, isCompleted: true }],
      },
      {
        workoutId: 10,
        startTime: '2026-09-06T10:00:00Z',
        sets: [{ setNumber: 1, weightKg: 75, reps: 10 }], // old import, no completed flag
      },
    ];

    it('should plot the heaviest completed set per workout, oldest first', () => {
      component.exercise.set(bench);
      component.history.set(weightHistory);

      const points = component.historyPoints();
      expect(points.map((p) => p.workoutId)).toEqual([10, 20, 30]);
      expect(points.map((p) => p.value)).toEqual([75, 82.5, 85]);
      expect(points[2].label).toBe('85 kg × 5');
      expect(component.historyMetric().unit).toBe('kg');
      expect(component.historyBest()?.workoutId).toBe(30);
    });

    it('should plot the longest hold for a timed exercise', () => {
      component.exercise.set(plank);
      component.history.set([
        { workoutId: 2, startTime: '2026-09-20T10:00:00Z', sets: [{ setNumber: 1, durationSeconds: 95, isCompleted: true }] },
        { workoutId: 1, startTime: '2026-09-13T10:00:00Z', sets: [{ setNumber: 1, durationSeconds: 60, isCompleted: true }, { setNumber: 2, durationSeconds: 75, isCompleted: true }] },
      ]);

      const points = component.historyPoints();
      expect(points.map((p) => p.value)).toEqual([75, 95]);
      expect(points[1].label).toBe('1:35');
      expect(component.historyMetric().unit).toBe('s');
    });

    it('should load history together with the exercise', () => {
      const exerciseService = TestBed.inject(ExerciseService);
      vi.spyOn(exerciseService, 'getExerciseById').mockReturnValue(of(bench));
      const historySpy = vi.spyOn(exerciseService, 'getExerciseHistory').mockReturnValue(of(weightHistory));

      component.loadExercise(1);
      component.loadHistory(1);

      expect(historySpy).toHaveBeenCalledWith(1, 20);
      expect(component.history().length).toBe(3);
      expect(component.isLoadingHistory()).toBe(false);
    });

    it('should render the chart with one point per workout and an empty state otherwise', () => {
      component.exercise.set(bench);
      component.history.set([]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-exercise-history-chart')).toBeNull();
      expect(compiled.querySelector('.history-empty')?.textContent).toContain('No logged workouts');

      component.history.set(weightHistory);
      fixture.detectChanges();

      expect(compiled.querySelectorAll('app-exercise-history-chart .point').length).toBe(3);
      expect(compiled.querySelector('.history-best')?.textContent).toContain('85 kg × 5');
    });
  });
});
