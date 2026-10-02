import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ExerciseHistoryComponent } from './exercise-history.component';
import { ExerciseService } from '../exercise.service';
import { Exercise } from '../models/exercise';
import { ExerciseHistoryEntry } from '../models/exercise-history';

describe('ExerciseHistoryComponent', () => {
  let component: ExerciseHistoryComponent;
  let fixture: ComponentFixture<ExerciseHistoryComponent>;
  let service: ExerciseService;

  const bench: Exercise = { id: 1, name: 'Bench Press', isSystem: true, trackingType: 'WEIGHT_REPS' };
  const plank: Exercise = { id: 2, name: 'Plank', isSystem: true, trackingType: 'DURATION' };

  // Newest first, as the API returns it.
  const weightHistory: ExerciseHistoryEntry[] = [
    {
      workoutId: 30,
      workoutNumber: 3,
      workoutTitle: 'Push day',
      startTime: '2026-09-20T10:00:00Z',
      sets: [
        { setNumber: 1, weightKg: 80, reps: 8, isCompleted: true },
        { setNumber: 2, weightKg: 85, reps: 5, isCompleted: true },
      ],
    },
    {
      workoutId: 20,
      workoutNumber: 2,
      workoutTitle: '',
      startTime: '2026-09-13T10:00:00Z',
      sets: [{ setNumber: 1, weightKg: 82.5, reps: 6, isCompleted: true }],
    },
    {
      workoutId: 10,
      workoutNumber: 1,
      startTime: '2026-09-06T10:00:00Z',
      sets: [], // nothing logged
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseHistoryComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(new Map([['exerciseId', '1'], ['workoutId', '30']]) as any) },
        },
      ],
    }).compileComponents();

    service = TestBed.inject(ExerciseService);
    vi.spyOn(service, 'getExerciseById').mockReturnValue(of(bench));
    vi.spyOn(service, 'getExerciseHistory').mockReturnValue(of(weightHistory));

    fixture = TestBed.createComponent(ExerciseHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load exercise and full history from the query params', () => {
    expect(service.getExerciseById).toHaveBeenCalledWith(1);
    expect(service.getExerciseHistory).toHaveBeenCalledWith(1, 200);
    expect(component.workoutId()).toBe(30);
    expect(component.exercise()).toEqual(bench);
  });

  it('should build one row per workout, newest first, with best weight and fallback name', () => {
    const rows = component.rows();
    expect(rows.map((r) => r.workoutId)).toEqual([30, 20, 10]);
    expect(rows[0].workoutName).toBe('Push day');
    expect(rows[0].best).toBe('85 kg × 5');
    expect(rows[0].sets).toBe('80×8, 85×5');
    expect(rows[1].workoutName).toBe('Trening #2'); // empty title falls back to number
    expect(rows[2].best).toBeNull();
  });

  it('should render the table with the metric column and workout links', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('h1')?.textContent).toContain('Bench Press');
    const headers = Array.from(el.querySelectorAll('thead th')).map((th) => th.textContent?.trim());
    expect(headers).toEqual(['Date', 'Workout', 'Best weight', 'Sets']);

    const bodyRows = el.querySelectorAll('tbody tr');
    expect(bodyRows.length).toBe(3);
    expect(bodyRows[0].querySelector('.workout-link')?.getAttribute('href')).toContain('workoutId=30');
    expect(bodyRows[0].querySelector('.best-value')?.textContent?.trim()).toBe('85 kg × 5');
    expect(bodyRows[2].querySelector('.col-best')?.textContent?.trim()).toBe('—');
  });

  it('should show time for duration exercises', () => {
    component.exercise.set(plank);
    component.history.set([
      {
        workoutId: 5,
        startTime: '2026-09-01T10:00:00Z',
        sets: [{ setNumber: 1, durationSeconds: 95, isCompleted: true }],
      },
    ]);
    fixture.detectChanges();

    expect(component.metric().columnTitle).toBe('Best time');
    expect(component.rows()[0].best).toBe('1:35');
  });

  it('should show an empty state when the exercise was never performed', () => {
    component.history.set([]);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.history-empty')).toBeTruthy();
    expect(el.querySelector('table')).toBeNull();
  });
});
