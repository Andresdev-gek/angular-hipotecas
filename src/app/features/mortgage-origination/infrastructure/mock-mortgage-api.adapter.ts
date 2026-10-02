import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { delay, map, Observable, shareReplay, tap } from 'rxjs';

import { MortgageApiPort } from '../application/mortgage-api.port';
import {
  ApplicationRecord,
  applicationFingerprint,
  evaluateViability,
  HistorySearchResult,
  MortgageApplicationData,
  SubmissionCommand,
  ViabilityResult,
} from '../domain/mortgage.models';
import { ConfirmationLostError, ReferenceConflictError, SimulatedServiceError } from '../domain/mortgage.errors';
import { MOCK_SCENARIOS } from './mock-scenarios';

@Injectable({ providedIn: 'root' })
export class MockMortgageApiAdapter implements MortgageApiPort {
  private readonly http = inject(HttpClient);
  private readonly scenarios = inject(MOCK_SCENARIOS);
  private readonly records = new Map<string, ApplicationRecord>();
  private viabilityCalls = 0;
  private searchCalls = 0;
  private viabilityErrorEmitted = false;
  private searchErrorEmitted = false;
  private readonly lostConfirmations = new Set<string>();

  private readonly loaded$ = this.http.get<ApplicationRecord[]>('/data/applications.json').pipe(
    tap((records) => {
      if (this.records.size === 0) {
        records.forEach((record) => this.records.set(record.reference, record));
      }
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  checkViability(data: MortgageApplicationData): Observable<ViabilityResult> {
    const wait = this.latency('viability');
    return this.loaded$.pipe(
      delay(wait),
      map(() => {
        if (this.scenarios.has('query-error') && !this.viabilityErrorEmitted) {
          this.viabilityErrorEmitted = true;
          throw new SimulatedServiceError();
        }
        return evaluateViability(data);
      }),
    );
  }

  submit(command: SubmissionCommand): Observable<ApplicationRecord> {
    const wait = this.scenarios.has('submission-delay') ? 600 : 220;
    return this.loaded$.pipe(
      delay(wait),
      map(() => {
        const existing = this.records.get(command.reference);
        if (existing) {
          if (applicationFingerprint(existing.data) !== applicationFingerprint(command.data)) {
            throw new ReferenceConflictError();
          }
          return existing;
        }

        const record: ApplicationRecord = {
          reference: command.reference,
          data: { ...command.data },
          submittedAt: new Date().toISOString(),
          status: 'submitted',
          viability: evaluateViability(command.data),
        };
        this.records.set(record.reference, record);

        if (
          this.scenarios.has('lost-confirmation') &&
          !this.lostConfirmations.has(record.reference)
        ) {
          this.lostConfirmations.add(record.reference);
          throw new ConfirmationLostError();
        }
        return record;
      }),
    );
  }

  searchHistory(term: string): Observable<HistorySearchResult> {
    const wait = this.latency('search');
    return this.loaded$.pipe(
      delay(wait),
      map(() => {
        if (this.scenarios.has('query-error') && !this.searchErrorEmitted) {
          this.searchErrorEmitted = true;
          throw new SimulatedServiceError(
            'No fue posible consultar el historial. Intenta nuevamente.',
          );
        }
        const needle = normalize(term);
        const items = [...this.records.values()].filter((record) => {
          return (
            !needle || normalize(`${record.reference} ${record.data.clientCode}`).includes(needle)
          );
        });
        return { items, total: items.length };
      }),
    );
  }

  private latency(operation: 'viability' | 'search'): number {
    if (!this.scenarios.has('out-of-order')) return 180;
    const call = operation === 'viability' ? this.viabilityCalls++ : this.searchCalls++;
    return call === 0 ? 800 : 150;
  }
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es-CO')
    .trim();
}
