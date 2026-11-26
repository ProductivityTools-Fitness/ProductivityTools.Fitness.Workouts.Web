import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReportService } from './report.service';
import { ExerciseProgress, ProgressTrend, TrainingReport } from './models/training-report';
import { formatMuscleLabel } from '../exercise/muscle-translations.util';
import { NotificationService } from '../notification/notification.service';

const GOAL_STORAGE_KEY = 'pt_fitness_ai_coach_goal';
const DEFAULT_COACH_GOAL =
  'Jesteś moim osobistym trenerem siłowym. Przeanalizuj poniższy raport z moich treningów:\n' +
  '1. Oceń tygodniową objętość (serie/tydzień) na poszczególne partie mięśniowe i wskaż ewentualne braki lub dysproporcje.\n' +
  '2. Wskaż ćwiczenia, w których mam progres, oraz te ze stagnacją lub spadkiem.\n' +
  '3. Zaproponuj konkretne korekty ciężarów, serii lub doboru ćwiczeń na najbliższe 2 tygodnie.';

@Component({
  selector: 'app-reports',
  imports: [FormsModule, RouterLink],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly notificationService = inject(NotificationService);

  readonly dayOptions = [30, 60, 90, 180, 365];
  readonly formatMuscle = formatMuscleLabel;

  selectedDays = signal<number>(90);
  report = signal<TrainingReport | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  coachPrompt = signal<string>(this.loadSavedGoal());

  readonly maxSetsPerWeek = computed<number>(() => {
    const list = this.report()?.muscleVolume ?? [];
    if (list.length === 0) return 1;
    return Math.max(...list.map((m) => m.setsPerWeek), 1);
  });

  readonly fullAiPrompt = computed<string>(() => {
    const r = this.report();
    if (!r) return '';
    const intro = this.coachPrompt().trim();
    return intro ? `${intro}\n\n---\n\n${r.aiMarkdown}` : r.aiMarkdown;
  });

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.reportService.getTrainingReport(this.selectedDays()).subscribe({
      next: (data) => {
        this.report.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading training report:', err);
        this.errorMessage.set('Nie udało się wygenerować raportu treningowego.');
        this.isLoading.set(false);
      },
    });
  }

  onDaysChange(days: number): void {
    this.selectedDays.set(days);
    this.loadReport();
  }

  onCoachPromptChange(value: string): void {
    this.coachPrompt.set(value);
    try {
      localStorage.setItem(GOAL_STORAGE_KEY, value);
    } catch {
      // ignore storage errors
    }
  }

  async copyPromptWithReport(): Promise<void> {
    const text = this.fullAiPrompt();
    if (!text) return;
    await this.copyToClipboard(text, 'Skopiowano prompt + raport dla AI do schowka!');
  }

  async copyMarkdownOnly(): Promise<void> {
    const text = this.report()?.aiMarkdown;
    if (!text) return;
    await this.copyToClipboard(text, 'Skopiowano raport Markdown do schowka!');
  }

  downloadMarkdown(): void {
    const r = this.report();
    if (!r) return;
    this.triggerDownload(
      r.aiMarkdown,
      `fitness-report-${r.days}d.md`,
      'text/markdown;charset=utf-8',
    );
  }

  downloadJson(): void {
    const r = this.report();
    if (!r) return;
    const { aiMarkdown: _omit, ...structured } = r;
    this.triggerDownload(
      JSON.stringify(structured, null, 2),
      `fitness-report-${r.days}d.json`,
      'application/json;charset=utf-8',
    );
  }

  formatResult(weight: number | null, reps: number | null, durationSec: number | null): string {
    if (weight && weight > 0 && reps && reps > 0) {
      return `${weight} kg × ${reps}`;
    }
    if (durationSec && durationSec > 0) {
      const m = Math.floor(durationSec / 60);
      const s = durationSec % 60;
      return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
    }
    if (reps && reps > 0) {
      return `${reps} powt.`;
    }
    return '—';
  }

  formatDaysAgo(days: number): string {
    if (days <= 0) return 'dzisiaj';
    if (days === 1) return '1 dzień temu';
    return `${days} dni temu`;
  }

  trendLabel(trend: ProgressTrend): string {
    switch (trend) {
      case 'PROGRESSING':
        return '↗ Progres';
      case 'STABLE':
        return '→ Stabilnie';
      case 'REGRESSING':
        return '↘ Spadek';
      default:
        return '— Mało danych';
    }
  }

  barWidthPercent(setsPerWeek: number): number {
    return Math.min(100, Math.round((setsPerWeek / this.maxSetsPerWeek()) * 100));
  }

  private async copyToClipboard(text: string, successMessage: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.notificationService.showSuccess(successMessage);
    } catch {
      this.notificationService.showError('Nie udało się skopiować do schowka. Użyj przycisku pobierania .md.');
    }
  }

  private triggerDownload(content: string, fileName: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  private loadSavedGoal(): string {
    try {
      const saved = localStorage.getItem(GOAL_STORAGE_KEY);
      return saved !== null ? saved : DEFAULT_COACH_GOAL;
    } catch {
      return DEFAULT_COACH_GOAL;
    }
  }
}
