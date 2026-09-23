import { ExerciseImagePipe } from '../../exercise/exercise-image.pipe';
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkoutService, SaveSetRequest } from '../workout.service';
import { Workout, WorkoutExercise, WorkoutSet } from '../models/workout';
import { TrackingType } from '../../exercise/models/exercise';

/** An editable cell of a set row. */
export type SetField = 'weight' | 'reps' | 'duration' | 'distance';

@Component({
  selector: 'app-workout-detail',
  imports: [RouterLink, DatePipe, FormsModule, ExerciseImagePipe],
  templateUrl: './workout-detail.component.html',
  styleUrl: './workout-detail.component.css',
})
export class WorkoutDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workoutService = inject(WorkoutService);

  workoutId = signal<number | null>(null);
  workout = signal<Workout | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  currentTime = signal<Date>(new Date());
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  isEditingCompleted = signal<boolean>(false);
  isReadOnly = computed<boolean>(() => {
    const w = this.workout();
    return w?.status === 'COMPLETED' && !this.isEditingCompleted();
  });

  isEditingTitle = signal<boolean>(false);
  titleInput = '';
  isSavingTitle = signal<boolean>(false);
  isAddingSet = signal<number | null>(null);
  editingCell = signal<{ setId: number; field: SetField } | null>(null);
  savingSetId = signal<number | null>(null);
  isDeletingSet = signal<number | null>(null);
  setToDelete = signal<WorkoutSet | null>(null);
  editingNotesExerciseId = signal<number | null>(null);
  exerciseNotesInput = '';
  savingNotesExerciseId = signal<number | null>(null);
  isCompletingTraining = signal<boolean>(false);
  showDeleteWorkoutModal = signal<boolean>(false);
  isDeletingWorkout = signal<boolean>(false);

  ngOnInit(): void {
    this.startDurationTimer();
    this.route.queryParamMap.subscribe((params) => {
      const idParam = params.get('workoutId');
      if (idParam) {
        const id = Number(idParam);
        this.workoutId.set(id);
        this.loadWorkout(id);
      } else {
        this.workoutId.set(null);
        this.workout.set(null);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopDurationTimer();
  }

  startDurationTimer(): void {
    if (this.timerInterval != null) return;
    this.timerInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  stopDurationTimer(): void {
    if (this.timerInterval != null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  getWorkoutTitle(workout: Workout | null): string {
    if (!workout) return '';
    if (
      workout.title &&
      workout.title.trim() !== '' &&
      !['Log Workout', 'New workout'].includes(workout.title)
    ) {
      return workout.title;
    }
    return `Trening #${workout.workoutNumber ?? workout.id}`;
  }

  trackingTypeOf(item: WorkoutExercise): TrackingType {
    return item.exercise?.trackingType ?? 'WEIGHT_REPS';
  }

  tracksWeight(item: WorkoutExercise): boolean {
    const type = this.trackingTypeOf(item);
    return type === 'WEIGHT_REPS' || type === 'DURATION_WEIGHT';
  }

  tracksReps(item: WorkoutExercise): boolean {
    const type = this.trackingTypeOf(item);
    return type === 'WEIGHT_REPS' || type === 'REPS_ONLY';
  }

  tracksDuration(item: WorkoutExercise): boolean {
    const type = this.trackingTypeOf(item);
    return type === 'DURATION' || type === 'DURATION_WEIGHT' || type === 'DISTANCE_DURATION';
  }

  tracksDistance(item: WorkoutExercise): boolean {
    return this.trackingTypeOf(item) === 'DISTANCE_DURATION';
  }

  /** Seconds as m:ss, or h:mm:ss once past an hour. Empty input renders as a dash. */
  formatSetDuration(seconds?: number | null): string {
    if (seconds == null) {
      return '—';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }

  formatSetDistance(meters?: number | null): string {
    if (meters == null) {
      return '—';
    }
    return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters} m`;
  }

  /**
   * Accepts either plain seconds ("90") or a clock-style value ("1:30", "1:02:03"), because
   * typing 1:30 is the natural way to enter a minute and a half.
   */
  parseDurationInput(rawValue: string | number): number | null {
    const text = String(rawValue).trim();
    if (!text) {
      return null;
    }
    if (!text.includes(':')) {
      const seconds = Number(text);
      return Number.isFinite(seconds) && seconds >= 0 ? Math.round(seconds) : null;
    }
    const parts = text.split(':').map((part) => Number(part));
    if (parts.some((part) => !Number.isFinite(part) || part < 0)) {
      return null;
    }
    const total = parts.reduce((acc, part) => acc * 60 + part, 0);
    return Math.round(total);
  }

  formatPrevious(set: WorkoutSet, item?: WorkoutExercise): string {
    if (item && this.tracksDuration(item)) {
      const parts: string[] = [];
      if (this.tracksDistance(item) && set.prevDistanceMeters != null) {
        parts.push(this.formatSetDistance(set.prevDistanceMeters));
      }
      if (set.prevDurationSeconds != null) {
        parts.push(this.formatSetDuration(set.prevDurationSeconds));
      }
      return parts.length > 0 ? parts.join(' / ') : '—';
    }
    if (set.prevWeightKg == null && set.prevReps == null) {
      return '—';
    }
    const weight = set.prevWeightKg != null ? `${set.prevWeightKg}kg` : '—';
    const reps = set.prevReps != null ? `${set.prevReps}` : '—';
    return `${weight} x ${reps}`;
  }

  getFormattedDuration(durationSeconds?: number | null): string {
    if (durationSeconds != null) {
      return this.formatSeconds(durationSeconds);
    }
    const w = this.workout();
    if (!w) return '0s';

    const isFinished = w.status === 'COMPLETED' || w.status === 'CANCELLED' || w.endTime != null;

    if (isFinished) {
      if (w.durationSeconds != null && w.durationSeconds > 0) {
        return this.formatSeconds(w.durationSeconds);
      }
      if (w.startTime && w.endTime) {
        const diff = Math.round(
          (new Date(w.endTime).getTime() - new Date(w.startTime).getTime()) / 1000
        );
        if (diff > 0) {
          return this.formatSeconds(diff);
        }
      }
      return w.durationSeconds != null ? this.formatSeconds(w.durationSeconds) : '0s';
    }

    // Active workout in progress: calculate elapsed time from startTime to current time
    if (w.startTime) {
      const nowMs = this.currentTime().getTime();
      const startMs = new Date(w.startTime).getTime();
      const diffSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      return this.formatSeconds(diffSec);
    }

    if (w.durationSeconds != null && w.durationSeconds > 0) {
      return this.formatSeconds(w.durationSeconds);
    }

    return '0s';
  }

  formatSeconds(totalSeconds: number): string {
    const sec = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const remainingSeconds = sec % 60;

    if (hours > 0) {
      if (minutes > 0 && remainingSeconds > 0) {
        return `${hours}h ${minutes}m ${remainingSeconds}s`;
      }
      if (minutes > 0) {
        return `${hours}h ${minutes}m`;
      }
      if (remainingSeconds > 0) {
        return `${hours}h ${remainingSeconds}s`;
      }
      return `${hours}h`;
    }
    if (minutes > 0) {
      if (remainingSeconds > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      }
      return `${minutes}m`;
    }
    return `${remainingSeconds}s`;
  }

  getTotalVolume(): number {
    const w = this.workout();
    if (!w || !w.exercises) return 0;
    let total = 0;
    for (const ex of w.exercises) {
      for (const set of ex.sets || []) {
        if (set.isCompleted && set.weightKg && set.reps) {
          total += Number(set.weightKg) * Number(set.reps);
        }
      }
    }
    return Math.round(total * 100) / 100;
  }

  getCompletedSetsCount(): number {
    const w = this.workout();
    if (!w || !w.exercises) return 0;
    let count = 0;
    for (const ex of w.exercises) {
      for (const set of ex.sets || []) {
        if (set.isCompleted) {
          count++;
        }
      }
    }
    return count;
  }

  getTotalSetsCount(): number {
    const w = this.workout();
    if (!w || !w.exercises) return 0;
    let count = 0;
    for (const ex of w.exercises) {
      count += (ex.sets || []).length;
    }
    return count;
  }

  toggleEditCompleted(): void {
    this.isEditingCompleted.update((v) => !v);
    if (!this.isEditingCompleted()) {
      this.stopEdit();
      this.cancelEditTitle();
      this.cancelEditNotes();
      this.cancelDeleteSet();
      this.cancelDeleteWorkout();
    }
  }

  startEditTitle(): void {
    if (this.isReadOnly()) return;
    this.titleInput = this.getWorkoutTitle(this.workout());
    this.isEditingTitle.set(true);
  }

  cancelEditTitle(): void {
    this.isEditingTitle.set(false);
  }

  saveTitle(): void {
    if (this.isReadOnly()) return;
    const newTitle = this.titleInput.trim();
    const currentWorkout = this.workout();
    if (!currentWorkout || !currentWorkout.id || !newTitle) {
      return;
    }

    this.isSavingTitle.set(true);
    this.workoutService.updateWorkoutTitle(currentWorkout.id, newTitle).subscribe({
      next: (updated) => {
        this.workout.update((w) => (w ? { ...w, title: updated.title || newTitle } : null));
        this.isSavingTitle.set(false);
        this.isEditingTitle.set(false);
      },
      error: (err) => {
        console.error('Error updating title:', err);
        this.workout.update((w) => (w ? { ...w, title: newTitle } : null));
        this.isSavingTitle.set(false);
        this.isEditingTitle.set(false);
      },
    });
  }

  getExerciseKey(exercise: WorkoutExercise): number {
    return exercise.id ?? exercise.orderIndex;
  }

  isEditingNotes(exercise: WorkoutExercise): boolean {
    return this.editingNotesExerciseId() === this.getExerciseKey(exercise);
  }

  isSavingNotes(exercise: WorkoutExercise): boolean {
    return this.savingNotesExerciseId() === this.getExerciseKey(exercise);
  }

  startEditNotes(exercise: WorkoutExercise): void {
    if (this.isReadOnly()) return;
    this.exerciseNotesInput = exercise.notes || '';
    this.editingNotesExerciseId.set(this.getExerciseKey(exercise));
  }

  cancelEditNotes(): void {
    this.editingNotesExerciseId.set(null);
    this.exerciseNotesInput = '';
  }

  saveExerciseNotes(exercise: WorkoutExercise): void {
    if (this.isReadOnly()) return;
    const newNotes = this.exerciseNotesInput.trim();
    const key = this.getExerciseKey(exercise);
    this.savingNotesExerciseId.set(key);

    if (exercise.id) {
      this.workoutService.saveExerciseNotes(exercise.id, newNotes).subscribe({
        next: (updatedExercise) => {
          this.updateLocalExerciseNotes(exercise, updatedExercise?.notes ?? newNotes);
          this.savingNotesExerciseId.set(null);
          this.editingNotesExerciseId.set(null);
        },
        error: (err) => {
          console.error('Error saving exercise notes:', err);
          this.updateLocalExerciseNotes(exercise, newNotes);
          this.savingNotesExerciseId.set(null);
          this.editingNotesExerciseId.set(null);
        },
      });
    } else {
      this.updateLocalExerciseNotes(exercise, newNotes);
      this.savingNotesExerciseId.set(null);
      this.editingNotesExerciseId.set(null);
    }
  }

  private updateLocalExerciseNotes(exercise: WorkoutExercise, notes: string): void {
    this.workout.update((w) => {
      if (!w || !w.exercises) return w;
      const key = this.getExerciseKey(exercise);
      const updatedExercises = w.exercises.map((ex) => {
        if (this.getExerciseKey(ex) === key) {
          return { ...ex, notes: notes || null };
        }
        return ex;
      });
      return { ...w, exercises: updatedExercises };
    });
  }

  completeTraining(): void {
    const w = this.workout();
    if (!w || !w.id || this.isCompletingTraining()) return;

    this.isCompletingTraining.set(true);
    this.isEditingCompleted.set(false);
    this.workoutService.completeWorkout(w.id).subscribe({
      next: (updatedWorkout) => {
        this.workout.set(updatedWorkout);
        this.isCompletingTraining.set(false);
        this.stopDurationTimer();
      },
      error: (err) => {
        console.error('Error completing training:', err);
        const now = new Date();
        let duration = w.durationSeconds ?? 0;
        if (w.startTime) {
          duration = Math.max(0, Math.floor((now.getTime() - new Date(w.startTime).getTime()) / 1000));
        }
        this.workout.update((curr) =>
          curr
            ? {
                ...curr,
                status: 'COMPLETED',
                endTime: now,
                durationSeconds: duration,
              }
            : null
        );
        this.isCompletingTraining.set(false);
        this.stopDurationTimer();
      },
    });
  }

  loadWorkout(id: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.isEditingCompleted.set(false);

    this.workoutService.getWorkout(id).subscribe({
      next: (workout) => {
        this.workout.set(workout);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading workout details:', err);
        this.errorMessage.set('Failed to load workout details. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  addSet(exerciseId: number): void {
    if (this.isReadOnly()) return;
    const currentWorkout = this.workout();
    if (!currentWorkout || !currentWorkout.id || !exerciseId) {
      return;
    }

    this.isAddingSet.set(exerciseId);
    this.workoutService.addSet(currentWorkout.id, exerciseId).subscribe({
      next: (updatedWorkout) => {
        this.workout.set(updatedWorkout);
        this.isAddingSet.set(null);
      },
      error: (err) => {
        console.error('Error adding set:', err);
        this.isAddingSet.set(null);
      },
    });
  }

  isEditing(setId: number | undefined, field: SetField): boolean {
    if (!setId) return false;
    const current = this.editingCell();
    return current !== null && current.setId === setId && current.field === field;
  }

  startEdit(set: WorkoutSet, field: SetField): void {
    if (this.isReadOnly() || !set.id) return;
    this.editingCell.set({ setId: set.id, field });
    setTimeout(() => {
      const inputEl = document.getElementById(`input-${field}-${set.id}`) as HTMLInputElement;
      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      }
    });
  }

  stopEdit(): void {
    this.editingCell.set(null);
  }

  saveWeight(set: WorkoutSet, rawValue: string | number): void {
    if (this.isReadOnly() || !this.isEditing(set.id, 'weight')) {
      return;
    }
    this.stopEdit();

    const num = Number(rawValue);
    if (isNaN(num) || num < 0) {
      return;
    }

    if (num === set.weightKg) {
      return;
    }

    const previousWeight = set.weightKg;
    set.weightKg = num;

    this.sendSaveSet(
      {
        id: set.id!,
        kg: num,
        reps: set.reps,
        status: set.isCompleted,
      },
      () => {
        set.weightKg = previousWeight;
      }
    );
  }

  saveReps(set: WorkoutSet, rawValue: string | number): void {
    if (this.isReadOnly() || !this.isEditing(set.id, 'reps')) {
      return;
    }
    this.stopEdit();

    const num = Math.round(Number(rawValue));
    if (isNaN(num) || num < 0) {
      return;
    }

    if (num === set.reps) {
      return;
    }

    const previousReps = set.reps;
    set.reps = num;

    this.sendSaveSet(
      {
        id: set.id!,
        kg: set.weightKg,
        reps: num,
        status: set.isCompleted,
      },
      () => {
        set.reps = previousReps;
      }
    );
  }

  saveDuration(set: WorkoutSet, rawValue: string | number): void {
    if (this.isReadOnly() || !this.isEditing(set.id, 'duration')) {
      return;
    }
    this.stopEdit();

    const seconds = this.parseDurationInput(rawValue);
    if (seconds === null || seconds === set.durationSeconds) {
      return;
    }

    const previousDuration = set.durationSeconds;
    set.durationSeconds = seconds;

    this.sendSaveSet(
      {
        id: set.id!,
        durationSeconds: seconds,
        status: set.isCompleted,
      },
      () => {
        set.durationSeconds = previousDuration;
      }
    );
  }

  saveDistance(set: WorkoutSet, rawValue: string | number): void {
    if (this.isReadOnly() || !this.isEditing(set.id, 'distance')) {
      return;
    }
    this.stopEdit();

    const meters = Number(rawValue);
    if (!Number.isFinite(meters) || meters < 0 || meters === set.distanceMeters) {
      return;
    }

    const previousDistance = set.distanceMeters;
    set.distanceMeters = meters;

    this.sendSaveSet(
      {
        id: set.id!,
        distanceMeters: meters,
        status: set.isCompleted,
      },
      () => {
        set.distanceMeters = previousDistance;
      }
    );
  }

  sendSaveSet(request: SaveSetRequest, onRollback?: () => void): void {
    this.savingSetId.set(request.id);
    this.workoutService.saveSet(request).subscribe({
      next: (updatedSet) => {
        this.updateLocalSet(updatedSet);
        this.savingSetId.set(null);
      },
      error: (err) => {
        console.error('Error saving set:', err);
        if (onRollback) {
          onRollback();
        }
        this.savingSetId.set(null);
      },
    });
  }

  updateLocalSet(updatedSet: WorkoutSet): void {
    this.workout.update((currentWorkout) => {
      if (!currentWorkout || !currentWorkout.exercises) return currentWorkout;
      return {
        ...currentWorkout,
        exercises: currentWorkout.exercises.map((ex) => ({
          ...ex,
          sets: ex.sets?.map((s) => (s.id === updatedSet.id ? {
            ...s,
            ...updatedSet,
            prevWeightKg: updatedSet.prevWeightKg !== undefined && updatedSet.prevWeightKg !== null ? updatedSet.prevWeightKg : s.prevWeightKg,
            prevReps: updatedSet.prevReps !== undefined && updatedSet.prevReps !== null ? updatedSet.prevReps : s.prevReps,
            prevDurationSeconds: updatedSet.prevDurationSeconds !== undefined && updatedSet.prevDurationSeconds !== null ? updatedSet.prevDurationSeconds : s.prevDurationSeconds,
            prevDistanceMeters: updatedSet.prevDistanceMeters !== undefined && updatedSet.prevDistanceMeters !== null ? updatedSet.prevDistanceMeters : s.prevDistanceMeters,
          } : s)),
        })),
      };
    });
  }

  completeSet(set: WorkoutSet): void {
    if (this.isReadOnly() || !set.id) return;
    if (this.savingSetId() === set.id) return;

    const previousStatus = set.isCompleted;
    const newStatus = !previousStatus;
    set.isCompleted = newStatus;

    this.sendSaveSet(
      {
        id: set.id,
        kg: set.weightKg,
        reps: set.reps,
        status: newStatus,
      },
      () => {
        set.isCompleted = previousStatus;
      }
    );
  }

  promptDeleteSet(set: WorkoutSet): void {
    if (this.isReadOnly()) return;
    this.setToDelete.set(set);
  }

  cancelDeleteSet(): void {
    this.setToDelete.set(null);
  }

  confirmDeleteSet(): void {
    const set = this.setToDelete();
    if (!set) return;
    this.setToDelete.set(null);
    this.deleteSet(set);
  }

  deleteSet(set: WorkoutSet): void {
    if (this.isReadOnly() || !set.id) return;
    if (this.isDeletingSet() === set.id) return;

    this.isDeletingSet.set(set.id);
    this.workoutService.deleteSet(set.id).subscribe({
      next: () => {
        this.workout.update((currentWorkout) => {
          if (!currentWorkout || !currentWorkout.exercises) return currentWorkout;
          return {
            ...currentWorkout,
            exercises: currentWorkout.exercises.map((ex) => {
              const remainingSets = (ex.sets || []).filter((s) => s.id !== set.id);
              const renumberedSets = remainingSets.map((s, idx) => ({
                ...s,
                setNumber: idx + 1,
              }));
              return {
                ...ex,
                sets: renumberedSets,
              };
            }),
          };
        });
        this.isDeletingSet.set(null);
      },
      error: (err) => {
        console.error('Error deleting set:', err);
        this.isDeletingSet.set(null);
      },
    });
  }

  promptDeleteWorkout(): void {
    this.showDeleteWorkoutModal.set(true);
  }

  cancelDeleteWorkout(): void {
    this.showDeleteWorkoutModal.set(false);
  }

  confirmDeleteWorkout(): void {
    const currentWorkout = this.workout();
    if (!currentWorkout || !currentWorkout.id || this.isDeletingWorkout()) {
      return;
    }

    this.showDeleteWorkoutModal.set(false);
    this.isDeletingWorkout.set(true);

    this.workoutService.deleteWorkout(currentWorkout.id).subscribe({
      next: () => {
        this.isDeletingWorkout.set(false);
        this.router.navigate(['/workouts']);
      },
      error: (err) => {
        console.error('Error deleting workout:', err);
        this.isDeletingWorkout.set(false);
        this.errorMessage.set('Failed to delete workout. Please try again.');
      },
    });
  }
}






