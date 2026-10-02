import { InjectionToken } from '@angular/core';

export type MockScenario =
  | 'out-of-order'
  | 'submission-delay'
  | 'lost-confirmation'
  | 'query-error';

export const MOCK_SCENARIOS = new InjectionToken<ReadonlySet<MockScenario>>('MOCK_SCENARIOS', {
  providedIn: 'root',
  factory: () => {
    const values = new URLSearchParams(globalThis.location?.search ?? '')
      .get('scenario')
      ?.split(',')
      .filter(Boolean) as MockScenario[] | undefined;
    return new Set(values ?? []);
  },
});
