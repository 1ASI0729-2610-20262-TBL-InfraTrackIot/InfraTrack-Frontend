import { Component, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
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
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';

import { IamService } from '../../../iam/application/iam.service';
import { AssetManagementStore } from '../../application/asset-management.store';
import { AddMachineryDialog } from '../add-machinery-dialog/add-machinery-dialog';
import { DeleteMachineryConfirmDialog } from '../delete-machinery-confirm-dialog/delete-machinery-confirm-dialog';
import { EditMachineryDialog } from '../edit-machinery-dialog/edit-machinery-dialog';
import { Machine } from '../../domain/model/machine.entity';

@Component({
  selector: 'app-asset-management-view',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
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
    MatPaginator,
    MatButton,
    MatIconButton,
    MatIcon,
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    MatOption,
    MatProgressSpinner,
    TranslatePipe,
  ],
  templateUrl: './asset-management-view.html',
  styleUrl: './asset-management-view.css',
})
export class AssetManagementView {
  private readonly dialog = inject(MatDialog);
  protected readonly store = inject(AssetManagementStore);
  protected readonly iam = inject(IamService);

  protected readonly columns = [
    'machineId',
    'machineName',
    'operationalStatus',
    'fuelLevel',
    'locationLabel',
    'actions',
  ] as const;

  constructor() {
    this.store.load().subscribe();
  }

  protected openAddMachinery(): void {
    this.dialog.open(AddMachineryDialog, {
      width: 'min(520px, 94vw)',
      autoFocus: 'dialog',
    });
  }

  protected openEdit(row: Machine): void {
    this.dialog.open(EditMachineryDialog, {
      width: 'min(560px, 96vw)',
      autoFocus: 'dialog',
      data: { machineryId: row.machineryApiId },
    });
  }

  protected openDeleteConfirm(row: Machine): void {
    this.dialog.open(DeleteMachineryConfirmDialog, {
      width: 'min(420px, 92vw)',
      data: { machineryId: row.machineryApiId, plateLabel: row.locationLabel.split('·')[0]?.trim() || row.machineName },
    });
  }

  protected onPage(ev: PageEvent): void {
    this.store.setPage(ev.pageIndex, ev.pageSize);
  }

  protected onPlateInput(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    this.store.setPlateQuery(v);
  }
}
