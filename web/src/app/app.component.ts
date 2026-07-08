import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiService } from './core/api.service';
import { Denom, DenomService } from './core/denom.service';
import { Summary } from './core/models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  readonly denoms: Denom[] = ['exalted', 'chaos', 'divine'];
  summary = signal<Summary | null>(null);

  constructor(
    public denom: DenomService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.api.getSummary().subscribe((s) => {
      this.summary.set(s);
      this.denom.setRates({
        chaosPerDivine: s.chaosPerDivine,
        exaltedPerDivine: (s as Summary & { exaltedPerDivine?: number }).exaltedPerDivine ?? null
      });
    });
  }

  label(d: Denom): string {
    return d === 'exalted' ? 'Exalted' : d === 'chaos' ? 'Chaos' : 'Divine';
  }
}
