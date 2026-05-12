import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  template: `
    <div class="lang-switcher">
      <button (click)="use('es')">ES</button>
      <button (click)="use('en')">EN</button>
    </div>
  `,
  styles: [`
    .lang-switcher { display: flex; gap: 0.5rem; }
    button { cursor: pointer; padding: 0.25rem 0.5rem; border: 1px solid #ccc; background: white; }
  `]
})
export class LanguageSwitcher {
  private readonly translate = inject(TranslateService);

  use(lang: string): void {
    this.translate.use(lang);
  }
}
