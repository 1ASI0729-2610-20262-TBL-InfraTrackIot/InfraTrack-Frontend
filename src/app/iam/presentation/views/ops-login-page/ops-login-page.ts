import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { map, of, tap } from 'rxjs';

import { IamStore } from '../../../application/iam.store';
import { OpsOnboardingService } from '../../../application/ops-onboarding.service';
import { OnboardingDraftStore } from '../../../application/onboarding-draft.store';
import { SignInCommand } from '../../../domain/model/sign-in.command';
import { AuthSplitShell } from '../../components/auth-split-shell/auth-split-shell';

@Component({
  selector: 'app-ops-login-page',
  imports: [AuthSplitShell, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './ops-login-page.html',
  styleUrl: './ops-login-page.css',
})
export class OpsLoginPage implements OnInit {
  protected readonly store = inject(IamStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly drafts = inject(OnboardingDraftStore);
  private readonly opsOnboarding = inject(OpsOnboardingService);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly companyCode = signal('');
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
      expectedRole: 'admin',
      onError: (reason) => {
        if (reason === 'wrongEntity') {
          this.errorMessage.set('login.errorWrongEntity');
          return;
        }
        if (reason === 'provision') {
          this.errorMessage.set('signup.errorProvision');
          return;
        }
        this.errorMessage.set('login.errorAuth');
      },
      afterAuth: (resource) => {
        const draft = this.drafts.readOpsDraft();
        if (!draft || draft.email.trim().toLowerCase() !== mail.toLowerCase()) {
          return of(undefined);
        }
        return this.opsOnboarding.provisionStaff(resource, draft).pipe(
          tap(() => this.drafts.clearOpsDraft()),
          map(() => undefined),
        );
      },
    });
  }
}
