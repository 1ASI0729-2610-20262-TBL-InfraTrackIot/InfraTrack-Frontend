import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs';

import { PerformanceStore } from '../../application/performance.store';

export interface DeleteOperatorDialogData {
  id: number;
  name: string;
}

@Component({
  selector: 'app-delete-operator-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButton, TranslatePipe],
  templateUrl: './delete-operator-dialog.html',
  styleUrl: './delete-operator-dialog.css',
})
export class DeleteOperatorDialog {
  private readonly store = inject(PerformanceStore);
  private readonly ref = inject(MatDialogRef<DeleteOperatorDialog, boolean>);
  protected readonly data = inject<DeleteOperatorDialogData>(MAT_DIALOG_DATA);
  private readonly snack = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  confirm(): void {
    this.store
      .deleteOperator(this.data.id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.store.reloadOperators();
          this.snack.open(this.translate.instant('performance.deleteOperator.success'), undefined, { duration: 2800 });
          this.ref.close(true);
        },
        error: () => {
          this.snack.open(this.translate.instant('performance.deleteOperator.error'), undefined, { duration: 4000 });
        },
      });
  }
}
