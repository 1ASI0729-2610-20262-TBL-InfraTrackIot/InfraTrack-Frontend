import { Component, inject, input, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { BackendWarmupService } from '../../../../shared/infrastructure/backend-warmup.service';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';

/**
 * Split-screen IAM shell: branded hero (left) + white form panel (right).
 */
@Component({
  selector: 'app-auth-split-shell',
  imports: [TranslatePipe, LanguageSwitcher],
  templateUrl: './auth-split-shell.html',
  styleUrl: './auth-split-shell.css',
})
export class AuthSplitShell implements OnInit {
  private readonly backendWarmup = inject(BackendWarmupService);

  readonly heroEyebrowKey = input.required<string>();
  readonly heroTitleKey = input.required<string>();
  readonly heroDescKey = input.required<string>();
  readonly serverWaking = this.backendWarmup.waking;

  ngOnInit(): void {
    this.backendWarmup.ping();
  }
}
