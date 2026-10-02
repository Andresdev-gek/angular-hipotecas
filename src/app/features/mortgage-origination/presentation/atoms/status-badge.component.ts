import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ViabilityDecision } from '../../domain/mortgage.models';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-badge.component.html',
})
export class StatusBadgeComponent {
  readonly decision = input.required<ViabilityDecision>();
}
