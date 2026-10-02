import { TrackingType } from './models/exercise';
import { ExerciseHistoryEntry, ExerciseHistorySet } from './models/exercise-history';
import { HistoryPoint } from './exercise-history-chart/exercise-history-chart.component';

export interface HistoryMetric {
  /** Axis unit: "kg", "s" or "reps". */
  unit: string;
  /** Chart heading. */
  title: string;
  /** Table column heading. */
  columnTitle: string;
}

/**
 * What is measured for an exercise depends on how it is tracked: the heaviest set for weight
 * exercises, the longest hold for timed ones, the most reps for bodyweight.
 */
export function historyMetricFor(type: TrackingType): HistoryMetric {
  switch (type) {
    case 'DURATION':
    case 'DISTANCE_DURATION':
      return { unit: 's', title: 'Best time per workout', columnTitle: 'Best time' };
    case 'REPS_ONLY':
      return { unit: 'reps', title: 'Most reps in a set per workout', columnTitle: 'Most reps' };
    default:
      return { unit: 'kg', title: 'Heaviest set per workout', columnTitle: 'Best weight' };
  }
}

/** Completed sets if any were ticked off, otherwise every set (older imports have no flag). */
export function relevantSets(entry: ExerciseHistoryEntry): ExerciseHistorySet[] {
  const sets = entry.sets ?? [];
  const completed = sets.filter((s) => s.isCompleted);
  return completed.length > 0 ? completed : sets;
}

/** Best result of one workout, or null when nothing usable was logged. */
export function toHistoryPoint(entry: ExerciseHistoryEntry, type: TrackingType): HistoryPoint | null {
  const sets = relevantSets(entry);
  if (sets.length === 0 || !entry.startTime) return null;
  const date = new Date(entry.startTime);

  if (type === 'DURATION' || type === 'DISTANCE_DURATION') {
    const best = maxOf(sets, (s) => s.durationSeconds);
    if (best === null || best <= 0) return null;
    return {
      date,
      value: best,
      label: formatSeconds(best),
      shortLabel: formatSeconds(best),
      detail: sets.map((s) => formatSeconds(s.durationSeconds ?? 0)).join(', '),
      workoutId: entry.workoutId,
    };
  }

  if (type === 'REPS_ONLY') {
    const best = maxOf(sets, (s) => s.reps);
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

  const best = maxOf(sets, (s) => (s.weightKg != null ? Number(s.weightKg) : null));
  if (best === null || best <= 0) return null;
  const bestSet = sets.find((s) => Number(s.weightKg) === best);
  return {
    date,
    value: best,
    label: `${formatNumber(best)} kg${bestSet?.reps ? ' × ' + bestSet.reps : ''}`,
    shortLabel: formatNumber(best),
    detail: sets.map((s) => `${formatNumber(Number(s.weightKg ?? 0))}×${s.reps ?? 0}`).join(', '),
    workoutId: entry.workoutId,
  };
}

export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}

export function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function maxOf(sets: ExerciseHistorySet[], pick: (s: ExerciseHistorySet) => number | null | undefined): number | null {
  const values = sets.map(pick).filter((v): v is number => v != null && Number.isFinite(v));
  return values.length ? Math.max(...values) : null;
}
