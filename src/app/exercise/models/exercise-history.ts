/** One set logged in a past workout, as returned by GET /exercise/{id}/history. */
export interface ExerciseHistorySet {
  setNumber: number;
  weightKg?: number | null;
  reps?: number | null;
  durationSeconds?: number | null;
  distanceMeters?: number | null;
  isCompleted?: boolean;
}

/** A past workout in which the exercise was performed. */
export interface ExerciseHistoryEntry {
  workoutId: number;
  workoutNumber?: number | null;
  workoutTitle?: string | null;
  startTime?: string | Date | null;
  status?: string | null;
  sets: ExerciseHistorySet[];
}
