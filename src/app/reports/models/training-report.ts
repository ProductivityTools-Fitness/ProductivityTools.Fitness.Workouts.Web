export interface TrainingReportSummary {
  totalWorkouts: number;
  workoutsPerWeek: number;
  totalCompletedSets: number;
  totalVolumeKg: number;
  averageDurationMinutes: number;
}

export interface MuscleVolume {
  muscle: string;
  bodyCategory: string;
  totalSets: number;
  setsPerWeek: number;
  totalVolumeKg: number;
  daysSinceLastTrained: number;
}

export type ProgressTrend = 'PROGRESSING' | 'STABLE' | 'REGRESSING' | 'INSUFFICIENT_DATA';

export interface ExerciseProgress {
  exerciseId: number;
  name: string;
  targetMuscle: string | null;
  equipmentCategory: string | null;
  trackingType: string;
  sessions: number;
  bestWeightKg: number | null;
  bestReps: number | null;
  bestEstimated1RmKg: number | null;
  latestWeightKg: number | null;
  latestReps: number | null;
  latestEstimated1RmKg: number | null;
  bestDurationSeconds: number | null;
  latestDurationSeconds: number | null;
  trend: ProgressTrend;
  lastTrainedAt: string;
}

export interface TrainingReport {
  days: number;
  fromDate: string;
  toDate: string;
  summary: TrainingReportSummary;
  muscleVolume: MuscleVolume[];
  exerciseProgress: ExerciseProgress[];
  recentWorkouts: unknown[];
  aiMarkdown: string;
}
