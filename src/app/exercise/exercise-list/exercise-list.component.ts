import { ExerciseImagePipe } from '../exercise-image.pipe';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExerciseService } from '../exercise.service';
import { Exercise } from '../models/exercise';
import { WorkoutService } from '../../workout/workout.service';

@Component({
  selector: 'app-exercise-list',
  imports: [RouterLink, ExerciseImagePipe],
  templateUrl: './exercise-list.component.html',
  styleUrl: './exercise-list.component.css',
})
export class ExerciseListComponent implements OnInit {
  private readonly exerciseService = inject(ExerciseService);
  private readonly workoutService = inject(WorkoutService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  exerciseList = signal<Exercise[]>([]);
  selectedExerciseIds = signal<Set<number>>(new Set());
  workoutId = signal<number | null>(null);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const workoutIdParam = params.get('workoutId');
      if (workoutIdParam) {
        const id = Number(workoutIdParam);
        this.workoutId.set(id);
        this.loadWorkoutExercises(id);
      } else {
        this.workoutId.set(null);
        this.selectedExerciseIds.set(new Set());
      }
    });

    this.loadExercises();
  }

  loadExercises(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.exerciseService.getExerciseList().subscribe({
      next: (exercises) => {
        this.exerciseList.set(exercises);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading exercises:', err);
        this.errorMessage.set('Nie udało się pobrać listy ćwiczeń.');
        this.isLoading.set(false);
      },
    });
  }

  loadWorkoutExercises(workoutId: number): void {
    this.workoutService.getWorkout(workoutId).subscribe({
      next: (workout) => {
        if (workout && workout.exercises) {
          const ids = workout.exercises.map((e) => e.exercise.id);
          this.selectedExerciseIds.set(new Set(ids));
        }
      },
      error: (err) => {
        console.warn('Could not load workout exercises for preselection:', err);
      },
    });
  }

  toggleExercise(id: number): void {
    this.selectedExerciseIds.update((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  saveExercises(): void {
    const workoutId = this.workoutId();
    if (!workoutId) return;

    this.isSaving.set(true);
    const exerciseListArray = Array.from(this.selectedExerciseIds());

    this.workoutService.updateExerciseList(workoutId, exerciseListArray).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/workouts/detail'], {
          queryParams: { workoutId },
        });
      },
      error: (err) => {
        console.error('Error saving exercises:', err);
        this.isSaving.set(false);
      },
    });
  }
}




