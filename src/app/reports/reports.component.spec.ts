import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ReportsComponent } from './reports.component';
import { ReportService } from './report.service';
import { TrainingReport } from './models/training-report';

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;

  const sampleReport: TrainingReport = {
    days: 90,
    fromDate: '2026-08-28T00:00:00Z',
    toDate: '2026-11-26T00:00:00Z',
    summary: {
      totalWorkouts: 24,
      workoutsPerWeek: 1.9,
      totalCompletedSets: 320,
      totalVolumeKg: 142500,
      averageDurationMinutes: 58,
    },
    muscleVolume: [
      {
        muscle: 'pectorals',
        bodyCategory: 'chest',
        totalSets: 64,
        setsPerWeek: 5.0,
        totalVolumeKg: 35000,
        daysSinceLastTrained: 2,
      },
    ],
    exerciseProgress: [
      {
        exerciseId: 10,
        name: 'bench press',
        targetMuscle: 'pectorals',
        equipmentCategory: 'barbell',
        trackingType: 'WEIGHT_REPS',
        sessions: 12,
        bestWeightKg: 90,
        bestReps: 8,
        bestEstimated1RmKg: 114,
        latestWeightKg: 90,
        latestReps: 8,
        latestEstimated1RmKg: 114,
        bestDurationSeconds: null,
        latestDurationSeconds: null,
        trend: 'PROGRESSING',
        lastTrainedAt: '2026-11-24T10:00:00Z',
      },
    ],
    recentWorkouts: [],
    aiMarkdown: '# Raport treningowy\n- bench press: 90kg×8',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ReportService,
          useValue: { getTrainingReport: vi.fn().mockReturnValue(of(sampleReport)) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should render KPI summary, translated muscle volume, and exercise progression', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('24');
    expect(el.textContent).toContain('pectorals (klatka piersiowa)');
    expect(el.textContent).toContain('bench press');
    expect(el.textContent).toContain('↗ Progres');
    expect(component.fullAiPrompt()).toContain('# Raport treningowy');
  });
});
