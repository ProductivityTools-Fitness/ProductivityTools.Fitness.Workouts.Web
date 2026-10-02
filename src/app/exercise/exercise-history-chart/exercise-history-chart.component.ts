import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';

/** One workout on the chart: when it happened and the value to plot (e.g. best weight). */
export interface HistoryPoint {
  date: Date;
  value: number;
  /** Human readable value, e.g. "82.5 kg × 5" or "1:30". Used in tooltips and the best badge. */
  label: string;
  /** Compact value printed above the point on the chart, e.g. "82.5" or "1:30". */
  shortLabel: string;
  /** Tooltip detail, e.g. all sets of that workout. */
  detail?: string;
  workoutId?: number;
}

interface PlottedPoint extends HistoryPoint {
  x: number;
  y: number;
  isBest: boolean;
  /** Whether the value is printed above the point (thinned out when there are many points). */
  showLabel: boolean;
}

/**
 * Dependency-free line chart drawn with inline SVG. Shows how the best result of an exercise
 * changed over the last workouts; the best value overall is highlighted.
 */
@Component({
  selector: 'app-exercise-history-chart',
  imports: [DatePipe],
  templateUrl: './exercise-history-chart.component.html',
  styleUrl: './exercise-history-chart.component.css',
})
export class ExerciseHistoryChartComponent {
  /** Points in chronological order (oldest first). */
  points = input.required<HistoryPoint[]>();
  /** Axis unit shown next to the Y labels, e.g. "kg", "s", "reps". */
  unit = input<string>('');

  /** Matches the width of the media column so 1 SVG unit ≈ 1 CSS px and text stays legible. */
  readonly width = 340;
  readonly height = 250;
  readonly padding = { top: 30, right: 14, bottom: 36, left: 44 };

  private readonly plotWidth = this.width - this.padding.left - this.padding.right;
  private readonly plotHeight = this.height - this.padding.top - this.padding.bottom;

  /** Y-axis range, with a little headroom so the top point does not touch the edge. */
  readonly range = computed(() => {
    const values = this.points().map((p) => p.value);
    if (values.length === 0) {
      return { min: 0, max: 1 };
    }
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    if (rawMax === rawMin) {
      const pad = rawMax === 0 ? 1 : Math.abs(rawMax) * 0.15;
      return { min: Math.max(0, rawMin - pad), max: rawMax + pad };
    }
    const pad = (rawMax - rawMin) * 0.15;
    return { min: Math.max(0, rawMin - pad), max: rawMax + pad };
  });

  readonly plotted = computed<PlottedPoint[]>(() => {
    const pts = this.points();
    const { min, max } = this.range();
    const best = pts.length ? Math.max(...pts.map((p) => p.value)) : null;
    const n = pts.length;
    // With many points the value labels would overlap, so only every k-th one is printed
    // (the best and the latest are always printed).
    const labelStep = n <= 6 ? 1 : Math.ceil(n / 6);
    return pts.map((p, i) => {
      const x = n === 1
        ? this.padding.left + this.plotWidth / 2
        : this.padding.left + (i / (n - 1)) * this.plotWidth;
      const y = this.padding.top + (1 - (p.value - min) / (max - min)) * this.plotHeight;
      const isBest = p.value === best;
      const showLabel = isBest || i === n - 1 || i % labelStep === 0;
      return { ...p, x, y, isBest, showLabel };
    });
  });

  readonly linePath = computed(() => {
    const pts = this.plotted();
    if (pts.length < 2) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  });

  /** Closed shape under the line, for the soft fill. */
  readonly areaPath = computed(() => {
    const pts = this.plotted();
    if (pts.length < 2) return '';
    const baseline = this.padding.top + this.plotHeight;
    const first = pts[0];
    const last = pts[pts.length - 1];
    return `${this.linePath()} L${last.x.toFixed(1)},${baseline} L${first.x.toFixed(1)},${baseline} Z`;
  });

  /** Horizontal guide lines with their labels. */
  readonly yTicks = computed(() => {
    const { min, max } = this.range();
    const steps = 3;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const value = min + ((max - min) * i) / steps;
      const y = this.padding.top + (1 - i / steps) * this.plotHeight;
      return { y, label: this.formatTick(value) };
    });
  });

  /** Date labels only for a handful of points so they do not overlap. */
  readonly xTicks = computed(() => {
    const pts = this.plotted();
    if (pts.length === 0) return [];
    const maxLabels = 4;
    if (pts.length <= maxLabels) return pts;
    const step = Math.ceil((pts.length - 1) / (maxLabels - 1));
    return pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
  });

  readonly baselineY = this.padding.top + this.plotHeight;

  private formatTick(value: number): string {
    if (this.unit() === 's') {
      const total = Math.round(value);
      const m = Math.floor(total / 60);
      const s = total % 60;
      return `${m}:${String(s).padStart(2, '0')}`;
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
}
