import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import {
  ConfirmationLostError,
  MortgageApplicationData,
  ReferenceConflictError,
} from '../domain/mortgage.models';
import { MockMortgageApiAdapter } from './mock-mortgage-api.adapter';
import { MOCK_SCENARIOS } from './mock-scenarios';

const data: MortgageApplicationData = {
  clientCode: '1001',
  propertyValue: 500_000_000,
  requestedAmount: 400_000_000,
  termYears: 15,
  consent: true,
};

describe('MockMortgageApiAdapter', () => {
  let adapter: MockMortgageApiAdapter;
  let http: HttpTestingController;

  beforeEach(() => {
    jest.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MockMortgageApiAdapter,
        { provide: MOCK_SCENARIOS, useValue: new Set(['lost-confirmation']) },
      ],
    });
    adapter = TestBed.inject(MockMortgageApiAdapter);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    jest.useRealTimers();
  });

  it('registra antes de perder confirmación, recupera el original y rechaza datos distintos', async () => {
    const firstAttempt = firstValueFrom(adapter.submit({ reference: 'HYP-TEST', data }));
    http.expectOne('/data/applications.json').flush([]);
    const firstError = expect(firstAttempt).rejects.toBeInstanceOf(ConfirmationLostError);
    await jest.advanceTimersByTimeAsync(220);
    await firstError;

    const retry = firstValueFrom(adapter.submit({ reference: 'HYP-TEST', data }));
    await jest.advanceTimersByTimeAsync(220);
    await expect(retry).resolves.toMatchObject({ reference: 'HYP-TEST', data });

    const conflict = firstValueFrom(
      adapter.submit({ reference: 'HYP-TEST', data: { ...data, requestedAmount: 300_000_000 } }),
    );
    const conflictError = expect(conflict).rejects.toBeInstanceOf(ReferenceConflictError);
    await jest.advanceTimersByTimeAsync(220);
    await conflictError;

    const original = firstValueFrom(adapter.submit({ reference: 'HYP-TEST', data }));
    await jest.advanceTimersByTimeAsync(220);
    await expect(original).resolves.toMatchObject({ data: { requestedAmount: 400_000_000 } });
  });
});
