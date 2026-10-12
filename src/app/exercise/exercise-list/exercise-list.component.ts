import { ExerciseImagePipe } from '../exercise-image.pipe';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExerciseService } from '../exercise.service';
import { Exercise } from '../models/exercise';
import { WorkoutService } from '../../workout/workout.service';

@Component({
  selector: 'app-exercise-list',
  imports: [RouterLink, FormsModule, ExerciseImagePipe],
  templateUrl: './exercise-list.component.html',
  styleUrl: './exercise-list.component.css',
})
export class ExerciseListComponent implements OnInit {
  private readonly exerciseService = inject(ExerciseService);
  private readonly workoutService = inject(WorkoutService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  exerciseList = signal<Exercise[]>([]);
  selectedMuscle = signal<string>('');
  selectedEquipment = signal<string>('');
  selectedExerciseIds = signal<Set<number>>(new Set());
  workoutId = signal<number | null>(null);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  readonly availableMuscles = computed<string[]>(() => {
    const musclesMap = new Map<string, string>();
    for (const exercise of this.exerciseList()) {
      for (const muscle of this.getExerciseMuscles(exercise)) {
        const key = muscle.toLowerCase();
        if (!musclesMap.has(key)) {
          musclesMap.set(key, muscle);
        }
      }
    }
    return Array.from(musclesMap.values()).sort((a, b) => a.localeCompare(b));
  });

  readonly availableEquipments = computed<string[]>(() => {
    const equipmentMap = new Map<string, string>();
    for (const exercise of this.exerciseList()) {
      const equip = (exercise.equipmentCategory ?? '').trim();
      if (equip) {
        const key = equip.toLowerCase();
        if (!equipmentMap.has(key)) {
          equipmentMap.set(key, equip);
        }
      }
    }
    return Array.from(equipmentMap.values()).sort((a, b) => a.localeCompare(b));
  });

  readonly filteredExerciseList = computed<Exercise[]>(() => {
    const muscleFilter = this.selectedMuscle().trim().toLowerCase();
    const equipmentFilter = this.selectedEquipment().trim().toLowerCase();

    return this.exerciseList().filter((exercise) => {
      if (muscleFilter) {
        const exerciseMuscles = this.getExerciseMuscles(exercise).map((m) => m.toLowerCase());
        if (!exerciseMuscles.includes(muscleFilter)) {
          return false;
        }
      }
      if (equipmentFilter) {
        const equip = (exercise.equipmentCategory ?? '').trim().toLowerCase();
        if (equip !== equipmentFilter) {
          return false;
        }
      }
      return true;
    });
  });

  readonly hasActiveFilters = computed<boolean>(() =>
    Boolean(this.selectedMuscle().trim() || this.selectedEquipment().trim()),
  );

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const workoutIdParam = params.get('workoutId');
      this.workoutId.set(workoutIdParam ? Number(workoutIdParam) : null);
      // Always start with nothing selected: the picker only adds new exercises,
      // so preselecting the ones already in the workout would add them again.
      this.selectedExerciseIds.set(new Set());
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

  clearFilters(): void {
    this.selectedMuscle.set('');
    this.selectedEquipment.set('');
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

  private getExerciseMuscles(exercise: Exercise): string[] {
    const muscles: string[] = [];
    const primary = (exercise.targetMuscle || exercise.primaryMuscle || '').trim();
    if (primary) {
      muscles.push(primary);
    }
    if (exercise.secondaryMuscles) {
      const secondary = Array.isArray(exercise.secondaryMuscles)
        ? exercise.secondaryMuscles
        : String(exercise.secondaryMuscles).split(',');
      for (const m of secondary) {
        const trimmed = m.trim();
        if (trimmed) {
          muscles.push(trimmed);
        }
      }
    }
    return muscles;
  }
}
