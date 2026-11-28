import { Injectable, computed, signal } from '@angular/core';

export type DebugStatusType = 'idle' | 'pending' | 'success' | 'error' | 'warn' | 'info';

export interface DebugStatusEntry {
  id: number;
  type: DebugStatusType;
  message: string;
  timestamp: Date;
  durationMs?: number;
}

const MAX_HISTORY = 30;

@Injectable({
  providedIn: 'root',
})
export class DebugStatusService {
  private nextId = 1;

  readonly history = signal<DebugStatusEntry[]>([]);
  readonly current = computed<DebugStatusEntry | null>(() => {
    const list = this.history();
    return list.length > 0 ? list[0] : null;
  });

  log(type: DebugStatusType, message: string, durationMs?: number): void {
    const entry: DebugStatusEntry = {
      id: this.nextId++,
      type,
      message,
      timestamp: new Date(),
      durationMs,
    };
    this.history.update((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
  }

  pending(message: string): void {
    this.log('pending', message);
  }

  success(message: string, durationMs?: number): void {
    this.log('success', message, durationMs);
  }

  error(message: string, durationMs?: number): void {
    this.log('error', message, durationMs);
  }

  info(message: string): void {
    this.log('info', message);
  }

  clear(): void {
    this.history.set([]);
  }
}
