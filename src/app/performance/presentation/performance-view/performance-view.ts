import { DecimalPipe, SlicePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';

import { PerformanceStore } from '../../application/performance.store';
import { DeleteOperatorDialog } from '../delete-operator-dialog/delete-operator-dialog';
import { EditOperatorDialog } from '../edit-operator-dialog/edit-operator-dialog';
import { PerformanceOperatorVm } from '../../infrastructure/performance.mapper';

@Component({
  selector: 'app-performance-view',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatButton,
    MatIconButton,
    MatIcon,
    MatProgressSpinner,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatCell,
    MatCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    TranslatePipe,
    DecimalPipe,
    SlicePipe,
  ],
  templateUrl: './performance-view.html',
  styleUrl: './performance-view.css',
})
export class PerformanceView {
  private readonly dialog = inject(MatDialog);
  protected readonly store = inject(PerformanceStore);

  protected readonly alertColumns = ['time', 'machine', 'type', 'severity'] as const;
  protected readonly operatorColumns = ['name', 'license', 'phone', 'status', 'actions'] as const;

  constructor() {
    this.store.load();
  }

  refresh(): void {
    this.store.load();
  }

  protected editOperator(row: PerformanceOperatorVm): void {
    this.dialog.open(EditOperatorDialog, {
      width: 'min(420px, 94vw)',
      data: { operator: row },
    });
  }

  protected deleteOperator(row: PerformanceOperatorVm): void {
    this.dialog.open(DeleteOperatorDialog, {
      width: 'min(400px, 92vw)',
      data: { id: row.id, name: row.fullName },
    });
  }
}
