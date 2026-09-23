import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CatalogSearchResult } from './models/catalog-search-result';
import { Exercise } from '../exercise/models/exercise';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly http = inject(HttpClient);

  searchExercises(
    name?: string,
    bodyCategory?: string,
    equipmentCategory?: string,
    limit: number = 50,
  ): Observable<CatalogSearchResult[]> {
    let params = new HttpParams().set('limit', limit);
    if (name && name.trim()) {
      params = params.set('name', name.trim());
    }
    if (bodyCategory && bodyCategory.trim()) {
      params = params.set('bodyCategory', bodyCategory.trim());
    }
    if (equipmentCategory && equipmentCategory.trim()) {
      params = params.set('equipmentCategory', equipmentCategory.trim());
    }

    return this.http.get<CatalogSearchResult[]>(
      `${environment.apiUrl}/catalog/search`,
      { params },
    );
  }

  importExercise(catalogExerciseId: string): Observable<Exercise> {
    return this.http.post<Exercise>(
      `${environment.apiUrl}/catalog/import/${catalogExerciseId}`,
      {},
    );
  }

  /**
   * Address of the animation preview for an exercise that has not been imported yet.
   * Served without authentication, because a browser cannot attach headers to an <img> request.
   */
  previewImageUrl(catalogExerciseId: string): string {
    return `${environment.apiUrl}/catalog/${catalogExerciseId}/image`;
  }
}
