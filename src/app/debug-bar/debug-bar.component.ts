import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { BackendConfigService } from '../core/backend-config.service';
import { DebugStatusEntry, DebugStatusService } from '../core/debug-status.service';
import { ConsoleService } from '../console/console.service';

@Component({
  selector: 'app-debug-bar',
  imports: [FormsModule],
  templateUrl: './debug-bar.component.html',
  styleUrl: './debug-bar.component.css',
})
export class DebugBarComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly backendConfig = inject(BackendConfigService);
  readonly debugStatus = inject(DebugStatusService);
  private readonly consoleService = inject(ConsoleService);

  readonly serverName = signal<string | null>(null);
  readonly isCheckingServer = signal<boolean>(false);
  readonly isRefreshingToken = signal<boolean>(false);
  readonly showHistory = signal<boolean>(false);
  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  readonly isBackupSelected = computed<boolean>(() => Boolean(this.backendConfig.selectedOption().isBackup));

  readonly formattedTokenTime = computed<string>(() => {
    const dt = typeof this.authService.tokenRefreshTime === 'function'
      ? this.authService.tokenRefreshTime()
      : null;
    if (!dt) return 'pending...';
    return this.formatDateTime(dt);
  });

  readonly currentStatusText = computed<string>(() => {
    const current = this.debugStatus.current();
    if (!current) {
      return 'Ready';
    }
    return this.formatEntry(current);
  });

  ngOnInit(): void {
    this.checkServerName();
  }

  @HostListener('window:online')
  onOnline(): void {
    this.isOnline.set(true);
    this.debugStatus.info('Network online');
  }

  @HostListener('window:offline')
  onOffline(): void {
    this.isOnline.set(false);
    this.debugStatus.log('warn', 'Network offline');
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.showHistory()) {
      this.showHistory.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.showHistory.set(false);
  }

  onBackendChange(newUrl: string): void {
    const changed = this.backendConfig.selectBackend(newUrl);
    if (changed) {
      this.debugStatus.info(`Switched backend to ${this.backendConfig.selectedOption().label}`);
      this.reloadPage();
    }
  }

  checkServerName(): void {
    if (this.isCheckingServer()) return;
    this.isCheckingServer.set(true);
    this.consoleService.getServerName().subscribe({
      next: (name) => {
        this.serverName.set(name?.trim() || null);
        this.isCheckingServer.set(false);
      },
      error: () => {
        this.serverName.set(null);
        this.isCheckingServer.set(false);
      },
    });
  }

  async refreshToken(): Promise<void> {
    if (this.isRefreshingToken()) return;
    try {
      this.isRefreshingToken.set(true);
      this.debugStatus.info('Forced token refresh requested');
      await this.authService.refreshToken();
      this.debugStatus.success('Token refreshed');
    } catch {
      this.debugStatus.error('Token refresh failed');
    } finally {
      this.isRefreshingToken.set(false);
    }
  }

  toggleHistory(event: Event): void {
    event.stopPropagation();
    this.showHistory.update((v) => !v);
  }

  clearHistory(event: Event): void {
    event.stopPropagation();
    this.debugStatus.clear();
  }

  formatEntry(entry: DebugStatusEntry): string {
    const time = this.formatTime(entry.timestamp);
    const dur = entry.durationMs != null ? ` (${entry.durationMs}ms)` : '';
    return `[${time}] ${entry.message}${dur}`;
  }

  protected reloadPage(): void {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  private formatTime(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  private formatDateTime(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${this.formatTime(d)}`;
  }
}
