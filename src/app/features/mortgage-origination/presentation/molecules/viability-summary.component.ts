import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ViabilityState } from '../mortgage-origination.facade';
import { StatusBadgeComponent } from '../atoms/status-badge.component';

@Component({
  selector: 'app-viability-summary',
  imports: [CurrencyPipe, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './viability-summary.component.html',
})
export class ViabilitySummaryComponent {
  readonly state = input.required<ViabilityState>();
  readonly pendingCount = input(0);

  protected successState() {
    const state = this.state();
    return state.kind === 'success' ? state : null;
  }

  protected errorMessage() {
    const state = this.state();
    return state.kind === 'error' ? state.message : '';
  }
}
