/**
 * How a set of an exercise is measured. Mirrors the backend enum; drives which columns the
 * set editor shows.
 */
export type TrackingType =
  | 'WEIGHT_REPS'
  | 'REPS_ONLY'
  | 'DURATION'
  | 'DURATION_WEIGHT'
  | 'DISTANCE_DURATION';

export interface Exercise {
  id: number;
  catalogExerciseId?: string | null;
  userId?: number | null;
  name: string;
  category?: string | null;
  bodyCategory?: string | null;
  equipmentCategory?: string | null;
  targetMuscle?: string | null;
  primaryMuscle?: string | null;
  secondaryMuscles?: string | string[] | null;
  instructions?: string[] | null;
  iconUrl?: string | null;
  gifUrl?: string | null;
  /** Present when the animation is stored locally and served by /exercise/{id}/image. */
  imageFileName?: string | null;
  /** Absent on older payloads, which are all weight x reps. */
  trackingType?: TrackingType;
  /** Whether the mobile screen should be kept awake (Screen Wake Lock API) for this exercise. */
  wakeLockSentinel?: boolean;
  isSystem: boolean;
  createdAt?: string | Date;
}