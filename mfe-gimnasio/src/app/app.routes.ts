import { Routes } from '@angular/router';
import { GimnasioDashboardComponent } from './features/gimnasio-dashboard/gimnasio-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: GimnasioDashboardComponent,
  },
  {
    path: 'gimnasio',
    component: GimnasioDashboardComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
