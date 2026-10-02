import { TestBed } from '@angular/core/testing';
import { delay, of } from 'rxjs';

import {
  CheckViabilityUseCase,
  SearchHistoryUseCase,
  SubmitApplicationUseCase,
} from '../application/mortgage.use-cases';
import { evaluateViability, MortgageApplicationData } from '../domain/mortgage.models';
import { MortgageOriginationFacade } from './mortgage-origination.facade';

const first: MortgageApplicationData = {
  clientCode: 'A',
  propertyValue: 100_000_000,
  requestedAmount: 90_000_000,
  termYears: 10,
  consent: true,
};
const latest = { ...first, clientCode: 'B', requestedAmount: 70_000_000 };

describe('MortgageOriginationFacade', () => {
  let facade: MortgageOriginationFacade;

  beforeEach(() => {
    jest.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        MortgageOriginationFacade,
        {
          provide: CheckViabilityUseCase,
          useValue: {
            execute: (data: MortgageApplicationData) =>
              of(evaluateViability(data)).pipe(delay(data.clientCode === 'A' ? 800 : 150)),
          },
        },
        { provide: SubmitApplicationUseCase, useValue: { execute: jest.fn() } },
        {
          provide: SearchHistoryUseCase,
          useValue: { execute: () => of({ items: [], total: 0 }) },
        },
      ],
    });
    facade = TestBed.inject(MortgageOriginationFacade);
  });

  afterEach(() => jest.useRealTimers());

  it('mantiene la respuesta más reciente cuando una anterior llega después', async () => {
    facade.checkViability(first);
    facade.checkViability(latest);

    await jest.advanceTimersByTimeAsync(150);
    expect(facade.viability()).toMatchObject({
      kind: 'success',
      data: latest,
      result: { decision: 'eligible-for-study' },
    });

    await jest.advanceTimersByTimeAsync(650);
    expect(facade.viability()).toMatchObject({ kind: 'success', data: latest });
  });

  it('marca como obsoleto el resultado cuando cambian los datos', async () => {
    facade.checkViability(latest);
    await jest.advanceTimersByTimeAsync(150);
    facade.formChanged(first);
    expect(facade.viability()).toEqual({ kind: 'stale' });
  });
});
