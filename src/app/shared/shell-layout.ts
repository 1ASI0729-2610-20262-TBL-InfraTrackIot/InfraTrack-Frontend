import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Footer } from './footer';
import { LanguageSwitcher } from './language-switcher';
import { TranslatePipe } from '@ngx-translate/core';
import { IamService } from '../iam/application/iam.service';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Footer, LanguageSwitcher, TranslatePipe],
  template: `
    <div class="shell-container">
      <nav class="sidebar" [class.sidebar-hidden]="!isSidebarOpen()">
        
        <div class="sidebar-header">
          <div class="logo-container">
            <img src="/imagenes/logo_infratrack-sinfondo.png" [attr.alt]="'app.title' | translate" class="logo-img" />
            <div class="logo-text">
              <span class="brand">INFRATRACK</span>
            </div>
          </div>
        </div>
        
        <div class="sidebar-scrollable">
          <ul class="nav-links">
            <!-- Título basado en la imagen -->
            <li class="nav-section">{{ 'shell.navSection' | translate }}</li>
            
            <!-- Rutas compartidas (Dashboard, Mapa GPS, Maquinaria) -->
            <li>
              <a routerLink="/control-panel" routerLinkActive="active" class="nav-item">
                <span class="nav-dot dot-blue"></span>
                <span class="nav-text">{{ 'nav.controlPanel' | translate }}</span>
              </a>
            </li>
            
            <li>
              <a routerLink="/telemetry" routerLinkActive="active" class="nav-item">
                <span class="nav-dot dot-blue"></span>
                <span class="nav-text">{{ 'nav.telemetry' | translate }}</span>
              </a>
            </li>

            <li>
              <a routerLink="/asset-management" routerLinkActive="active" class="nav-item">
                <span class="nav-dot dot-green"></span>
                <span class="nav-text">{{ 'nav.assetManagement' | translate }}</span>
              </a>
            </li>

            <!-- Rutas exclusivas de Owner -->
            @if (role() === 'owner') {
              <li>
                <a routerLink="/reports-analytics" routerLinkActive="active" class="nav-item">
                  <span class="nav-dot dot-orange"></span>
                  <span class="nav-text">{{ 'nav.reportsAnalytics' | translate }}</span>
                </a>
              </li>
              <li>
                <a routerLink="/configuration" routerLinkActive="active" class="nav-item">
                  <span class="nav-dot dot-purple"></span>
                  <span class="nav-text">{{ 'shell.ownerSubscription' | translate }}</span>
                </a>
              </li>
            }

            <!-- Rutas exclusivas de Admin -->
            @if (role() === 'admin') {
              <li>
                <a routerLink="/reports-analytics" routerLinkActive="active" class="nav-item">
                  <span class="nav-dot dot-red"></span>
                  <span class="nav-text">{{ 'shell.adminAlerts' | translate }}</span>
                </a>
              </li>
              <li>
                <a routerLink="/configuration" routerLinkActive="active" class="nav-item">
                  <span class="nav-dot dot-green-teal"></span>
                  <span class="nav-text">{{ 'shell.adminIotNodes' | translate }}</span>
                </a>
              </li>
              <li>
                <a routerLink="/performance" routerLinkActive="active" class="nav-item">
                  <span class="nav-dot dot-orange"></span>
                  <span class="nav-text">{{ 'shell.adminMaintenance' | translate }}</span>
                </a>
              </li>
            }
          </ul>
        </div>

        <div class="sidebar-footer">
          <!-- Perfil / Cerrar sesión (Siempre al final, en el footer de navegación) -->
          <ul class="nav-links">
            <li class="nav-bottom-item">
              <a routerLink="/profile" routerLinkActive="active" class="nav-item">
                <span class="nav-dot dot-grey"></span>
                <span class="nav-text">{{ 'shell.profileLogout' | translate }}</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>
      
      <div class="main-wrapper" [class.expanded]="!isSidebarOpen()">
        <header class="topbar">
          <div class="topbar-left">
            <button class="menu-btn" (click)="toggleSidebar()" [attr.aria-label]="'shell.toggleSidebarAria' | translate">
              <span class="material-icons-outlined">menu_open</span>
            </button>
            <span class="greeting">{{ 'common.welcome' | translate }} {{ iam.username() }}</span>
          </div>
          <div class="topbar-right">
            <!-- Topbar limpio -->
          </div>
        </header>
        <main class="content">
          <div class="content-inner">
            <router-outlet></router-outlet>
          </div>
        </main>
        <app-footer></app-footer>
      </div>
    </div>
    <app-language-switcher></app-language-switcher>
  `,
  styles: [`
    .shell-container { 
      display: flex; 
      height: 100vh; 
      overflow: hidden; 
      background-color: #F8FAFC;
    }

    .sidebar { 
      width: var(--it-sidebar-width, 280px); 
      flex-shrink: 0;
      background-color: #1E1E1E; /* Dark theme sidebar as seen in the prompt */
      display: flex;
      flex-direction: column;
      border-right: 1px solid rgba(255, 255, 255, 0.05);
      z-index: 50;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sidebar.sidebar-hidden {
      width: 0;
      transform: translateX(-100%);
      border-right: none;
      overflow: hidden;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .sidebar {
        position: absolute;
        height: 100%;
        box-shadow: 4px 0 25px rgba(0,0,0,0.5);
      }
      .sidebar.sidebar-hidden {
        width: 0;
      }
    }

    .sidebar-header {
      padding: 1.5rem 1.5rem 1rem 1.5rem;
      flex-shrink: 0;
      white-space: nowrap;
      overflow: hidden;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-img {
      width: 36px;
      height: 36px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .logo-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .brand {
      font-weight: 800;
      font-size: 1.15rem;
      color: #FFFFFF;
      letter-spacing: -0.3px;
    }

    .sidebar-scrollable {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0.5rem 1rem;
    }

    /* Custom Scrollbar for sidebar */
    .sidebar-scrollable::-webkit-scrollbar {
      width: 4px;
    }
    .sidebar-scrollable::-webkit-scrollbar-thumb {
      background: #333;
      border-radius: 4px;
    }

    .nav-links { 
      list-style: none; 
      padding: 0; 
      margin: 0;
      display: flex;
      flex-direction: column;
    }

    .nav-section {
      font-size: 0.65rem;
      font-weight: 700;
      color: #94A3B8;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      margin: 1.5rem 0 1rem 0.75rem;
      white-space: nowrap;
    }

    .nav-links li:not(.nav-section) { 
      margin-bottom: 0.25rem; 
    }

    .sidebar-footer {
      padding: 0.5rem 1rem 1.5rem 1rem;
      border-top: 1px solid rgba(255,255,255,0.05);
    }

    .nav-item { 
      display: flex;
      align-items: center;
      gap: 12px;
      color: #E2E8F0; 
      text-decoration: none; 
      padding: 12px 14px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      white-space: nowrap;
      outline: none;
    }

    .nav-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .dot-blue { background-color: #3B82F6; }
    .dot-green { background-color: #65A30D; }
    .dot-orange { background-color: #D97706; }
    .dot-purple { background-color: #8B5CF6; }
    .dot-red { background-color: #EF4444; }
    .dot-green-teal { background-color: #10B981; }
    .dot-grey { background-color: #94A3B8; }

    .nav-item:hover { 
      background-color: #2D2D2D; 
    }

    /* Active State */
    .nav-item.active { 
      background-color: #2A2A2A; 
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
    }

    .nav-item:focus-visible {
      box-shadow: 0 0 0 2px #3B82F6;
    }

    /* Main wrapper and topbar */
    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    .topbar {
      height: 70px;
      background: #FFFFFF;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2rem;
      border-bottom: 1px solid #E2E8F0;
      z-index: 5;
      flex-shrink: 0;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .menu-btn {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      cursor: pointer;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s;
      color: #64748B;
    }

    .menu-btn:hover {
      background-color: #F1F5F9;
      color: #0F172A;
    }

    .greeting {
      font-weight: 500;
      color: #334155;
      font-size: 0.95rem;
    }

    .content { 
      flex: 1; 
      overflow-y: auto; 
      padding: 2rem; 
      background-color: #F8FAFC;
    }

    .content-inner {
      max-width: 1400px;
      margin: 0 auto;
      background: transparent;
    }
  `]
})
export class ShellLayout {
  readonly isSidebarOpen = signal(true);
  readonly iam = inject(IamService);
  
  // Expose role directly to template
  readonly role = this.iam.role;

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }
}
