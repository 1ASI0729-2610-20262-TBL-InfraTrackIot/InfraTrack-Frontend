import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
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
import { MatIcon } from '@angular/material/icon';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';

import { AssetManagementStore } from '../../application/asset-management.store';
import { AddMachineryDialog } from '../add-machinery-dialog/add-machinery-dialog';

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
    MatIcon,
    MatProgressSpinner,
    TranslatePipe,
  ],
  templateUrl: './asset-management-view.html',
  styleUrl: './asset-management-view.css',
})
export class AssetManagementView {
  private readonly dialog = inject(MatDialog);
  protected readonly store = inject(AssetManagementStore);

  protected readonly columns = ['machineId', 'machineName', 'operationalStatus', 'fuelLevel', 'locationLabel'] as const;

  constructor() {
    this.store.load().subscribe();
  }

  protected openAddMachinery(): void {
    this.dialog.open(AddMachineryDialog, {
      width: 'min(520px, 94vw)',
      autoFocus: 'dialog',
    });
  }

  protected onPage(ev: PageEvent): void {
    this.store.setPage(ev.pageIndex, ev.pageSize);
  }
}
