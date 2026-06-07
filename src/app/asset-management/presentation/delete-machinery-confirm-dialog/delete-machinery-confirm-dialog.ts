import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, map, switchMap, take } from 'rxjs';

import { AssetManagementStore } from '../../application/asset-management.store';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface DeleteMachineryConfirmData {
  machineryId: number;
  plateLabel: string;
}

@Component({
  selector: 'app-delete-machinery-confirm-dialog',
  imports: [MatDialogModule, MatButton, MatProgressSpinner, TranslatePipe],
  templateUrl: './delete-machinery-confirm-dialog.html',
  styleUrl: './delete-machinery-confirm-dialog.css',
})
export class DeleteMachineryConfirmDialog {
  protected readonly store = inject(AssetManagementStore);
  private readonly dialogRef = inject(MatDialogRef<DeleteMachineryConfirmDialog, boolean>);
  private readonly snack = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  protected readonly data = inject<DeleteMachineryConfirmData>(MAT_DIALOG_DATA);

  protected busy = false;

  confirm(): void {
    if (!this.store.httpPutDeleteEnabled()) {
      return;
    }
    if (this.busy) {
      return;
    }
    this.busy = true;
    this.store
      .deleteMachinery(this.data.machineryId)
      .pipe(
        switchMap((r) => this.store.load().pipe(map(() => r))),
        take(1),
        finalize(() => (this.busy = false)),
      )
      .subscribe({
        next: (r) => {
          if (r.persistedLocally) {
            this.snack.open(this.translate.instant('assetManagement.deleteDialog.removedLocalOnly'), undefined, {
              duration: 5200,
            });
          } else {
            this.snack.open(this.translate.instant('assetManagement.deleteDialog.success'), undefined, { duration: 2800 });
          }
          this.dialogRef.close(true);
        },
        error: () => {
          this.snack.open(this.translate.instant('assetManagement.deleteDialog.error'), undefined, { duration: 4200 });
        },
      });
  }
}
