import { ExerciseImagePipe } from '../exercise-image.pipe';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExerciseService } from '../exercise.service';
import { Exercise, TrackingType } from '../models/exercise';
import { ExerciseHistoryEntry } from '../models/exercise-history';
import { ExerciseHistoryChartComponent, HistoryPoint } from '../exercise-history-chart/exercise-history-chart.component';
import { HistoryMetric, historyMetricFor, toHistoryPoint } from '../exercise-history.util';

/** How many past workouts are shown on the progress chart. */
const HISTORY_LIMIT = 20;

@Component({
  selector: 'app-exercise-detail',
  imports: [RouterLink, ExerciseImagePipe, ExerciseHistoryChartComponent],
  templateUrl: './exercise-detail.component.html',
  styleUrl: './exercise-detail.component.css',
})
export class ExerciseDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly exerciseService = inject(ExerciseService);

  exerciseId = signal<number | null>(null);
  workoutId = signal<number | null>(null);
  exercise = signal<Exercise | null>(null);
  isLoading = signal<boolean>(false);
  isSavingSettings = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  /** Past workouts with this exercise, newest first (as returned by the API). */
  history = signal<ExerciseHistoryEntry[]>([]);
  isLoadingHistory = signal<boolean>(false);

  readonly historyMetric = computed<HistoryMetric>(() => historyMetricFor(this.trackingType()));

  /** Chart points, oldest first. Workouts where the metric is missing are skipped. */
  readonly historyPoints = computed<HistoryPoint[]>(() => {
    const type = this.trackingType();
    return [...this.history()]
      .reverse()
      .map((entry) => toHistoryPoint(entry, type))
      .filter((p): p is HistoryPoint => p !== null);
  });

  /** Personal best over the loaded history. */
  readonly historyBest = computed<HistoryPoint | null>(() => {
    const pts = this.historyPoints();
    if (pts.length === 0) return null;
    return pts.reduce((best, p) => (p.value > best.value ? p : best), pts[0]);
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const idParam = params.get('exerciseId');
      const workoutIdParam = params.get('workoutId');
      this.workoutId.set(workoutIdParam ? Number(workoutIdParam) : null);

      if (idParam) {
        const id = Number(idParam);
        this.exerciseId.set(id);
        this.loadExercise(id);
        this.loadHistory(id);
      } else {
        this.exerciseId.set(null);
        this.exercise.set(null);
        this.history.set([]);
      }
    });
  }

  loadExercise(id: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.exerciseService.getExerciseById(id).subscribe({
      next: (exercise) => {
        this.exercise.set(exercise);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading exercise details:', err);
        this.errorMessage.set('Failed to load exercise details.');
        this.isLoading.set(false);
      },
    });
  }

  loadHistory(id: number): void {
    this.isLoadingHistory.set(true);
    this.exerciseService.getExerciseHistory(id, HISTORY_LIMIT).subscribe({
      next: (entries) => {
        this.history.set(entries ?? []);
        this.isLoadingHistory.set(false);
      },
      error: (err) => {
        // History is an extra; the page is still useful without it.
        console.warn('Could not load exercise history:', err);
        this.history.set([]);
        this.isLoadingHistory.set(false);
      },
    });
  }

  toggleWakeLockSentinel(): void {
    const current = this.exercise();
    if (!current || this.isSavingSettings()) return;

    const nextValue = !Boolean(current.wakeLockSentinel);
    this.isSavingSettings.set(true);

    this.exerciseService.updateExerciseSettings(current.id, { wakeLockSentinel: nextValue }).subscribe({
      next: (updated) => {
        this.exercise.set(updated);
        this.isSavingSettings.set(false);
      },
      error: (err) => {
        console.error('Error updating exercise settings:', err);
        this.isSavingSettings.set(false);
      },
    });
  }

  getSecondaryMuscles(exercise: Exercise | null): string[] {
    if (!exercise || !exercise.secondaryMuscles) return [];
    if (Array.isArray(exercise.secondaryMuscles)) {
      return exercise.secondaryMuscles;
    }
    return String(exercise.secondaryMuscles).split(',').map((s) => s.trim());
  }

  private trackingType(): TrackingType {
    return this.exercise()?.trackingType ?? 'WEIGHT_REPS';
  }
}
