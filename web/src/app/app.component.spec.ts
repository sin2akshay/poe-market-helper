import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it('should have three denomination options', () => {
    expect(app.denoms).toEqual(['exalted', 'chaos', 'divine']);
  });

  it('should default to exalted and render brand', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand')?.textContent).toContain('PoE2 Economy');
  });

  it('should show navigation links', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('nav a');
    expect(links.length).toBe(5);
    expect(links[0].textContent).toContain('Overview');
    expect(links[1].textContent).toContain('Currency');
    expect(links[4].textContent).toContain('Guide');
  });

  it('label() returns display names', () => {
    expect(app.label('exalted')).toBe('Exalted');
    expect(app.label('chaos')).toBe('Chaos');
    expect(app.label('divine')).toBe('Divine');
  });
});

