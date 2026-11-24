import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogService } from './catalog.service';
import { CatalogSearchResult } from './models/catalog-search-result';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../notification/notification.service';

@Component({
  selector: 'app-catalog',
  imports: [FormsModule],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.css',
})
export class CatalogComponent {
  private readonly catalogService = inject(CatalogService);
  private readonly notificationService = inject(NotificationService);
  readonly authService = inject(AuthService);

  searchQuery = '';
  searchResults = signal<CatalogSearchResult[]>([]);
  isLoading = signal<boolean>(false);
  isSyncingAll = signal<boolean>(false);
  hasSearched = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  importingIds = signal<Set<string>>(new Set());
  reimportingIds = signal<Set<string>>(new Set());
  expandedInstructions = signal<Set<string>>(new Set());

  onSearch(): void {
    this.isLoading.set(true);
    this.hasSearched.set(true);
    this.errorMessage.set(null);

    this.catalogService.searchExercises(this.searchQuery).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error searching the exercise catalogue:', err);
        this.errorMessage.set('Failed to search exercises. Please check your connection and try again.');
        this.isLoading.set(false);
      },
    });
  }

  imageUrl(item: CatalogSearchResult): string {
    return this.catalogService.previewImageUrl(item.catalogExerciseId);
  }

  importExercise(item: CatalogSearchResult): void {
    if (item.isAlreadyImported || this.importingIds().has(item.catalogExerciseId)) {
      return;
    }

    this.importingIds.update((ids) => {
      const next = new Set(ids);
      next.add(item.catalogExerciseId);
      return next;
    });

    this.catalogService.importExercise(item.catalogExerciseId).subscribe({
      next: (imported) => {
        this.searchResults.update((results) =>
          results.map((r) =>
            r.catalogExerciseId === item.catalogExerciseId
              ? { ...r, isAlreadyImported: true, localExerciseId: imported.id }
              : r,
          ),
        );
        this.importingIds.update((ids) => {
          const next = new Set(ids);
          next.delete(item.catalogExerciseId);
          return next;
        });
      },
      error: (err) => {
        console.error('Error importing exercise:', err);
        alert('Failed to import exercise. Please try again.');
        this.importingIds.update((ids) => {
          const next = new Set(ids);
          next.delete(item.catalogExerciseId);
          return next;
        });
      },
    });
  }

  reimportExercise(item: CatalogSearchResult): void {
    if (this.reimportingIds().has(item.catalogExerciseId)) {
      return;
    }

    this.reimportingIds.update((ids) => {
      const next = new Set(ids);
      next.add(item.catalogExerciseId);
      return next;
    });

    this.catalogService.reimportExercise(item.catalogExerciseId).subscribe({
      next: () => {
        this.reimportingIds.update((ids) => {
          const next = new Set(ids);
          next.delete(item.catalogExerciseId);
          return next;
        });
        this.notificationService.showSuccess(`Zaktualizowano "${item.name}" z katalogu.`);
      },
      error: (err) => {
        console.error('Error re-importing exercise:', err);
        this.reimportingIds.update((ids) => {
          const next = new Set(ids);
          next.delete(item.catalogExerciseId);
          return next;
        });
        this.notificationService.showError('Nie udało się odświeżyć ćwiczenia z katalogu.');
      },
    });
  }

  reimportAll(): void {
    if (this.isSyncingAll()) {
      return;
    }
    this.isSyncingAll.set(true);
    this.catalogService.reimportAllExercises().subscribe({
      next: (res) => {
        this.isSyncingAll.set(false);
        const msg =
          res.failed > 0
            ? `Zaktualizowano ${res.updated} ćwiczeń (błędów: ${res.failed}).`
            : `Zaktualizowano ${res.updated} ćwiczeń z katalogu.`;
        this.notificationService.showSuccess(msg);
      },
      error: (err) => {
        console.error('Error re-importing all exercises:', err);
        this.isSyncingAll.set(false);
        this.notificationService.showError('Nie udało się zsynchronizować ćwiczeń z katalogu.');
      },
    });
  }

  toggleInstructions(catalogExerciseId: string): void {
    this.expandedInstructions.update((set) => {
      const next = new Set(set);
      if (next.has(catalogExerciseId)) {
        next.delete(catalogExerciseId);
      } else {
        next.add(catalogExerciseId);
      }
      return next;
    });
  }
}
