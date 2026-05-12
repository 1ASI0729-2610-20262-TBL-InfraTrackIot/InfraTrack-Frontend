import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSlideToggle } from '@angular/material/slide-toggle';
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
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { ConfigurationStore } from '../../application/configuration.store';
import { AddIotNodeDialog } from '../add-iot-node-dialog/add-iot-node-dialog';
import { AddMaintenanceDialog } from '../add-maintenance-dialog/add-maintenance-dialog';

@Component({
  selector: 'app-configuration-view',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatSlideToggle,
    MatButton,
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
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './configuration-view.html',
  styleUrl: './configuration-view.css',
})
export class ConfigurationView {
  private readonly dialog = inject(MatDialog);
  protected readonly store = inject(ConfigurationStore);
  protected readonly subColumns = ['id', 'summary'] as const;

  constructor() {
    this.store.loadApiSnapshot();
  }

  protected refreshApi(): void {
    this.store.loadApiSnapshot();
  }

  protected openAddIotNode(): void {
    this.dialog.open(AddIotNodeDialog, {
      width: 'min(520px, 94vw)',
      autoFocus: 'dialog',
    });
  }

  protected openAddMaintenance(): void {
    this.dialog.open(AddMaintenanceDialog, {
      width: 'min(520px, 94vw)',
      autoFocus: 'dialog',
    });
  }

  onTheftToggle(checked: boolean): void {
    this.store.setTheftDropAlertsEnabled(checked);
  }

  onDigestToggle(checked: boolean): void {
    this.store.setDailyEmailDigestEnabled(checked);
  }
}
