import { Component } from '@angular/core';
import { GimnasioDashboardComponent } from './features/gimnasio-dashboard/gimnasio-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GimnasioDashboardComponent],
  template: '<app-gimnasio-dashboard></app-gimnasio-dashboard>',
})
export class App {}
