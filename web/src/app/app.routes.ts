import { Routes } from '@angular/router';
import { OverviewComponent } from './pages/overview/overview.component';
import { CurrencyComponent } from './pages/currency/currency.component';
import { ItemsComponent } from './pages/items/items.component';
import { FlipsComponent } from './pages/flips/flips.component';
import { GuideComponent } from './pages/guide/guide.component';

export const routes: Routes = [
  { path: '', component: OverviewComponent },
  { path: 'currency', component: CurrencyComponent },
  { path: 'items', component: ItemsComponent },
  { path: 'flips', component: FlipsComponent },
  { path: 'guide', component: GuideComponent }
];
