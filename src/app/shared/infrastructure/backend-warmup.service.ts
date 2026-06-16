import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, finalize, of, timeout } from 'rxjs';

import { environment } from '../../../environments/environment';

/**
 * Render free tier sleeps after inactivity; the first HTTP call can take 30–90s.
 * Ping a public docs endpoint early so login feels faster once credentials are sent.
 */
@Injectable({ providedIn: 'root' })
export class BackendWarmupService {
  private readonly http = inject(HttpClient);
  private started = false;

  readonly waking = signal(false);

  ping(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.waking.set(true);

    const apiRoot = environment.apiBases.identity.replace(/\/api\/v1\/?$/, '');

    this.http
      .get(`${apiRoot}/v3/api-docs`, { responseType: 'text' })
      .pipe(
        timeout(120_000),
        catchError(() => of(null)),
        finalize(() => this.waking.set(false)),
      )
      .subscribe();
  }
}
