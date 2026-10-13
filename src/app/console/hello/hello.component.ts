import { Component, computed, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { WorkoutService } from '../../workout/workout.service';
import { Workout } from '../../workout/models/workout';

export interface CalendarDay {
  date: Date;
  dateKey: string; // 'YYYY-MM-DD' in local time
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  workouts: Workout[];
}

@Component({
  selector: 'app-hello',
  imports: [RouterLink, DatePipe],
  templateUrl: './hello.component.html',
  styleUrl: './hello.component.css',
})
export class HelloComponent implements OnInit {
  workouts = signal<Workout[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  currentMonth = signal<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  selectedDateKey = signal<string | null>(null);

  readonly weekDays = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

  monthLabel = computed<string>(() => {
    const formatted = new Intl.DateTimeFormat('pl-PL', {
      month: 'long',
      year: 'numeric',
    }).format(this.currentMonth());
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  });

  calendarDays = computed<CalendarDay[]>(() => {
    const monthDate = this.currentMonth();
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7;

    const workoutsByDate = new Map<string, Workout[]>();
    for (const workout of this.workouts()) {
      const workoutDate = this.getWorkoutDate(workout);
      if (!workoutDate) continue;
      const key = this.formatDateKey(workoutDate);
      const list = workoutsByDate.get(key) ?? [];
      list.push(workout);
      workoutsByDate.set(key, list);
    }

    for (const list of workoutsByDate.values()) {
      list.sort((a, b) => {
        const timeA = this.getWorkoutDate(a)?.getTime() ?? 0;
        const timeB = this.getWorkoutDate(b)?.getTime() ?? 0;
        return timeB - timeA;
      });
    }

    const todayKey = this.formatDateKey(new Date());
    const days: CalendarDay[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(year, month, 1 - startOffset + i);
      const dateKey = this.formatDateKey(date);
      days.push({
        date,
        dateKey,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getFullYear() === year && date.getMonth() === month,
        isToday: dateKey === todayKey,
        workouts: workoutsByDate.get(dateKey) ?? [],
      });
    }

    return days;
  });

  monthlyWorkoutCount = computed<number>(() => {
    return this.calendarDays()
      .filter((day) => day.isCurrentMonth)
      .reduce((sum, day) => sum + day.workouts.length, 0);
  });

  monthlyTrainingDaysCount = computed<number>(() => {
    return this.calendarDays().filter(
      (day) => day.isCurrentMonth && day.workouts.length > 0,
    ).length;
  });

  selectedDayWorkouts = computed<Workout[]>(() => {
    const key = this.selectedDateKey();
    if (!key) return [];
    return this.workouts()
      .filter((workout) => {
        const workoutDate = this.getWorkoutDate(workout);
        return workoutDate ? this.formatDateKey(workoutDate) === key : false;
      })
      .sort((a, b) => {
        const timeA = this.getWorkoutDate(a)?.getTime() ?? 0;
        const timeB = this.getWorkoutDate(b)?.getTime() ?? 0;
        return timeB - timeA;
      });
  });

  constructor(
    private workoutService: WorkoutService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadWorkouts();
  }

  loadWorkouts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.workoutService.getWorkoutList().subscribe({
      next: (workouts) => {
        const list = workouts ?? [];
        this.workouts.set(list);
        this.isLoading.set(false);

        if (this.selectedDateKey() === null) {
          const todayKey = this.formatDateKey(new Date());
          const hasTodayWorkout = list.some((w) => {
            const d = this.getWorkoutDate(w);
            return d ? this.formatDateKey(d) === todayKey : false;
          });
          if (hasTodayWorkout) {
            this.selectedDateKey.set(todayKey);
          } else {
            const currentMonthTrainingDays = this.calendarDays().filter(
              (day) => day.isCurrentMonth && day.workouts.length > 0,
            );
            if (currentMonthTrainingDays.length > 0) {
              this.selectedDateKey.set(
                currentMonthTrainingDays[currentMonthTrainingDays.length - 1].dateKey,
              );
            }
          }
        }
      },
      error: (err) => {
        console.error('Error fetching workout list:', err);
        this.errorMessage.set('Failed to load workouts. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  previousMonth(): void {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    this.selectedDateKey.set(null);
  }

  nextMonth(): void {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    this.selectedDateKey.set(null);
  }

  goToToday(): void {
    const now = new Date();
    this.currentMonth.set(new Date(now.getFullYear(), now.getMonth(), 1));
    this.selectedDateKey.set(this.formatDateKey(now));
  }

  selectDay(day: CalendarDay): void {
    if (!day.isCurrentMonth) {
      this.currentMonth.set(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
    }
    this.selectedDateKey.set(day.dateKey);
  }

  openWorkout(workoutId?: number): void {
    if (!workoutId) return;
    this.router.navigate(['/workouts/detail'], {
      queryParams: { workoutId },
    });
  }

  getWorkoutTitle(workout: Workout): string {
    if (
      workout.title &&
      workout.title.trim() !== '' &&
      !['Log Workout', 'New workout'].includes(workout.title)
    ) {
      return workout.title;
    }
    return `Trening #${workout.workoutNumber ?? workout.id}`;
  }

  formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getWorkoutDate(workout: Workout): Date | null {
    const raw = workout.startTime ?? workout.createdAt;
    if (!raw) return null;
    const parsed = raw instanceof Date ? raw : new Date(raw);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
}
