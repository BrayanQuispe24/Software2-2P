import { Routes } from '@angular/router';
import { EntrenamientoDashboardComponent } from './features/entrenamiento-dashboard/entrenamiento-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: EntrenamientoDashboardComponent,
  },
  {
    path: 'instructores',
    component: EntrenamientoDashboardComponent,
  },
  {
    path: 'entrenamiento',
    component: EntrenamientoDashboardComponent,
  },
  {
    path: '**',
    component: EntrenamientoDashboardComponent,
  },
];
