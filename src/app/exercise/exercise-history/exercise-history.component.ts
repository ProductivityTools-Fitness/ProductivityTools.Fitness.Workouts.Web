import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExerciseService } from '../exercise.service';
import { Exercise, TrackingType } from '../models/exercise';
import { ExerciseHistoryEntry } from '../models/exercise-history';
import { HistoryMetric, historyMetricFor, toHistoryPoint } from '../exercise-history.util';

/** The API caps history at 200 entries; ask for all of them for the full table. */
const HISTORY_LIMIT = 200;

export interface HistoryRow {
  workoutId: number;
  date: Date | null;
  workoutName: string;
  /** Best result in this workout ("85 kg × 5", "1:35", "12 reps") or null when nothing was logged. */
  best: string | null;
  /** Every set, e.g. "80×5, 85×5, 85×4". */
  sets: string;
}

@Component({
  selector: 'app-exercise-history',
  imports: [RouterLink, DatePipe],
  templateUrl: './exercise-history.component.html',
  styleUrl: './exercise-history.component.css',
})
export class ExerciseHistoryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly exerciseService = inject(ExerciseService);

  exerciseId = signal<number | null>(null);
  workoutId = signal<number | null>(null);
  exercise = signal<Exercise | null>(null);
  history = signal<ExerciseHistoryEntry[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  readonly metric = computed<HistoryMetric>(() => historyMetricFor(this.trackingType()));

  /** Table rows, newest first (API order). */
  readonly rows = computed<HistoryRow[]>(() => {
    const type = this.trackingType();
    return this.history().map((entry) => {
      const point = toHistoryPoint(entry, type);
      return {
        workoutId: entry.workoutId,
        date: entry.startTime ? new Date(entry.startTime) : null,
        workoutName: entry.workoutTitle?.trim() || `Trening #${entry.workoutNumber ?? entry.workoutId}`,
        best: point?.label ?? null,
        sets: point?.detail ?? '',
      };
    });
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const idParam = params.get('exerciseId');
      const workoutIdParam = params.get('workoutId');
      this.workoutId.set(workoutIdParam ? Number(workoutIdParam) : null);

      if (idParam) {
        const id = Number(idParam);
        this.exerciseId.set(id);
        this.load(id);
      } else {
        this.exerciseId.set(null);
        this.exercise.set(null);
        this.history.set([]);
      }
    });
  }

  load(id: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.exerciseService.getExerciseById(id).subscribe({
      next: (exercise) => {
        this.exercise.set(exercise);
        this.exerciseService.getExerciseHistory(id, HISTORY_LIMIT).subscribe({
          next: (entries) => {
            this.history.set(entries ?? []);
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Error loading exercise history:', err);
            this.errorMessage.set('Failed to load exercise history.');
            this.isLoading.set(false);
          },
        });
      },
      error: (err) => {
        console.error('Error loading exercise:', err);
        this.errorMessage.set('Failed to load exercise details.');
        this.isLoading.set(false);
      },
    });
  }

  private trackingType(): TrackingType {
    return this.exercise()?.trackingType ?? 'WEIGHT_REPS';
  }
}
