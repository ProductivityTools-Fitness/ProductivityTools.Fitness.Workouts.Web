import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';
import { Exercise } from './models/exercise';

/**
 * Works out where to fetch an exercise animation from.
 *
 * <p>Exercises imported from Fitness.Catalog.Api keep a local copy of the GIF in the database,
 * served by `/api/exercise/{id}/image`. Older or hand-made exercises may still carry an
 * external `gifUrl` or `iconUrl`, which stays the fallback.
 *
 * <p>Returns null when there is nothing to show, so a template can fall through to a placeholder.
 */
@Pipe({
  name: 'exerciseImage',
})
export class ExerciseImagePipe implements PipeTransform {
  transform(exercise: Exercise | null | undefined): string | null {
    if (!exercise) {
      return null;
    }
    if (exercise.imageFileName && exercise.id) {
      return `${environment.apiUrl}/exercise/${exercise.id}/image`;
    }
    return exercise.gifUrl ?? exercise.iconUrl ?? null;
  }
}
