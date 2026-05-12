import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Footer } from './footer';
import { LanguageSwitcher } from './language-switcher';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Footer, LanguageSwitcher, TranslatePipe],
  template: `
    <div class="shell-container">
      <nav class="sidebar" [class.sidebar-hidden]="!isSidebarOpen()">
        
        <div class="sidebar-header">
          <div class="logo-container">
            <img src="/imagenes/logo_infratrack-sinfondo.png" alt="InfraTrack Logo" class="logo-img" />
            <div class="logo-text">
              <span class="brand">INFRATRACK</span>
            </div>
          </div>
        </div>
        
        <div class="sidebar-scrollable">
          <ul class="nav-links">
            <li class="nav-section">INICIO</li>
            <li>
              <a routerLink="/control-panel" routerLinkActive="active" class="nav-item">
                <span class="material-icons-outlined">grid_view</span>
                <span class="nav-text">{{ 'nav.controlPanel' | translate }}</span>
              </a>
            </li>
            
            <li class="nav-section">OPERACIONES</li>
            <li>
              <a routerLink="/asset-management" routerLinkActive="active" class="nav-item">
                <span class="material-icons-outlined">precision_manufacturing</span>
                <span class="nav-text">{{ 'nav.assetManagement' | translate }}</span>
              </a>
            </li>
            <li>
              <a routerLink="/telemetry" routerLinkActive="active" class="nav-item">
                <span class="material-icons-outlined">satellite_alt</span>
                <span class="nav-text">{{ 'nav.telemetry' | translate }}</span>
              </a>
            </li>

            <li class="nav-section">ANÁLISIS</li>
            <li>
              <a routerLink="/reports-analytics" routerLinkActive="active" class="nav-item">
                <span class="material-icons-outlined">bar_chart</span>
                <span class="nav-text">{{ 'nav.reportsAnalytics' | translate }}</span>
              </a>
            </li>
            <li>
              <a routerLink="/performance" routerLinkActive="active" class="nav-item">
                <span class="material-icons-outlined">bolt</span>
                <span class="nav-text">{{ 'nav.performance' | translate }}</span>
              </a>
            </li>

            <li class="nav-section">SISTEMA</li>
            <li>
              <a routerLink="/configuration" routerLinkActive="active" class="nav-item">
                <span class="material-icons-outlined">settings</span>
                <span class="nav-text">{{ 'nav.configuration' | translate }}</span>
              </a>
            </li>
          </ul>
        </div>

        <div class="sidebar-footer">
          <!-- Footers can be empty or have a small text if needed -->
        </div>

      </nav>
      
      <div class="main-wrapper" [class.expanded]="!isSidebarOpen()">
        <header class="topbar">
          <div class="topbar-left">
            <button class="menu-btn" (click)="toggleSidebar()" aria-label="Toggle Sidebar">
              <span class="material-icons-outlined">menu_open</span>
            </button>
            <span class="greeting">{{ 'common.welcome' | translate }}</span>
          </div>
          <div class="topbar-right">
            <a routerLink="/profile" class="header-profile-link" title="Mi perfil">
              <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" class="header-avatar" />
            </a>
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
      background-color: #FFFFFF; 
      display: flex;
      flex-direction: column;
      border-right: 1px solid #E2E8F0;
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
        box-shadow: 4px 0 25px rgba(0,0,0,0.1);
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
    }

    .logo-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .brand {
      font-weight: 800;
      font-size: 1.15rem;
      color: #0F172A;
      letter-spacing: -0.3px;
    }

    .sidebar-scrollable {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 1rem;
    }

    /* Custom Scrollbar for sidebar */
    .sidebar-scrollable::-webkit-scrollbar {
      width: 4px;
    }
    .sidebar-scrollable::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 4px;
    }

    .nav-links { 
      list-style: none; 
      padding: 0; 
      margin: 0;
    }

    .nav-section {
      font-size: 0.65rem;
      font-weight: 700;
      color: #94A3B8;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      margin: 1.5rem 0 0.5rem 0.75rem;
    }

    .nav-links li:not(.nav-section) { 
      margin-bottom: 0.25rem; 
    }

    .nav-item { 
      display: flex;
      align-items: center;
      gap: 14px;
      color: #64748B; 
      text-decoration: none; 
      padding: 10px 14px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      white-space: nowrap;
      outline: none;
    }

    .nav-item .material-icons-outlined {
      font-size: 20px;
      color: #94A3B8;
      transition: color 0.2s ease;
    }

    .nav-item:hover { 
      background-color: #F1F5F9; 
      color: #0F172A;
    }
    .nav-item:hover .material-icons-outlined {
      color: #64748B;
    }

    /* Active State - Enterprise modern */
    .nav-item.active { 
      background-color: #FEF3C7; /* Very soft yellow */
      color: #B45309; /* Deep amber/brown for premium contrast */
      font-weight: 600;
    }

    .nav-item.active .material-icons-outlined {
      color: #D97706; /* Vibrant amber for icon */
    }

    /* Focus fix for that ugly black border */
    .nav-item:focus-visible {
      box-shadow: 0 0 0 2px #FCD34D;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid #F1F5F9;
      flex-shrink: 0;
    }

    /* Enterprise Avatar in Header */
    .header-profile-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background-color: #E2E8F0;
      text-decoration: none;
      transition: box-shadow 0.2s ease, transform 0.2s ease;
      cursor: pointer;
    }

    .header-profile-link:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      transform: translateY(-1px);
    }

    .header-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #FFFFFF;
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

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }
}
