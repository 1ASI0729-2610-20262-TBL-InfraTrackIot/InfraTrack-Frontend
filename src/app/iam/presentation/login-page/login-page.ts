import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

import { IamService } from '../../application/iam.service';
import { LanguageSwitcher } from '../../../shared/language-switcher';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatHint,
    MatInput,
    MatButton,
    TranslatePipe,
    LanguageSwitcher,
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly iam = inject(IamService);
  private readonly router = inject(Router);

  protected readonly showError = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: [''],
  });

  submit(): void {
    this.showError.set(false);
    if (this.form.invalid) {
      this.showError.set(true);
      return;
    }
    const { username, password } = this.form.getRawValue();
    const ok = this.iam.login(username, password);
    if (!ok) {
      this.showError.set(true);
      return;
    }
    void this.router.navigateByUrl('/control-panel');
  }
}
