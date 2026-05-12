import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Footer } from './footer';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Footer],
  template: `
    <div class="shell-container">
      <nav class="sidebar">
        <div class="logo">InfraTrack</div>
        <ul>
          <li><a routerLink="/control-panel" routerLinkActive="active">Panel de Control</a></li>
          <li><a routerLink="/asset-management" routerLinkActive="active">Maquinaria</a></li>
          <li><a routerLink="/telemetry" routerLinkActive="active">Telemetría</a></li>
          <li><a routerLink="/reports-analytics" routerLinkActive="active">Reportes</a></li>
          <li><a routerLink="/performance" routerLinkActive="active">Desempeño</a></li>
          <li><a routerLink="/configuration" routerLinkActive="active">Configuración</a></li>
        </ul>
      </nav>
      <main class="content">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .shell-container { display: flex; flex-direction: column; height: 100vh; }
    .sidebar { width: 250px; background: #2c3e50; color: white; padding: 1rem; }
    .content { flex: 1; padding: 2rem; overflow-y: auto; }
    ul { list-style: none; padding: 0; }
    li { margin: 1rem 0; }
    a { color: white; text-decoration: none; }
    .active { font-weight: bold; color: #3498db; }
  `]
})
export class ShellLayout {}
