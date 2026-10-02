import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ApplicationRecord } from '../../domain/mortgage.models';
import { HistoryState } from '../mortgage-origination.facade';
import { StatusBadgeComponent } from '../atoms/status-badge.component';

@Component({
  selector: 'app-application-history',
  imports: [CurrencyPipe, DatePipe, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './application-history.component.html',
})
export class ApplicationHistoryComponent {
  readonly state = input.required<HistoryState>();
  readonly items = input.required<ApplicationRecord[]>();
  readonly page = input.required<number>();
  readonly pageCount = input.required<number>();
  readonly pageSize = input(25);
  readonly searchTerm = input('');

  readonly search = output<string>();
  readonly retry = output<void>();
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected total(): number {
    const state = this.state();

    return state.kind === 'success' ? state.result.total : 0;
  }

  protected errorMessage(): string {
    const state = this.state();

    return state.kind === 'error' ? state.message : '';
  }

  protected changePageSize(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);

    this.pageSizeChange.emit(value);
  }
}
