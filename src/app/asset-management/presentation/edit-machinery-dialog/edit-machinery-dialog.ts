import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, finalize, map, of, switchMap, take } from 'rxjs';

import { AssetManagementStore } from '../../application/asset-management.store';
import { INFRATRACK_API } from '../../../shared/infratrack-api.urls';
import { IotNodeApiDto, MachineryApiDto, OperatorApiDto } from '../../../shared/infratrack-api.dto';

export interface EditMachineryDialogData {
  machineryId: number;
}

@Component({
  selector: 'app-edit-machinery-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    MatOption,
    MatButton,
    MatProgressSpinner,
    TranslatePipe,
  ],
  templateUrl: './edit-machinery-dialog.html',
  styleUrl: './edit-machinery-dialog.css',
})
export class EditMachineryDialog {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  protected readonly store = inject(AssetManagementStore);
  private readonly dialogRef = inject(MatDialogRef<EditMachineryDialog, boolean>);
  private readonly snack = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  protected readonly data = inject<EditMachineryDialogData>(MAT_DIALOG_DATA);

  protected readonly saving = signal(false);
  protected readonly loadAux = signal(true);
  protected readonly operators = signal<OperatorApiDto[]>([]);
  protected readonly iotNodes = signal<IotNodeApiDto[]>([]);
  protected readonly createdAtLabel = signal('');

  protected readonly form = this.fb.nonNullable.group({
    operatorId: [1, [Validators.required, Validators.min(1)]],
    plateNumber: ['', [Validators.required, Validators.maxLength(32)]],
    brand: ['', [Validators.required, Validators.maxLength(64)]],
    model: ['', [Validators.required, Validators.maxLength(64)]],
    fuelType: ['diesel', [Validators.required, Validators.maxLength(40)]],
    tankCapacityLiters: [200, [Validators.required, Validators.min(1), Validators.max(50000)]],
    currentStatus: ['active' as 'active' | 'inactive' | 'maintenance', Validators.required],
    imageUrl: [''],
  });

  constructor() {
    const dto = this.store.getMachineryById(this.data.machineryId);
    if (!dto) {
      this.snack.open(this.translate.instant('assetManagement.editDialog.notFound'), undefined, { duration: 3200 });
      this.dialogRef.close(false);
      return;
    }
    const stRaw = String(dto.currentStatus);
    const currentStatus: 'active' | 'inactive' | 'maintenance' =
      stRaw === 'inactive' || stRaw === 'maintenance' || stRaw === 'active' ? (stRaw as 'active' | 'inactive' | 'maintenance') : 'active';
    this.form.patchValue({
      operatorId: dto.operatorId,
      plateNumber: dto.plateNumber,
      brand: dto.brand,
      model: dto.model,
      fuelType: (dto.fuelType || 'diesel').trim(),
      tankCapacityLiters: dto.tankCapacityLiters,
      currentStatus,
      imageUrl: dto.imageUrl ?? '',
    });
    this.createdAtLabel.set(dto.createdAt ?? '');

    this.http
      .get<OperatorApiDto[]>(INFRATRACK_API.operators)
      .pipe(
        map((arr) => (Array.isArray(arr) ? arr : [])),
        catchError(() => of<OperatorApiDto[]>([])),
      )
      .subscribe((ops) => this.operators.set(ops));

    this.http
      .get<IotNodeApiDto[]>(INFRATRACK_API.iotNodes)
      .pipe(
        map((arr) => (Array.isArray(arr) ? arr.filter((n) => Number(n.machineryId) === this.data.machineryId) : [])),
        catchError(() => of<IotNodeApiDto[]>([])),
        finalize(() => this.loadAux.set(false)),
      )
      .subscribe((nodes) => this.iotNodes.set(nodes));
  }

  submit(): void {
    if (!this.store.httpPutDeleteEnabled()) {
      return;
    }
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const base = this.store.getMachineryById(this.data.machineryId);
    if (!base) {
      return;
    }
    const v = this.form.getRawValue();
    const dto: MachineryApiDto = {
      ...base,
      id: this.data.machineryId,
      operatorId: v.operatorId,
      plateNumber: v.plateNumber.trim(),
      brand: v.brand.trim(),
      model: v.model.trim(),
      fuelType: v.fuelType.trim(),
      tankCapacityLiters: v.tankCapacityLiters,
      currentStatus: v.currentStatus,
      imageUrl: v.imageUrl.trim() || base.imageUrl,
      createdAt: base.createdAt,
    };
    this.saving.set(true);
    this.store
      .updateMachinery(dto)
      .pipe(
        switchMap((r) => this.store.load().pipe(map(() => r))),
        take(1),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (r) => {
          if (r.persistedLocally) {
            this.snack.open(this.translate.instant('assetManagement.editDialog.savedLocalOnly'), undefined, {
              duration: 5200,
            });
          } else {
            this.snack.open(this.translate.instant('assetManagement.editDialog.success'), undefined, { duration: 2800 });
          }
          this.dialogRef.close(true);
        },
        error: () => {
          this.snack.open(this.translate.instant('assetManagement.editDialog.error'), undefined, { duration: 4200 });
        },
      });
  }
}
