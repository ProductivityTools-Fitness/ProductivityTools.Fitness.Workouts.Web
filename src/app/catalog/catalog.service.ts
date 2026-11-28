import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackendConfigService } from '../core/backend-config.service';
import { CatalogSearchResult } from './models/catalog-search-result';
import { Exercise } from '../exercise/models/exercise';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly backendConfig = inject(BackendConfigService);

  private get apiUrl(): string {
    return this.backendConfig.apiUrl();
  }

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
      `${this.apiUrl}/catalog/search`,
      { params },
    );
  }

  importExercise(catalogExerciseId: string): Observable<Exercise> {
    return this.http.post<Exercise>(
      `${this.apiUrl}/catalog/import/${catalogExerciseId}`,
      {},
    );
  }

  reimportExercise(catalogExerciseId: string): Observable<Exercise> {
    return this.http.post<Exercise>(
      `${this.apiUrl}/catalog/reimport/${encodeURIComponent(catalogExerciseId)}`,
      {},
    );
  }

  reimportAllExercises(): Observable<{ updated: number; failed: number }> {
    return this.http.post<{ updated: number; failed: number }>(
      `${this.apiUrl}/catalog/reimport-all`,
      {},
    );
  }

  /**
   * Address of the animation preview for an exercise that has not been imported yet.
   * Served without authentication, because a browser cannot attach headers to an <img> request.
   */
  previewImageUrl(catalogExerciseId: string): string {
    return `${this.apiUrl}/catalog/${catalogExerciseId}/image`;
  }
}
