import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ApplicationRecord,
  HistorySearchResult,
  MortgageApplicationData,
  SubmissionCommand,
  ViabilityResult,
} from '../domain/mortgage.models';

export interface MortgageApiPort {
  checkViability(data: MortgageApplicationData): Observable<ViabilityResult>;
  submit(command: SubmissionCommand): Observable<ApplicationRecord>;
  searchHistory(term: string): Observable<HistorySearchResult>;
}

export const MORTGAGE_API = new InjectionToken<MortgageApiPort>('MORTGAGE_API');
