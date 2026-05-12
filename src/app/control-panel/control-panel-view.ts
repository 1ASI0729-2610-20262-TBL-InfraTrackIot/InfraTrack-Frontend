import { Component, inject } from '@angular/core';

import { ControlPanelStore } from './application/control-panel.store';

@Component({
  selector: 'app-control-panel-view',
  standalone: true,
  templateUrl: './control-panel-view.html',
  styleUrl: './control-panel-view.css'
})
export class ControlPanelView {
  protected readonly store = inject(ControlPanelStore);
}
