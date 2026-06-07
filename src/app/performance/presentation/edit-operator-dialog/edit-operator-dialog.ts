import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs';

import { PerformanceStore } from '../../application/performance.store';
import { PerformanceOperatorVm } from '../../infrastructure/performance.mapper';
import { OperatorApiDto } from '../../../shared/infratrack-api.dto';

export interface EditOperatorDialogData {
  operator: PerformanceOperatorVm;
}

@Component({
  selector: 'app-edit-operator-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatFormField,
    MatLabel,
    MatInput,
    MatButton,
    TranslatePipe,
  ],
  templateUrl: './edit-operator-dialog.html',
  styleUrl: './edit-operator-dialog.css',
})
export class EditOperatorDialog {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(PerformanceStore);
  private readonly ref = inject(MatDialogRef<EditOperatorDialog, boolean>);
  protected readonly data = inject<EditOperatorDialogData>(MAT_DIALOG_DATA);
  private readonly snack = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  protected readonly form = this.fb.nonNullable.group({
    fullName: [this.data.operator.fullName, [Validators.required, Validators.maxLength(120)]],
    phone: [this.data.operator.phone, [Validators.required, Validators.maxLength(32)]],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: OperatorApiDto = {
      id: this.data.operator.id,
      userId: this.data.operator.userId,
      fullName: v.fullName.trim(),
      licenseNumber: this.data.operator.licenseNumber,
      phone: v.phone.trim(),
      status: this.data.operator.status,
    };
    this.store
      .updateOperator(body)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.store.reloadOperators();
          this.snack.open(this.translate.instant('performance.editOperator.success'), undefined, { duration: 2800 });
          this.ref.close(true);
        },
        error: () => {
          this.snack.open(this.translate.instant('performance.editOperator.error'), undefined, { duration: 4000 });
        },
      });
  }
}
