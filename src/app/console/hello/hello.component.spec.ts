import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { HelloComponent } from './hello.component';
import { WorkoutService } from '../../workout/workout.service';
import { Workout } from '../../workout/models/workout';

describe('HelloComponent', () => {
  let component: HelloComponent;
  let fixture: ComponentFixture<HelloComponent>;
  let getWorkoutListMock: ReturnType<typeof vi.fn>;

  const sampleWorkouts: Workout[] = [
    {
      id: 1,
      workoutNumber: 10,
      title: 'Push Day',
      startTime: new Date(2026, 9, 5, 9, 0, 0).toISOString(),
      status: 'COMPLETED',
    },
    {
      id: 2,
      workoutNumber: 11,
      title: 'Evening Cardio',
      startTime: new Date(2026, 9, 5, 18, 30, 0).toISOString(),
      status: 'COMPLETED',
    },
    {
      id: 3,
      workoutNumber: 12,
      title: 'New workout',
      startTime: new Date(2026, 9, 12, 17, 0, 0).toISOString(),
      status: 'IN_PROGRESS',
    },
    {
      id: 4,
      workoutNumber: 9,
      title: 'September Leg Day',
      startTime: new Date(2026, 8, 29, 10, 0, 0).toISOString(),
      status: 'COMPLETED',
    },
  ];

  beforeEach(async () => {
    getWorkoutListMock = vi.fn().mockReturnValue(of(sampleWorkouts));

    await TestBed.configureTestingModule({
      imports: [HelloComponent],
      providers: [
        provideRouter([{ path: '**', component: HelloComponent }]),
        {
          provide: WorkoutService,
          useValue: {
            getWorkoutList: getWorkoutListMock,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HelloComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create and load workouts on init', () => {
    expect(component).toBeTruthy();
    expect(getWorkoutListMock).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBeNull();
    expect(component.workouts().length).toBe(4);
  });

  it('should generate a 42-cell Monday-first calendar grid for the current month', () => {
    component.currentMonth.set(new Date(2026, 9, 1)); // October 2026 (starts on Thursday)
    const days = component.calendarDays();

    expect(days.length).toBe(42);
    // Monday before Oct 1, 2026 is Sept 28, 2026
    expect(days[0].dateKey).toBe('2026-09-28');
    expect(days[0].isCurrentMonth).toBe(false);
    expect(days[3].dateKey).toBe('2026-10-01');
    expect(days[3].isCurrentMonth).toBe(true);

    const currentMonthDays = days.filter((d) => d.isCurrentMonth);
    expect(currentMonthDays.length).toBe(31);
    expect(component.monthLabel().toLowerCase()).toContain('2026');
  });

  it('should mark training days and compute monthly workout and training day counts', () => {
    component.currentMonth.set(new Date(2026, 9, 1)); // October 2026
    const days = component.calendarDays();

    const oct5 = days.find((d) => d.dateKey === '2026-10-05');
    const oct12 = days.find((d) => d.dateKey === '2026-10-12');
    const oct6 = days.find((d) => d.dateKey === '2026-10-06');

    expect(oct5?.workouts.length).toBe(2);
    expect(oct12?.workouts.length).toBe(1);
    expect(oct6?.workouts.length).toBe(0);

    // Only October workouts count toward monthly totals (3 workouts across 2 distinct days)
    expect(component.monthlyWorkoutCount()).toBe(3);
    expect(component.monthlyTrainingDaysCount()).toBe(2);
  });

  it('should navigate between months and clear selectedDateKey, and support goToToday', () => {
    component.currentMonth.set(new Date(2026, 9, 1));
    component.selectedDateKey.set('2026-10-05');

    component.previousMonth();
    expect(component.currentMonth().getFullYear()).toBe(2026);
    expect(component.currentMonth().getMonth()).toBe(8); // September
    expect(component.selectedDateKey()).toBeNull();

    component.selectedDateKey.set('2026-09-29');
    component.nextMonth();
    expect(component.currentMonth().getFullYear()).toBe(2026);
    expect(component.currentMonth().getMonth()).toBe(9); // October
    expect(component.selectedDateKey()).toBeNull();

    const todayKey = component.formatDateKey(new Date());
    component.goToToday();
    expect(component.selectedDateKey()).toBe(todayKey);
  });

  it('should select a training day and return workouts sorted by startTime descending', () => {
    component.currentMonth.set(new Date(2026, 9, 1));
    const days = component.calendarDays();
    const oct5 = days.find((d) => d.dateKey === '2026-10-05')!;

    component.selectDay(oct5);
    expect(component.selectedDateKey()).toBe('2026-10-05');

    const selectedWorkouts = component.selectedDayWorkouts();
    expect(selectedWorkouts.length).toBe(2);
    // 18:30 workout (id: 2) should appear before 09:00 workout (id: 1)
    expect(selectedWorkouts[0].id).toBe(2);
    expect(selectedWorkouts[1].id).toBe(1);
  });

  it('should switch currentMonth when selecting a day from an adjacent month', () => {
    component.currentMonth.set(new Date(2026, 9, 1));
    const sept29 = component.calendarDays().find((d) => d.dateKey === '2026-09-29')!;
    expect(sept29.isCurrentMonth).toBe(false);

    component.selectDay(sept29);
    expect(component.selectedDateKey()).toBe('2026-09-29');
    expect(component.currentMonth().getMonth()).toBe(8);
  });

  it('should navigate to workout detail when openWorkout is called and format titles', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi
      .spyOn(router, 'navigate')
      .mockImplementation(() => Promise.resolve(true));

    component.openWorkout(undefined);
    expect(navigateSpy).not.toHaveBeenCalled();

    component.openWorkout(3);
    expect(navigateSpy).toHaveBeenCalledWith(['/workouts/detail'], {
      queryParams: { workoutId: 3 },
    });

    expect(component.getWorkoutTitle(sampleWorkouts[0])).toBe('Push Day');
    expect(component.getWorkoutTitle(sampleWorkouts[2])).toBe('Trening #12');
    expect(component.getWorkoutTitle({ id: 7, title: 'Log Workout' })).toBe('Trening #7');
  });

  it('should handle error when loading workouts fails', () => {
    getWorkoutListMock.mockReturnValueOnce(throwError(() => new Error('Network error')));
    component.loadWorkouts();

    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBeTruthy();
  });
});
