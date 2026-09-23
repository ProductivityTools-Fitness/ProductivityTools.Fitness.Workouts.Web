import { Exercise } from '../../exercise/models/exercise';

export type WorkoutStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface WorkoutSet {
  id?: number;
  workoutExerciseId?: number;
  setNumber: number;
  weightKg: number;
  reps: number;
  /** Seconds held, for timed exercises such as a plank. Null for weight x reps. */
  durationSeconds?: number | null;
  /** Metres covered, for cardio. Null otherwise. */
  distanceMeters?: number | null;
  prevWeightKg?: number | null;
  prevReps?: number | null;
  prevDurationSeconds?: number | null;
  prevDistanceMeters?: number | null;
  isCompleted: boolean;
  createdAt?: string | Date;
}

export interface WorkoutExercise {
  id?: number;
  workoutId?: number;
  exercise: Exercise;
  orderIndex: number;
  notes?: string | null;
  restTimerSeconds?: number | null;
  sets?: WorkoutSet[];
  createdAt?: string | Date;
}

export interface Workout {
  id?: number;
  workoutNumber?: number;
  userId?: number;
  title: string;
  startTime?: string | Date;
  endTime?: string | Date | null;
  durationSeconds?: number;
  status?: WorkoutStatus | string;
  notes?: string | null;
  exercises?: WorkoutExercise[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
