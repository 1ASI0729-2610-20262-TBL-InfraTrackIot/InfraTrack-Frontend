import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  template: `
    <div class="floating-lang-switcher">
      <button [class.active]="currentLang === 'es'" (click)="use('es')">ES</button>
      <div class="divider"></div>
      <button [class.active]="currentLang === 'en'" (click)="use('en')">EN</button>
    </div>
  `,
  styles: [`
    .floating-lang-switcher { 
      position: fixed;
      bottom: 30px;
      right: 30px;
      display: flex; 
      align-items: center;
      background: white; 
      border-radius: 30px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      padding: 4px;
      z-index: 1000;
      border: 1px solid rgba(0,0,0,0.05);
    }
    .divider {
      width: 1px;
      height: 20px;
      background: #E0E0E0;
      margin: 0 4px;
    }
    button { 
      cursor: pointer; 
      padding: 8px 16px; 
      border: none; 
      background: transparent; 
      border-radius: 24px;
      font-weight: 600;
      color: #757575;
      font-family: 'Roboto', sans-serif;
      transition: all 0.3s ease;
      font-size: 0.9rem;
    }
    button:hover {
      background: #F5F5F5;
      color: #333;
    }
    button.active {
      background: var(--it-yellow, #FFC107);
      color: #121212;
      box-shadow: 0 2px 8px rgba(255, 193, 7, 0.4);
    }
  `]
})
export class LanguageSwitcher {
  private readonly translate = inject(TranslateService);

  get currentLang(): string {
    return this.translate.currentLang || this.translate.defaultLang || 'en';
  }

  use(lang: string): void {
    this.translate.use(lang);
  }
}
