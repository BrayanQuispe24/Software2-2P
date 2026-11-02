import { Routes } from '@angular/router';
import { InventarioDashboardComponent } from './features/inventario-dashboard/inventario-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: InventarioDashboardComponent,
  },
  {
    path: 'inventario',
    component: InventarioDashboardComponent,
  },
  {
    path: '**',
    component: InventarioDashboardComponent,
  },
];
