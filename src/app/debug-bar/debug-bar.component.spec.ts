import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { DebugBarComponent } from './debug-bar.component';
import { BackendConfigService } from '../core/backend-config.service';
import { ConsoleService } from '../console/console.service';

describe('DebugBarComponent', () => {
  let component: DebugBarComponent;
  let fixture: ComponentFixture<DebugBarComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DebugBarComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    const consoleService = TestBed.inject(ConsoleService);
    vi.spyOn(consoleService, 'getServerName').mockReturnValue(of('T460Ubuntu1'));

    fixture = TestBed.createComponent(DebugBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create and display server name', () => {
    expect(component).toBeTruthy();
    expect(component.serverName()).toBe('T460Ubuntu1');
  });

  it('should render backend selector with all options and switch backend on change', () => {
    const backendConfig = TestBed.inject(BackendConfigService);
    const reloadSpy = vi.spyOn(component as unknown as { reloadPage: () => void }, 'reloadPage').mockImplementation(() => {});

    const select = fixture.nativeElement.querySelector('select.env-select') as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(select.options.length).toBe(backendConfig.options.length);

    const ubuntuUrl = 'https://fitness-workouts-api-ubuntu.productivitytools.top/api';
    component.onBackendChange(ubuntuUrl);
    fixture.detectChanges();

    expect(backendConfig.apiUrl()).toBe(ubuntuUrl);
    expect(component.isBackupSelected()).toBe(true);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });
});
