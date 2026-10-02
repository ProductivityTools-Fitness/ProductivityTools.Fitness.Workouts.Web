import { ExerciseImagePipe } from '../exercise-image.pipe';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExerciseService } from '../exercise.service';
import { Exercise, TrackingType } from '../models/exercise';
import { ExerciseHistoryEntry, ExerciseHistorySet } from '../models/exercise-history';
import { ExerciseHistoryChartComponent, HistoryPoint } from '../exercise-history-chart/exercise-history-chart.component';

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

  /**
   * What the chart plots depends on how the exercise is tracked: the heaviest set for weight
   * exercises, the longest hold for timed ones, the most reps for bodyweight.
   */
  readonly historyMetric = computed<{ unit: string; title: string }>(() => {
    switch (this.trackingType()) {
      case 'DURATION':
      case 'DISTANCE_DURATION':
        return { unit: 's', title: 'Best time per workout' };
      case 'REPS_ONLY':
        return { unit: 'reps', title: 'Most reps in a set per workout' };
      default:
        return { unit: 'kg', title: 'Heaviest set per workout' };
    }
  });

  /** Chart points, oldest first. Workouts where the metric is missing are skipped. */
  readonly historyPoints = computed<HistoryPoint[]>(() => {
    const type = this.trackingType();
    return [...this.history()]
      .reverse()
      .map((entry) => this.toHistoryPoint(entry, type))
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

  /** Completed sets if any were ticked off, otherwise every set (older imports have no flag). */
  private relevantSets(entry: ExerciseHistoryEntry): ExerciseHistorySet[] {
    const sets = entry.sets ?? [];
    const completed = sets.filter((s) => s.isCompleted);
    return completed.length > 0 ? completed : sets;
  }

  private toHistoryPoint(entry: ExerciseHistoryEntry, type: TrackingType): HistoryPoint | null {
    const sets = this.relevantSets(entry);
    if (sets.length === 0 || !entry.startTime) return null;
    const date = new Date(entry.startTime);

    if (type === 'DURATION' || type === 'DISTANCE_DURATION') {
      const best = this.maxOf(sets, (s) => s.durationSeconds);
      if (best === null || best <= 0) return null;
      return {
        date,
        value: best,
        label: this.formatSeconds(best),
        shortLabel: this.formatSeconds(best),
        detail: sets.map((s) => this.formatSeconds(s.durationSeconds ?? 0)).join(', '),
        workoutId: entry.workoutId,
      };
    }

    if (type === 'REPS_ONLY') {
      const best = this.maxOf(sets, (s) => s.reps);
      if (best === null || best <= 0) return null;
      return {
        date,
        value: best,
        label: `${best} reps`,
        shortLabel: `${best}`,
        detail: sets.map((s) => `${s.reps ?? 0}`).join(', '),
        workoutId: entry.workoutId,
      };
    }

    const best = this.maxOf(sets, (s) => (s.weightKg != null ? Number(s.weightKg) : null));
    if (best === null || best <= 0) return null;
    const bestSet = sets.find((s) => Number(s.weightKg) === best);
    return {
      date,
      value: best,
      label: `${this.formatNumber(best)} kg${bestSet?.reps ? ' × ' + bestSet.reps : ''}`,
      shortLabel: this.formatNumber(best),
      detail: sets.map((s) => `${this.formatNumber(Number(s.weightKg ?? 0))}×${s.reps ?? 0}`).join(', '),
      workoutId: entry.workoutId,
    };
  }

  private maxOf(sets: ExerciseHistorySet[], pick: (s: ExerciseHistorySet) => number | null | undefined): number | null {
    const values = sets.map(pick).filter((v): v is number => v != null && Number.isFinite(v));
    return values.length ? Math.max(...values) : null;
  }

  private formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  }

  private formatSeconds(total: number): string {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}
