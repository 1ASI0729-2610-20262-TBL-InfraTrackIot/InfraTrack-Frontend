import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, switchMap, take } from 'rxjs';

import { AssetManagementStore } from '../../application/asset-management.store';
import { buildCreateMachineryBody } from '../../infrastructure/machinery.mapper';

@Component({
  selector: 'app-add-machinery-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    MatOption,
    MatButton,
    MatProgressSpinner,
    TranslatePipe,
  ],
  templateUrl: './add-machinery-dialog.html',
  styleUrl: './add-machinery-dialog.css',
})
export class AddMachineryDialog {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(AssetManagementStore);
  private readonly dialogRef = inject(MatDialogRef<AddMachineryDialog, boolean>);
  private readonly snack = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    operatorId: [1, [Validators.required, Validators.min(1)]],
    plateNumber: ['', [Validators.required, Validators.maxLength(32)]],
    brand: ['', [Validators.required, Validators.maxLength(64)]],
    model: ['', [Validators.required, Validators.maxLength(64)]],
    fuelType: ['diesel' as 'diesel' | 'gasoline', Validators.required],
    tankCapacityLiters: [200, [Validators.required, Validators.min(1), Validators.max(50000)]],
    currentStatus: ['active' as 'active' | 'inactive' | 'maintenance', Validators.required],
    imageUrl: [''],
  });

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body = buildCreateMachineryBody({
      operatorId: v.operatorId,
      plateNumber: v.plateNumber,
      model: v.model,
      brand: v.brand,
      fuelType: v.fuelType,
      tankCapacityLiters: v.tankCapacityLiters,
      currentStatus: v.currentStatus,
      imageUrl: v.imageUrl,
    });
    this.saving.set(true);
    this.store
      .addMachine(body)
      .pipe(
        switchMap(() => this.store.load()),
        take(1),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.store.goToLastPage();
          this.snack.open(this.translate.instant('assetManagement.addDialog.success'), undefined, { duration: 3200 });
          this.dialogRef.close(true);
        },
        error: () => {
          this.snack.open(this.translate.instant('assetManagement.addDialog.error'), undefined, { duration: 4500 });
        },
      });
  }
}
