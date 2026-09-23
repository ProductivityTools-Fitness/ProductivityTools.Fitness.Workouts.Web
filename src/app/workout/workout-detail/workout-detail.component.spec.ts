import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { WorkoutDetailComponent } from './workout-detail.component';
import { WorkoutService } from '../workout.service';
import { Workout } from '../models/workout';

describe('WorkoutDetailComponent', () => {
  let component: WorkoutDetailComponent;
  let fixture: ComponentFixture<WorkoutDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkoutDetailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();


    fixture = TestBed.createComponent(WorkoutDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call workoutService.addSet and update workout with returned value', () => {
    const workoutService = TestBed.inject(WorkoutService);
    const initialWorkout: Workout = {
      id: 10,
      title: 'Trening #10',
      exercises: [
        {
          orderIndex: 1,
          exercise: { id: 42, name: 'Squat', isSystem: true },
          sets: [{ setNumber: 1, weightKg: 80, reps: 10, isCompleted: false }],
        },
      ],
    };

    const updatedWorkout: Workout = {
      id: 10,
      title: 'Trening #10',
      exercises: [
        {
          orderIndex: 1,
          exercise: { id: 42, name: 'Squat', isSystem: true },
          sets: [
            { setNumber: 1, weightKg: 80, reps: 10, isCompleted: false },
            { setNumber: 2, weightKg: 80, reps: 10, isCompleted: false },
          ],
        },
      ],
    };

    component.workout.set(initialWorkout);
    const addSetSpy = vi.spyOn(workoutService, 'addSet').mockReturnValue(of(updatedWorkout));

    component.addSet(42);

    expect(addSetSpy).toHaveBeenCalledWith(10, 42);
    expect(component.workout()).toEqual(updatedWorkout);
    expect(component.workout()?.exercises?.[0].sets?.length).toBe(2);
    expect(component.isAddingSet()).toBeNull();
  });

  it('should start and stop editing cell', () => {
    const set = { id: 101, setNumber: 1, weightKg: 50, reps: 8, isCompleted: false };
    expect(component.isEditing(101, 'weight')).toBe(false);

    component.startEdit(set, 'weight');
    expect(component.isEditing(101, 'weight')).toBe(true);
    expect(component.isEditing(101, 'reps')).toBe(false);

    component.stopEdit();
    expect(component.isEditing(101, 'weight')).toBe(false);
  });

  it('should save weight and call workoutService.saveSet when weight changes', () => {
    const workoutService = TestBed.inject(WorkoutService);
    const set = { id: 101, setNumber: 1, weightKg: 50, reps: 8, isCompleted: false };
    const initialWorkout: Workout = {
      id: 1,
      title: 'Trening #1',
      exercises: [
        {
          orderIndex: 1,
          exercise: { id: 42, name: 'Squat', isSystem: true },
          sets: [{ ...set }],
        },
      ],
    };
    component.workout.set(initialWorkout);

    const updatedSet = { ...set, weightKg: 65 };
    const saveSetSpy = vi.spyOn(workoutService, 'saveSet').mockReturnValue(of(updatedSet));

    component.startEdit(set, 'weight');
    component.saveWeight(set, '65');

    expect(saveSetSpy).toHaveBeenCalledWith({
      id: 101,
      kg: 65,
      reps: 8,
      status: false,
    });
    expect(component.isEditing(101, 'weight')).toBe(false);
    expect(component.workout()?.exercises?.[0].sets?.[0].weightKg).toBe(65);
  });

  it('should not call saveSet if weight did not change', () => {
    const workoutService = TestBed.inject(WorkoutService);
    const set = { id: 101, setNumber: 1, weightKg: 50, reps: 8, isCompleted: false };
    const saveSetSpy = vi.spyOn(workoutService, 'saveSet');

    component.startEdit(set, 'weight');
    component.saveWeight(set, '50');

    expect(saveSetSpy).not.toHaveBeenCalled();
    expect(component.isEditing(101, 'weight')).toBe(false);
  });

  it('should save reps and call workoutService.saveSet when reps change', () => {
    const workoutService = TestBed.inject(WorkoutService);
    const set = { id: 101, setNumber: 1, weightKg: 50, reps: 8, isCompleted: false };
    const initialWorkout: Workout = {
      id: 1,
      title: 'Trening #1',
      exercises: [
        {
          orderIndex: 1,
          exercise: { id: 42, name: 'Squat', isSystem: true },
          sets: [{ ...set }],
        },
      ],
    };
    component.workout.set(initialWorkout);

    const updatedSet = { ...set, reps: 12 };
    const saveSetSpy = vi.spyOn(workoutService, 'saveSet').mockReturnValue(of(updatedSet));

    component.startEdit(set, 'reps');
    component.saveReps(set, '12');

    expect(saveSetSpy).toHaveBeenCalledWith({
      id: 101,
      kg: 50,
      reps: 12,
      status: false,
    });
    expect(component.isEditing(101, 'reps')).toBe(false);
    expect(component.workout()?.exercises?.[0].sets?.[0].reps).toBe(12);
  });

  it('should complete set by setting status to true and calling saveSet', () => {
    const workoutService = TestBed.inject(WorkoutService);
    const set = { id: 101, setNumber: 1, weightKg: 80, reps: 10, isCompleted: false };
    const initialWorkout: Workout = {
      id: 1,
      title: 'Trening #1',
      exercises: [
        {
          orderIndex: 1,
          exercise: { id: 42, name: 'Squat', isSystem: true },
          sets: [{ ...set }],
        },
      ],
    };
    component.workout.set(initialWorkout);

    const updatedSet = { ...set, isCompleted: true };
    const saveSetSpy = vi.spyOn(workoutService, 'saveSet').mockReturnValue(of(updatedSet));

    component.completeSet(set);

    expect(saveSetSpy).toHaveBeenCalledWith({
      id: 101,
      kg: 80,
      reps: 10,
      status: true,
    });
    expect(component.workout()?.exercises?.[0].sets?.[0].isCompleted).toBe(true);
  });

  it('should reset completed set by setting status to false and calling saveSet', () => {
    const workoutService = TestBed.inject(WorkoutService);
    const set = { id: 101, setNumber: 1, weightKg: 80, reps: 10, isCompleted: true };
    const initialWorkout: Workout = {
      id: 1,
      title: 'Trening #1',
      exercises: [
        {
          orderIndex: 1,
          exercise: { id: 42, name: 'Squat', isSystem: true },
          sets: [{ ...set }],
        },
      ],
    };
    component.workout.set(initialWorkout);

    const updatedSet = { ...set, isCompleted: false };
    const saveSetSpy = vi.spyOn(workoutService, 'saveSet').mockReturnValue(of(updatedSet));

    component.completeSet(set);

    expect(saveSetSpy).toHaveBeenCalledWith({
      id: 101,
      kg: 80,
      reps: 10,
      status: false,
    });
    expect(component.workout()?.exercises?.[0].sets?.[0].isCompleted).toBe(false);
  });

  it('should render checkbox for each set and toggle completion on click', () => {
    const workoutService = TestBed.inject(WorkoutService);
    const set = { id: 101, setNumber: 1, weightKg: 80, reps: 10, isCompleted: false };
    const workout: Workout = {
      id: 1,
      title: 'Trening #1',
      exercises: [
        {
          orderIndex: 1,
          exercise: { id: 42, name: 'Squat', isSystem: true },
          sets: [{ ...set }],
        },
      ],
    };
    component.workout.set(workout);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const checkBtn = compiled.querySelector<HTMLButtonElement>('.btn-check-set');
    expect(checkBtn).toBeTruthy();
    expect(checkBtn?.classList.contains('checked')).toBe(false);
    expect(checkBtn?.querySelector('.check-icon')).toBeNull();

    const updatedSet = { ...set, isCompleted: true };
    vi.spyOn(workoutService, 'saveSet').mockReturnValue(of(updatedSet));

    checkBtn?.click();
    fixture.detectChanges();

    expect(component.workout()?.exercises?.[0].sets?.[0].isCompleted).toBe(true);
    expect(checkBtn?.classList.contains('checked')).toBe(true);
    expect(checkBtn?.querySelector('.check-icon')).toBeTruthy();
  });

  it('should delete a set and renumber remaining sets', () => {
    const workoutService = TestBed.inject(WorkoutService);
    const set1 = { id: 101, setNumber: 1, weightKg: 80, reps: 10, isCompleted: true };
    const set2 = { id: 102, setNumber: 2, weightKg: 85, reps: 8, isCompleted: false };
    const set3 = { id: 103, setNumber: 3, weightKg: 90, reps: 6, isCompleted: false };
    const initialWorkout: Workout = {
      id: 1,
      title: 'Trening #1',
      exercises: [
        {
          orderIndex: 1,
          exercise: { id: 42, name: 'Squat', isSystem: true },
          sets: [{ ...set1 }, { ...set2 }, { ...set3 }],
        },
      ],
    };
    component.workout.set(initialWorkout);

    const deleteSetSpy = vi.spyOn(workoutService, 'deleteSet').mockReturnValue(of(true));

    component.deleteSet(set2);

    expect(deleteSetSpy).toHaveBeenCalledWith(102);
    const remainingSets = component.workout()?.exercises?.[0].sets;
    expect(remainingSets?.length).toBe(2);
    expect(remainingSets?.[0].id).toBe(101);
    expect(remainingSets?.[0].setNumber).toBe(1);
    expect(remainingSets?.[1].id).toBe(103);
    expect(remainingSets?.[1].setNumber).toBe(2);
    expect(component.isDeletingSet()).toBeNull();
  });

  it('should open confirmation popup when clicking trash icon and cancel when clicking Cancel', () => {
    const workoutService = TestBed.inject(WorkoutService);
    const deleteSpy = vi.spyOn(workoutService, 'deleteSet');
    const set = { id: 101, setNumber: 1, weightKg: 80, reps: 10, isCompleted: false };
    const workout: Workout = {
      id: 1,
      title: 'Trening #1',
      exercises: [
        {
          orderIndex: 1,
          exercise: { id: 42, name: 'Squat', isSystem: true },
          sets: [{ ...set }],
        },
      ],
    };
    component.workout.set(workout);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.modal-dialog')).toBeNull();

    const trashBtn = compiled.querySelector<HTMLButtonElement>('.btn-delete-set');
    trashBtn?.click();
    fixture.detectChanges();

    const modal = compiled.querySelector<HTMLElement>('.modal-dialog');
    expect(modal).toBeTruthy();
    expect(modal?.textContent).toContain('Delete Set');
    expect(modal?.textContent).toContain('Are you sure you want to delete Set 1');
    expect(modal?.textContent).toContain('80 kg × 10 reps');

    const cancelBtn = modal?.querySelector<HTMLButtonElement>('.btn-modal-cancel');
    cancelBtn?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.modal-dialog')).toBeNull();
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(component.workout()?.exercises?.[0].sets?.length).toBe(1);
  });

  it('should delete set when confirmed in popup', () => {
    const workoutService = TestBed.inject(WorkoutService);
    const deleteSpy = vi.spyOn(workoutService, 'deleteSet').mockReturnValue(of(true));
    const set = { id: 101, setNumber: 1, weightKg: 80, reps: 10, isCompleted: false };
    const workout: Workout = {
      id: 1,
      title: 'Trening #1',
      exercises: [
        {
          orderIndex: 1,
          exercise: { id: 42, name: 'Squat', isSystem: true },
          sets: [{ ...set }],
        },
      ],
    };
    component.workout.set(workout);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const trashBtn = compiled.querySelector<HTMLButtonElement>('.btn-delete-set');
    trashBtn?.click();
    fixture.detectChanges();

    const deleteBtn = compiled.querySelector<HTMLButtonElement>('.btn-modal-delete');
    deleteBtn?.click();
    fixture.detectChanges();

    expect(deleteSpy).toHaveBeenCalledWith(101);
    expect(compiled.querySelector('.modal-dialog')).toBeNull();
    expect(component.workout()?.exercises?.[0].sets?.length).toBe(0);
  });

  it('should not render pencil icons in editable weight and reps cells', () => {
    const set1 = {
      id: 101,
      setNumber: 1,
      weightKg: 80,
      reps: 10,
      isCompleted: false,
    };
    const initialWorkout: Workout = {
      id: 1,
      title: 'Trening #1',
      exercises: [
        {
          orderIndex: 1,
          exercise: { id: 42, name: 'Squat', isSystem: true },
          sets: [set1],
        },
      ],
    };
    component.workout.set(initialWorkout);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.col-editable').length).toBe(2);
    expect(compiled.querySelector('.edit-icon')).toBeNull();
    const cellDisplays = compiled.querySelectorAll('.cell-display');
    cellDisplays.forEach((el) => {
      expect(el.textContent).not.toContain('✏️');
    });
  });

  it('should render Previous column with format xkg x reps', () => {
    const set1 = {
      id: 101,
      setNumber: 1,
      weightKg: 80,
      reps: 10,
      prevWeightKg: 50,
      prevReps: 10,
      isCompleted: false,
    };
    const set2 = {
      id: 102,
      setNumber: 2,
      weightKg: 80,
      reps: 10,
      prevWeightKg: null,
      prevReps: null,
      isCompleted: false,
    };
    const initialWorkout: Workout = {
      id: 1,
      title: 'Trening #1',
      exercises: [
        {
          orderIndex: 1,
          exercise: { id: 42, name: 'Squat', isSystem: true },
          sets: [set1, set2],
        },
      ],
    };
    component.workout.set(initialWorkout);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const prevElements = compiled.querySelectorAll<HTMLElement>('.prev-val');
    expect(prevElements.length).toBe(2);
    expect(prevElements[0].textContent?.trim()).toBe('50kg x 10');
    expect(prevElements[1].textContent?.trim()).toBe('—');
  });

  it('should not render Previous column when in readonly mode', () => {
    const set1 = {
      id: 101,
      setNumber: 1,
      weightKg: 80,
      reps: 10,
      prevWeightKg: 50,
      prevReps: 10,
      isCompleted: true,
    };
    const completedWorkout: Workout = {
      id: 1,
      title: 'Trening #1',
      status: 'COMPLETED',
      exercises: [
        {
          orderIndex: 1,
          exercise: { id: 42, name: 'Squat', isSystem: true },
          sets: [set1],
        },
      ],
    };
    component.workout.set(completedWorkout);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const prevHeaders = Array.from(compiled.querySelectorAll('th')).filter(th => th.textContent?.trim() === 'Previous');
    const prevCells = compiled.querySelectorAll<HTMLElement>('.col-previous');
    expect(prevHeaders.length).toBe(0);
    expect(prevCells.length).toBe(0);
  });

  it('should correctly format previous set in formatPrevious', () => {
    expect(
      component.formatPrevious({
        setNumber: 1,
        weightKg: 0,
        reps: 0,
        isCompleted: false,
        prevWeightKg: 50,
        prevReps: 10,
      })
    ).toBe('50kg x 10');
    expect(
      component.formatPrevious({
        setNumber: 1,
        weightKg: 0,
        reps: 0,
        isCompleted: false,
        prevWeightKg: 72.5,
        prevReps: 8,
      })
    ).toBe('72.5kg x 8');
    expect(
      component.formatPrevious({
        setNumber: 1,
        weightKg: 0,
        reps: 0,
        isCompleted: false,
        prevWeightKg: null,
        prevReps: null,
      })
    ).toBe('—');
    expect(
      component.formatPrevious({
        setNumber: 1,
        weightKg: 0,
        reps: 0,
        isCompleted: false,
      })
    ).toBe('—');
  });

  it('should format seconds into readable duration', () => {
    expect(component.formatSeconds(0)).toBe('0s');
    expect(component.formatSeconds(45)).toBe('45s');
    expect(component.formatSeconds(60)).toBe('1m');
    expect(component.formatSeconds(75)).toBe('1m 15s');
    expect(component.formatSeconds(3600)).toBe('1h');
    expect(component.formatSeconds(3660)).toBe('1h 1m');
    expect(component.formatSeconds(3665)).toBe('1h 1m 5s');
  });

  it('should render duration and status in workout-meta', () => {
    const workoutWithDuration: Workout = {
      id: 20,
      title: 'Trening #20',
      status: 'IN_PROGRESS',
      durationSeconds: 4500,
      exercises: [],
    };
    component.workout.set(workoutWithDuration);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.stat-badge.duration')).toBeNull();

    const metaText = compiled.querySelector<HTMLElement>('.workout-meta');
    expect(metaText?.textContent).toContain('Duration: 1h 15m');
    expect(metaText?.textContent).toContain('Status: IN_PROGRESS');
  });

  it('should calculate live duration from startTime for in-progress workout and advance on tick', () => {
    const baseTime = new Date('2026-09-07T12:00:00Z');
    const startTime = new Date('2026-09-07T11:58:30Z'); // 90 seconds ago

    component.currentTime.set(baseTime);
    const activeWorkout: Workout = {
      id: 25,
      title: 'Trening #25',
      status: 'IN_PROGRESS',
      startTime: startTime.toISOString(),
      durationSeconds: 0,
      exercises: [],
    };
    component.workout.set(activeWorkout);
    fixture.detectChanges();

    expect(component.getFormattedDuration()).toBe('1m 30s');

    // Advance current time by 15 seconds
    const advancedTime = new Date('2026-09-07T12:00:15Z');
    component.currentTime.set(advancedTime);
    fixture.detectChanges();

    expect(component.getFormattedDuration()).toBe('1m 45s');

    const compiled = fixture.nativeElement as HTMLElement;
    const metaText = compiled.querySelector<HTMLElement>('.workout-meta');
    expect(metaText?.textContent).toContain('Duration: 1m 45s');
  });

  it('should clean up duration timer on destroy', () => {
    const stopTimerSpy = vi.spyOn(component, 'stopDurationTimer');
    component.ngOnDestroy();
    expect(stopTimerSpy).toHaveBeenCalled();
  });

  it('should calculate Volume and Sets for completed sets and render in workout-meta', () => {
    const workout: Workout = {
      id: 21,
      title: 'Trening #21',
      exercises: [
        {
          orderIndex: 1,
          exercise: { id: 1, name: 'Squat', isSystem: true },
          sets: [
            { id: 1, setNumber: 1, weightKg: 100, reps: 10, isCompleted: true }, // 1000kg
            { id: 2, setNumber: 2, weightKg: 100, reps: 8, isCompleted: true },  // 800kg
            { id: 3, setNumber: 3, weightKg: 100, reps: 6, isCompleted: false }, // not completed
          ],
        },
        {
          orderIndex: 2,
          exercise: { id: 2, name: 'Bench Press', isSystem: true },
          sets: [
            { id: 4, setNumber: 1, weightKg: 60, reps: 10, isCompleted: true },  // 600kg
            { id: 5, setNumber: 2, weightKg: 60, reps: 10, isCompleted: false }, // not completed
          ],
        },
      ],
    };
    component.workout.set(workout);
    fixture.detectChanges();

    // Volume: 1000 + 800 + 600 = 2400 kg
    expect(component.getTotalVolume()).toBe(2400);
    // Completed sets: 3
    expect(component.getCompletedSetsCount()).toBe(3);
    // Total sets: 5
    expect(component.getTotalSetsCount()).toBe(5);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.stat-badge.volume')).toBeNull();
    expect(compiled.querySelector('.stat-badge.sets')).toBeNull();

    const metaText = compiled.querySelector<HTMLElement>('.workout-meta');
    expect(metaText?.textContent).toContain('Volume: 2400 kg');
    expect(metaText?.textContent).toContain('Sets: 3 / 5');
  });

  it('should display exercise notes or placeholder and allow editing on click', () => {
    const workout: Workout = {
      id: 30,
      title: 'Trening #30',
      exercises: [
        {
          id: 101,
          orderIndex: 1,
          exercise: { id: 1, name: 'Squat', isSystem: true },
          notes: 'Focus on depth',
        },
        {
          id: 102,
          orderIndex: 2,
          exercise: { id: 2, name: 'Bench Press', isSystem: true },
          notes: null,
        },
      ],
    };
    component.workout.set(workout);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const notesDisplays = compiled.querySelectorAll<HTMLElement>('.exercise-notes-display');
    expect(notesDisplays.length).toBe(2);

    expect(notesDisplays[0].textContent).toContain('Focus on depth');
    expect(notesDisplays[1].textContent).toContain('Add notes...');

    // Click on notes to start edit
    notesDisplays[0].click();
    fixture.detectChanges();

    expect(component.isEditingNotes(workout.exercises![0])).toBe(true);
    expect(component.exerciseNotesInput).toBe('Focus on depth');

    const editInput = compiled.querySelector<HTMLInputElement>('.exercise-notes-input');
    expect(editInput).toBeTruthy();

    // Cancel edit
    component.cancelEditNotes();
    fixture.detectChanges();

    expect(component.isEditingNotes(workout.exercises![0])).toBe(false);
  });

  it('should call workoutService.saveExerciseNotes and update local workout on save', () => {
    const workoutService = TestBed.inject(WorkoutService);
    const workoutExercise = {
      id: 101,
      orderIndex: 1,
      exercise: { id: 1, name: 'Squat', isSystem: true },
      notes: 'Initial note',
    };
    const workout: Workout = {
      id: 31,
      title: 'Trening #31',
      exercises: [workoutExercise],
    };
    component.workout.set(workout);
    fixture.detectChanges();

    const updatedWorkoutExercise = {
      ...workoutExercise,
      notes: 'Updated note from server',
    };
    const saveNotesSpy = vi
      .spyOn(workoutService, 'saveExerciseNotes')
      .mockReturnValue(of(updatedWorkoutExercise as any));

    component.startEditNotes(workoutExercise);
    component.exerciseNotesInput = 'Updated note from server';
    component.saveExerciseNotes(workoutExercise);

    expect(saveNotesSpy).toHaveBeenCalledWith(101, 'Updated note from server');
    expect(component.workout()?.exercises?.[0].notes).toBe('Updated note from server');
    expect(component.isEditingNotes(workoutExercise)).toBe(false);
  });

  it('should start editing workout title when clicking on the title text', () => {
    const workout: Workout = {
      id: 32,
      title: 'Leg Day',
      exercises: [],
    };
    component.workout.set(workout);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const titleHeader = compiled.querySelector<HTMLElement>('.clickable-title');
    expect(titleHeader).toBeTruthy();

    titleHeader?.click();
    fixture.detectChanges();

    expect(component.isEditingTitle()).toBe(true);
    expect(component.titleInput).toBe('Leg Day');
  });

  it('should render Complete Training button for in-progress workout and call completeWorkout on click', () => {
    const workoutService = TestBed.inject(WorkoutService);
    const workout: Workout = {
      id: 40,
      title: 'Trening #40',
      status: 'IN_PROGRESS',
      exercises: [],
    };
    component.workout.set(workout);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const completeBtns = compiled.querySelectorAll<HTMLButtonElement>('.btn-complete-training');
    expect(completeBtns.length).toBeGreaterThan(0);
    expect(completeBtns[0].textContent).toContain('Complete Training');

    const completedWorkout: Workout = {
      ...workout,
      status: 'COMPLETED',
      durationSeconds: 1800,
    };
    const completeSpy = vi
      .spyOn(workoutService, 'completeWorkout')
      .mockReturnValue(of(completedWorkout));

    completeBtns[0].click();
    fixture.detectChanges();

    expect(completeSpy).toHaveBeenCalledWith(40);
    expect(component.workout()?.status).toBe('COMPLETED');

    const remainingBtns = compiled.querySelectorAll<HTMLButtonElement>('.btn-complete-training');
    expect(remainingBtns.length).toBe(0);
  });

  it('should not render Complete Training button when workout is already COMPLETED', () => {
    const completedWorkout: Workout = {
      id: 41,
      title: 'Trening #41',
      status: 'COMPLETED',
      durationSeconds: 2400,
      exercises: [],
    };
    component.workout.set(completedWorkout);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const completeBtns = compiled.querySelectorAll<HTMLButtonElement>('.btn-complete-training');
    expect(completeBtns.length).toBe(0);
  });

  describe('Completed workout read-only mode and Edit Training toggle', () => {
    const completedWorkoutWithData: Workout = {
      id: 50,
      title: 'Completed Leg Day',
      status: 'COMPLETED',
      durationSeconds: 3600,
      exercises: [
        {
          id: 101,
          orderIndex: 1,
          exercise: { id: 1, name: 'Squat', isSystem: true },
          notes: 'Great depth today',
          sets: [
            { id: 201, setNumber: 1, weightKg: 100, reps: 5, isCompleted: true },
          ],
        },
      ],
    };

    it('should set isReadOnly to true by default for COMPLETED workout and hide edit controls', () => {
      component.workout.set({ ...completedWorkoutWithData });
      fixture.detectChanges();

      expect(component.isReadOnly()).toBe(true);

      const compiled = fixture.nativeElement as HTMLElement;

      // Title should not be clickable
      expect(compiled.querySelector('.clickable-title')).toBeNull();

      // + Add Exercise button should be hidden
      expect(compiled.querySelector('.section-header .btn-add')).toBeNull();

      // Notes should have readonly class and no edit pencil
      expect(compiled.querySelector('.exercise-notes-display.readonly')).toBeTruthy();
      expect(compiled.querySelector('.btn-edit-notes')).toBeNull();

      // Sets table: weight and reps not editable
      expect(compiled.querySelector('.col-editable')).toBeNull();
      expect(compiled.querySelector('.edit-icon')).toBeNull();

      // Checkbox should be disabled
      const checkBtn = compiled.querySelector<HTMLButtonElement>('.btn-check-set');
      expect(checkBtn?.disabled).toBe(true);

      // Delete column should be hidden
      expect(compiled.querySelector('.col-actions')).toBeNull();
      expect(compiled.querySelector('.col-delete')).toBeNull();
      expect(compiled.querySelector('.btn-delete-set')).toBeNull();

      // + Add set button should be hidden
      expect(compiled.querySelector('.btn-add-set')).toBeNull();

      // Bottom actions footer should have Edit Training button
      const editBtn = compiled.querySelector<HTMLButtonElement>('.btn-edit-training');
      expect(editBtn).toBeTruthy();
      expect(editBtn?.textContent).toContain('Edit Training');
    });

    it('should guard mutator methods when isReadOnly is true', () => {
      const workoutService = TestBed.inject(WorkoutService);
      const saveSetSpy = vi.spyOn(workoutService, 'saveSet');
      const addSetSpy = vi.spyOn(workoutService, 'addSet');
      const deleteSetSpy = vi.spyOn(workoutService, 'deleteSet');

      component.workout.set({ ...completedWorkoutWithData });
      fixture.detectChanges();

      const exercise = completedWorkoutWithData.exercises![0];
      const set = exercise.sets![0];

      // Title editing should be blocked
      component.startEditTitle();
      expect(component.isEditingTitle()).toBe(false);

      // Notes editing should be blocked
      component.startEditNotes(exercise);
      expect(component.editingNotesExerciseId()).toBeNull();

      // Cell editing should be blocked
      component.startEdit(set, 'weight');
      expect(component.editingCell()).toBeNull();

      // Saving set should be blocked
      component.completeSet(set);
      expect(saveSetSpy).not.toHaveBeenCalled();

      // Add set should be blocked
      component.addSet(1);
      expect(addSetSpy).not.toHaveBeenCalled();

      // Delete set should be blocked
      component.promptDeleteSet(set);
      expect(component.setToDelete()).toBeNull();
      component.deleteSet(set);
      expect(deleteSetSpy).not.toHaveBeenCalled();
    });

    it('should unlock all fields when Edit Training is clicked and lock them when Done Editing is clicked', () => {
      component.workout.set({ ...completedWorkoutWithData });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      let editBtn = compiled.querySelector<HTMLButtonElement>('.btn-edit-training');
      expect(editBtn).toBeTruthy();

      // Click Edit Training
      editBtn?.click();
      fixture.detectChanges();

      expect(component.isEditingCompleted()).toBe(true);
      expect(component.isReadOnly()).toBe(false);

      // Now all edit controls should be visible
      expect(compiled.querySelector('.clickable-title')).toBeTruthy();
      expect(compiled.querySelector('.section-header .btn-add')).toBeTruthy();
      expect(compiled.querySelector('.btn-edit-notes')).toBeTruthy();
      expect(compiled.querySelectorAll('.col-editable').length).toBeGreaterThan(0);
      expect(compiled.querySelector<HTMLButtonElement>('.btn-check-set')?.disabled).toBe(false);
      expect(compiled.querySelector('.col-delete')).toBeTruthy();
      expect(compiled.querySelector('.btn-add-set')).toBeTruthy();

      // The button should now be Done Editing
      const doneBtn = compiled.querySelector<HTMLButtonElement>('.btn-done-editing');
      expect(doneBtn).toBeTruthy();
      expect(doneBtn?.textContent).toContain('Done Editing');

      // Click Done Editing
      doneBtn?.click();
      fixture.detectChanges();

      expect(component.isEditingCompleted()).toBe(false);
      expect(component.isReadOnly()).toBe(true);

      // Controls should be hidden again
      expect(compiled.querySelector('.clickable-title')).toBeNull();
      expect(compiled.querySelector('.section-header .btn-add')).toBeNull();
      expect(compiled.querySelector('.btn-edit-notes')).toBeNull();
      expect(compiled.querySelector('.col-editable')).toBeNull();
      expect(compiled.querySelector('.col-delete')).toBeNull();
      expect(compiled.querySelector('.btn-add-set')).toBeNull();

      // And button should revert to Edit Training
      editBtn = compiled.querySelector<HTMLButtonElement>('.btn-edit-training');
      expect(editBtn).toBeTruthy();
    });

    it('should lock into read-only mode after completing training', () => {
      const workoutService = TestBed.inject(WorkoutService);
      const inProgressWorkout: Workout = {
        id: 55,
        title: 'Workout #55',
        status: 'IN_PROGRESS',
        exercises: completedWorkoutWithData.exercises,
      };
      component.workout.set(inProgressWorkout);
      fixture.detectChanges();

      expect(component.isReadOnly()).toBe(false);

      const completedWorkout: Workout = {
        ...inProgressWorkout,
        status: 'COMPLETED',
      };
      vi.spyOn(workoutService, 'completeWorkout').mockReturnValue(of(completedWorkout));

      component.completeTraining();
      fixture.detectChanges();

      expect(component.workout()?.status).toBe('COMPLETED');
      expect(component.isReadOnly()).toBe(true);
      expect(component.isEditingCompleted()).toBe(false);
    });
  });

  it('should render Workout Number in workout-meta when workoutNumber is provided', () => {
    const workoutWithNumber: Workout = {
      id: 101,
      workoutNumber: 15,
      title: 'Trening #15',
      status: 'IN_PROGRESS',
      exercises: [],
    };
    component.workout.set(workoutWithNumber);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metaText = compiled.querySelector<HTMLElement>('.workout-meta');
    expect(metaText?.textContent).toContain('Workout Number: #15');
    expect(metaText?.textContent).not.toContain('Workout ID:');
  });

  it('should fallback to id for Workout Number when workoutNumber is undefined', () => {
    const workoutWithoutNumber: Workout = {
      id: 88,
      title: 'Trening #88',
      status: 'IN_PROGRESS',
      exercises: [],
    };
    component.workout.set(workoutWithoutNumber);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const metaText = compiled.querySelector<HTMLElement>('.workout-meta');
    expect(metaText?.textContent).toContain('Workout Number: #88');
  });

  describe('Delete Workout', () => {
    it('should render Delete Training button next to Edit Training in workout-actions-footer', () => {
      const completedWorkout: Workout = {
        id: 77,
        workoutNumber: 7,
        title: 'Push Day',
        status: 'COMPLETED',
        exercises: [],
      };
      component.workout.set(completedWorkout);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const footer = compiled.querySelector('.workout-actions-footer');
      expect(footer).toBeTruthy();

      const editBtn = footer?.querySelector<HTMLButtonElement>('.btn-edit-training');
      const deleteBtn = footer?.querySelector<HTMLButtonElement>('.btn-delete-training');

      expect(editBtn).toBeTruthy();
      expect(deleteBtn).toBeTruthy();
      expect(deleteBtn?.textContent).toContain('Delete Training');
    });

    it('should render Delete Training button next to Complete Training for in-progress workout', () => {
      const activeWorkout: Workout = {
        id: 78,
        title: 'Pull Day',
        status: 'IN_PROGRESS',
        exercises: [],
      };
      component.workout.set(activeWorkout);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const footer = compiled.querySelector('.workout-actions-footer');
      expect(footer).toBeTruthy();

      const completeBtn = footer?.querySelector<HTMLButtonElement>('.btn-complete-training');
      const deleteBtn = footer?.querySelector<HTMLButtonElement>('.btn-delete-training');

      expect(completeBtn).toBeTruthy();
      expect(deleteBtn).toBeTruthy();
    });

    it('should open delete confirmation modal when clicking Delete Training button and close on Cancel', () => {
      const workoutService = TestBed.inject(WorkoutService);
      const deleteSpy = vi.spyOn(workoutService, 'deleteWorkout');
      const workout: Workout = {
        id: 99,
        workoutNumber: 9,
        title: 'Leg Day',
        status: 'COMPLETED',
        exercises: [],
      };
      component.workout.set(workout);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.modal-dialog')).toBeNull();

      const deleteBtn = compiled.querySelector<HTMLButtonElement>('.btn-delete-training');
      deleteBtn?.click();
      fixture.detectChanges();

      const modal = compiled.querySelector<HTMLElement>('.modal-dialog');
      expect(modal).toBeTruthy();
      expect(modal?.textContent).toContain('Delete Workout');
      expect(modal?.textContent).toContain('Are you sure you want to delete Leg Day?');
      expect(modal?.textContent).toContain('This action cannot be undone.');

      const cancelBtn = modal?.querySelector<HTMLButtonElement>('.btn-modal-cancel');
      cancelBtn?.click();
      fixture.detectChanges();

      expect(compiled.querySelector('.modal-dialog')).toBeNull();
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('should call workoutService.deleteWorkout and navigate to /workouts when confirming delete', () => {
      const workoutService = TestBed.inject(WorkoutService);
      const router = TestBed.inject(Router);
      const deleteSpy = vi.spyOn(workoutService, 'deleteWorkout').mockReturnValue(of(true));
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      const workout: Workout = {
        id: 105,
        title: 'Full Body',
        status: 'COMPLETED',
        exercises: [],
      };
      component.workout.set(workout);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const deleteBtn = compiled.querySelector<HTMLButtonElement>('.btn-delete-training');
      deleteBtn?.click();
      fixture.detectChanges();

      const modal = compiled.querySelector<HTMLElement>('.modal-dialog');
      const confirmBtn = modal?.querySelector<HTMLButtonElement>('.btn-modal-delete');
      confirmBtn?.click();
      fixture.detectChanges();

      expect(deleteSpy).toHaveBeenCalledWith(105);
      expect(navigateSpy).toHaveBeenCalledWith(['/workouts']);
      expect(component.isDeletingWorkout()).toBe(false);
    });

    it('should set errorMessage if deleteWorkout fails', () => {
      const workoutService = TestBed.inject(WorkoutService);
      vi.spyOn(workoutService, 'deleteWorkout').mockReturnValue(throwError(() => new Error('Delete failed')));

      const workout: Workout = {
        id: 106,
        title: 'Full Body',
        status: 'COMPLETED',
        exercises: [],
      };
      component.workout.set(workout);
      component.confirmDeleteWorkout();

      expect(component.isDeletingWorkout()).toBe(false);
      expect(component.errorMessage()).toBe('Failed to delete workout. Please try again.');
    });
  });

  describe('Timed and cardio exercises', () => {
    const plankExercise = {
      orderIndex: 1,
      exercise: { id: 58, name: 'front plank', isSystem: true, trackingType: 'DURATION' as const },
      sets: [],
    };
    const runExercise = {
      orderIndex: 1,
      exercise: { id: 60, name: 'run', isSystem: true, trackingType: 'DISTANCE_DURATION' as const },
      sets: [],
    };
    const benchExercise = {
      orderIndex: 1,
      exercise: { id: 1, name: 'barbell bench press', isSystem: true },
      sets: [],
    };

    it('should show only the time column for a timed exercise', () => {
      expect(component.tracksDuration(plankExercise)).toBe(true);
      expect(component.tracksWeight(plankExercise)).toBe(false);
      expect(component.tracksReps(plankExercise)).toBe(false);
      expect(component.tracksDistance(plankExercise)).toBe(false);
    });

    it('should show distance and time for a cardio exercise', () => {
      expect(component.tracksDistance(runExercise)).toBe(true);
      expect(component.tracksDuration(runExercise)).toBe(true);
      expect(component.tracksWeight(runExercise)).toBe(false);
    });

    it('should fall back to weight x reps when the exercise has no tracking type', () => {
      expect(component.trackingTypeOf(benchExercise)).toBe('WEIGHT_REPS');
      expect(component.tracksWeight(benchExercise)).toBe(true);
      expect(component.tracksReps(benchExercise)).toBe(true);
      expect(component.tracksDuration(benchExercise)).toBe(false);
    });

    it('should format a duration as a clock value', () => {
      expect(component.formatSetDuration(45)).toBe('0:45');
      expect(component.formatSetDuration(90)).toBe('1:30');
      expect(component.formatSetDuration(3725)).toBe('1:02:05');
      expect(component.formatSetDuration(null)).toBe('\u2014');
    });

    it('should accept both plain seconds and clock notation on input', () => {
      expect(component.parseDurationInput('90')).toBe(90);
      expect(component.parseDurationInput('1:30')).toBe(90);
      expect(component.parseDurationInput('1:02:05')).toBe(3725);
      expect(component.parseDurationInput('')).toBeNull();
      expect(component.parseDurationInput('abc')).toBeNull();
    });

    it('should save a duration without touching weight or reps', () => {
      const workoutService = TestBed.inject(WorkoutService);
      const set = { id: 301, setNumber: 1, weightKg: 0, reps: 0, isCompleted: false };
      component.workout.set({
        id: 1,
        title: 'Core',
        exercises: [{ ...plankExercise, sets: [{ ...set }] }],
      });

      const saveSetSpy = vi
        .spyOn(workoutService, 'saveSet')
        .mockReturnValue(of({ ...set, durationSeconds: 90 }));

      component.startEdit(set, 'duration');
      component.saveDuration(set, '1:30');

      expect(saveSetSpy).toHaveBeenCalledWith({
        id: 301,
        durationSeconds: 90,
        status: false,
      });
      expect(component.workout()?.exercises?.[0].sets?.[0].durationSeconds).toBe(90);
    });

    it('should show the previous time instead of kilos for a timed exercise', () => {
      const set = {
        id: 302,
        setNumber: 1,
        weightKg: 0,
        reps: 0,
        isCompleted: false,
        prevDurationSeconds: 75,
      };
      expect(component.formatPrevious(set, plankExercise)).toBe('1:15');
    });

    it('should show distance and time as the previous value for cardio', () => {
      const set = {
        id: 303,
        setNumber: 1,
        weightKg: 0,
        reps: 0,
        isCompleted: false,
        prevDurationSeconds: 1800,
        prevDistanceMeters: 5000,
      };
      expect(component.formatPrevious(set, runExercise)).toBe('5.00 km / 30:00');
    });
  });

  describe('Set counter for timed exercises', () => {
    const plankExercise = {
      orderIndex: 1,
      exercise: { id: 58, name: 'front plank', isSystem: true, trackingType: 'DURATION' as const },
      sets: [],
    };

    /** A set created from a past workout: the last time is copied into durationSeconds. */
    const carriedOverSet = () => ({
      id: 401,
      setNumber: 1,
      weightKg: 0,
      reps: 0,
      isCompleted: false,
      durationSeconds: 75,
      prevDurationSeconds: 75,
    });

    function setUpWorkout(set: ReturnType<typeof carriedOverSet>): void {
      component.workout.set({
        id: 400,
        title: 'Core',
        status: 'IN_PROGRESS',
        exercises: [{ ...plankExercise, sets: [set] }],
      });
    }

    it('should not show the time carried over from the previous workout', () => {
      const set = carriedOverSet();
      setUpWorkout(set);

      expect(component.hasOwnDuration(set)).toBe(false);
      expect(component.displaySetDuration(set)).toBe('0:00');
      expect(component.durationInputValue(set)).toBe('');
      // The last time is still available in the Previous column.
      expect(component.formatPrevious(set, plankExercise)).toBe('1:15');
    });

    it('should show a time that was recorded in this workout', () => {
      const set = { ...carriedOverSet(), durationSeconds: 95 };
      setUpWorkout(set);

      expect(component.hasOwnDuration(set)).toBe(true);
      expect(component.displaySetDuration(set)).toBe('1:35');
    });

    it('should count up while the counter runs and save the time when stopped', () => {
      const workoutService = TestBed.inject(WorkoutService);
      const set = carriedOverSet();
      setUpWorkout(set);

      const saveSetSpy = vi
        .spyOn(workoutService, 'saveSet')
        .mockReturnValue(of({ ...set, durationSeconds: 20 }));

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-07T12:00:00Z'));
      try {
        component.toggleTimer(set);
        expect(component.isTimerRunning(set)).toBe(true);
        component.currentTime.set(new Date('2026-09-07T12:00:00Z'));
        expect(component.displaySetDuration(set)).toBe('0:00');

        vi.setSystemTime(new Date('2026-09-07T12:00:20Z'));
        component.currentTime.set(new Date('2026-09-07T12:00:20Z'));
        expect(component.displaySetDuration(set)).toBe('0:20');

        component.toggleTimer(set);
      } finally {
        vi.useRealTimers();
      }

      expect(component.isTimerRunning(set)).toBe(false);
      expect(saveSetSpy).toHaveBeenCalledWith({
        id: 401,
        durationSeconds: 20,
        status: false,
      });
      expect(component.displaySetDuration(set)).toBe('0:20');
    });

    it('should reset the counter back to zero', () => {
      const workoutService = TestBed.inject(WorkoutService);
      const set = { ...carriedOverSet(), durationSeconds: 42 };
      setUpWorkout(set);

      const saveSetSpy = vi
        .spyOn(workoutService, 'saveSet')
        .mockReturnValue(of({ ...set, durationSeconds: 0 }));

      expect(component.canResetTimer(set)).toBe(true);
      component.resetTimer(set);

      expect(saveSetSpy).toHaveBeenCalledWith({
        id: 401,
        durationSeconds: 0,
        status: false,
      });
      expect(component.displaySetDuration(set)).toBe('0:00');
    });

    it('should render the counter button in the time column', () => {
      setUpWorkout(carriedOverSet());
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector<HTMLButtonElement>('.col-duration .btn-timer')).toBeTruthy();
      expect(
        compiled.querySelector<HTMLElement>('.col-duration .cell-val')?.textContent?.trim()
      ).toBe('0:00');
    });
  });

  describe('Exercise icons in workout detail', () => {
    it('should render exercise image icon when gifUrl or iconUrl is present', () => {
      const workoutWithImages: Workout = {
        id: 200,
        title: 'Workout with Images',
        exercises: [
          {
            id: 1,
            orderIndex: 1,
            exercise: {
              id: 10,
              name: 'Bench Press',
              gifUrl: 'https://example.com/bench.gif',
              isSystem: true,
            },
            sets: [],
          },
          {
            id: 2,
            orderIndex: 2,
            exercise: {
              id: 20,
              name: 'Squat',
              iconUrl: 'https://example.com/squat.png',
              isSystem: true,
            },
            sets: [],
          },
        ],
      };

      component.workout.set(workoutWithImages);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const iconImgs = compiled.querySelectorAll<HTMLImageElement>('.exercise-icon-img');
      expect(iconImgs.length).toBe(2);
      expect(iconImgs[0].src).toBe('https://example.com/bench.gif');
      expect(iconImgs[0].alt).toBe('Bench Press');
      expect(iconImgs[1].src).toBe('https://example.com/squat.png');
      expect(iconImgs[1].alt).toBe('Squat');
    });

    it('should render placeholder icon when exercise has no gifUrl or iconUrl', () => {
      const workoutWithoutImages: Workout = {
        id: 201,
        title: 'Workout without Images',
        exercises: [
          {
            id: 1,
            orderIndex: 1,
            exercise: {
              id: 30,
              name: 'Custom Pushup',
              isSystem: false,
            },
            sets: [],
          },
        ],
      };

      component.workout.set(workoutWithoutImages);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.exercise-icon-img')).toBeNull();
      const placeholder = compiled.querySelector<HTMLElement>('.exercise-icon-placeholder');
      expect(placeholder).toBeTruthy();
      expect(placeholder?.textContent).toContain('🏋️');
    });

    it('should link exercise icon to exercise detail page', () => {
      const workout: Workout = {
        id: 202,
        title: 'Workout Link Test',
        exercises: [
          {
            id: 1,
            orderIndex: 1,
            exercise: {
              id: 45,
              name: 'Deadlift',
              gifUrl: 'https://example.com/deadlift.gif',
              isSystem: true,
            },
            sets: [],
          },
        ],
      };

      component.workout.set(workout);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const iconLink = compiled.querySelector<HTMLAnchorElement>('.exercise-icon-link');
      expect(iconLink).toBeTruthy();
      expect(iconLink?.title).toContain('Deadlift');
    });
  });
});



