import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MOCK_SCENARIOS } from '../../infrastructure/mock-scenarios';
import { MortgageOriginationFacade } from '../mortgage-origination.facade';
import { ViabilitySummaryComponent } from '../molecules/viability-summary.component';
import { ApplicationHistoryComponent } from '../organisms/application-history.component';
import { MortgageApplicationFormComponent } from '../organisms/mortgage-application-form.component';

@Component({
  selector: 'app-mortgage-origination-page',
  imports: [
    RouterLink,
    MortgageApplicationFormComponent,
    ViabilitySummaryComponent,
    ApplicationHistoryComponent,
  ],
  templateUrl: './mortgage-origination.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MortgageOriginationPage {
  protected readonly facade = inject(MortgageOriginationFacade);
  protected readonly scenarios = [...inject(MOCK_SCENARIOS)];
}
