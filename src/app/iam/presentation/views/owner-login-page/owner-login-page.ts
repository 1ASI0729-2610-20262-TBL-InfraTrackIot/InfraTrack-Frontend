import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../application/iam.store';
import { SignInCommand } from '../../../domain/model/sign-in.command';
import { AuthSplitShell } from '../../components/auth-split-shell/auth-split-shell';

@Component({
  selector: 'app-owner-login-page',
  imports: [AuthSplitShell, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './owner-login-page.html',
  styleUrl: './owner-login-page.css',
})
export class OwnerLoginPage implements OnInit {
  protected readonly store = inject(IamStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly hidePassword = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('registered') === '1') {
      this.successMessage.set('signup.registrationSuccess');
    }
  }

  back(): void {
    void this.router.navigate(['/iam/sign-in']);
  }

  togglePassword(): void {
    this.hidePassword.update((value) => !value);
  }

  submit(): void {
    const mail = this.email().trim();
    const password = this.password();
    if (!mail || !password) {
      this.errorMessage.set('signup.errorRequired');
      return;
    }
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.store.signIn(new SignInCommand({ username: mail, password }), this.router, {
      expectedRole: 'owner',
      onError: (reason) =>
        this.errorMessage.set(reason === 'wrongEntity' ? 'login.errorWrongEntity' : 'login.errorAuth'),
    });
  }
}
