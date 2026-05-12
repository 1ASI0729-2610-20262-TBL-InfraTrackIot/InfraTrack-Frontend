import { Component, inject } from '@angular/core';

import { ControlPanelStore } from './application/control-panel.store';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-control-panel-view',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './control-panel-view.html',
  styleUrl: './control-panel-view.css'
})
export class ControlPanelView {
  protected readonly store = inject(ControlPanelStore);
}
