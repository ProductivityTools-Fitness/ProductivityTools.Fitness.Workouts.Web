import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./console/hello/hello.component').then((m) => m.HelloComponent),
  },
  {
    path: 'workouts',
    loadComponent: () =>
      import('./workout/workout-list/workout-list.component').then(
        (m) => m.WorkoutListComponent,
      ),
  },
  {
    path: 'workouts/detail',
    loadComponent: () =>
      import('./workout/workout-detail/workout-detail.component').then(
        (m) => m.WorkoutDetailComponent,
      ),
  },
  {
    path: 'exercises',
    loadComponent: () =>
      import('./exercise/exercise-list/exercise-list.component').then(
        (m) => m.ExerciseListComponent,
      ),
  },
  {
    path: 'exercises/detail',
    loadComponent: () =>
      import('./exercise/exercise-detail/exercise-detail.component').then(
        (m) => m.ExerciseDetailComponent,
      ),
  },
  {
    path: 'catalog',
    loadComponent: () =>
      import('./catalog/catalog.component').then((m) => m.CatalogComponent),
  },
  {
    path: 'hevy-import',
    loadComponent: () =>
      import('./hevy-import/hevy-import.component').then(
        (m) => m.HevyImportComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  { path: '', redirectTo: '/workouts', pathMatch: 'full' },
];

