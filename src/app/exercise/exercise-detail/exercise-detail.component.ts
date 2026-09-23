import { ExerciseImagePipe } from '../exercise-image.pipe';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExerciseService } from '../exercise.service';
import { Exercise } from '../models/exercise';

@Component({
  selector: 'app-exercise-detail',
  imports: [RouterLink, ExerciseImagePipe],
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
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const idParam = params.get('exerciseId');
      const workoutIdParam = params.get('workoutId');
      this.workoutId.set(workoutIdParam ? Number(workoutIdParam) : null);

      if (idParam) {
        const id = Number(idParam);
        this.exerciseId.set(id);
        this.loadExercise(id);
      } else {
        this.exerciseId.set(null);
        this.exercise.set(null);
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

  getSecondaryMuscles(exercise: Exercise | null): string[] {
    if (!exercise || !exercise.secondaryMuscles) return [];
    if (Array.isArray(exercise.secondaryMuscles)) {
      return exercise.secondaryMuscles;
    }
    return String(exercise.secondaryMuscles).split(',').map((s) => s.trim());
  }
}
