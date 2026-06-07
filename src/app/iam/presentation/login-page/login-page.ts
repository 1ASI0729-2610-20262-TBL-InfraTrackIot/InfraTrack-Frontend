import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { IamService } from '../../application/iam.service';
import { LanguageSwitcher } from '../../../shared/language-switcher';

@Component({
  selector: 'app-login-page',
  imports: [LanguageSwitcher, TranslatePipe],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private readonly iam = inject(IamService);
  private readonly router = inject(Router);

  simulateLogin(role: 'owner' | 'admin'): void {
    if (role === 'owner') {
      this.iam.login('Roberto Mendoza', 'password', 1, 'owner');
    } else {
      this.iam.login('Carlos Vizcarra', 'password', 2, 'admin');
    }
    void this.router.navigateByUrl('/control-panel');
  }
}
