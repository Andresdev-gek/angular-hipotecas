import { inject, Injectable } from '@angular/core';

import { assertValidApplication, MortgageApplicationData } from '../domain/mortgage.models';
import { MORTGAGE_API } from './mortgage-api.port';

@Injectable({ providedIn: 'root' })
export class CheckViabilityUseCase {
  private readonly api = inject(MORTGAGE_API);

  execute(data: MortgageApplicationData) {
    assertValidApplication(data);
    return this.api.checkViability(data);
  }
}

@Injectable({ providedIn: 'root' })
export class SubmitApplicationUseCase {
  private readonly api = inject(MORTGAGE_API);

  execute(reference: string, data: MortgageApplicationData) {
    assertValidApplication(data);
    return this.api.submit({ reference, data: { ...data } });
  }
}

@Injectable({ providedIn: 'root' })
export class SearchHistoryUseCase {
  private readonly api = inject(MORTGAGE_API);

  execute(term: string) {
    return this.api.searchHistory(term);
  }
}
