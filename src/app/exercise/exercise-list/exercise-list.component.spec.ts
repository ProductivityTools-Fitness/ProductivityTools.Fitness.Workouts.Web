import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { ExerciseListComponent } from './exercise-list.component';
import { Exercise } from '../models/exercise';
import { WorkoutService } from '../../workout/workout.service';

describe('ExerciseListComponent', () => {
  let component: ExerciseListComponent;
  let fixture: ComponentFixture<ExerciseListComponent>;
  let queryParamMap$: BehaviorSubject<ParamMap>;

  beforeEach(async () => {
    queryParamMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({}));
    await TestBed.configureTestingModule({
      imports: [ExerciseListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMap$ } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExerciseListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should hold and display exercise list', () => {
    const mockExercises: Exercise[] = [
      {
        id: 1,
        name: 'Bench Press',
        bodyCategory: 'Chest',
        targetMuscle: 'Pectorals',
        equipmentCategory: 'Barbell',
        gifUrl: 'https://example.com/bench.gif',
        isSystem: true,
      },
      {
        id: 2,
        name: 'Squat',
        bodyCategory: 'Legs',
        targetMuscle: 'Quadriceps',
        equipmentCategory: 'Barbell',
        gifUrl: 'https://example.com/squat.gif',
        isSystem: true,
      },
    ];

    component.exerciseList.set(mockExercises);
    expect(component.exerciseList().length).toBe(2);
    expect(component.exerciseList()[0].name).toBe('Bench Press');
    expect(component.exerciseList()[0].gifUrl).toBe('https://example.com/bench.gif');
  });

  it('should toggle exercise selection', () => {
    expect(component.selectedExerciseIds().has(1)).toBe(false);

    component.toggleExercise(1);
    expect(component.selectedExerciseIds().has(1)).toBe(true);

    component.toggleExercise(2);
    expect(component.selectedExerciseIds().size).toBe(2);

    component.toggleExercise(1);
    expect(component.selectedExerciseIds().has(1)).toBe(false);
    expect(component.selectedExerciseIds().has(2)).toBe(true);
  });

  it('should start with no exercises selected when opened for a workout', () => {
    const workoutService = TestBed.inject(WorkoutService);
    const getWorkoutSpy = vi.spyOn(workoutService, 'getWorkout');

    component.toggleExercise(1);
    queryParamMap$.next(convertToParamMap({ workoutId: '7' }));

    expect(component.workoutId()).toBe(7);
    expect(component.selectedExerciseIds().size).toBe(0);
    expect(getWorkoutSpy).not.toHaveBeenCalled();
  });
});


