import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { MORTGAGE_API } from './features/mortgage-origination/application/mortgage-api.port';
import { MockMortgageApiAdapter } from './features/mortgage-origination/infrastructure/mock-mortgage-api.adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideRouter(routes),
    { provide: MORTGAGE_API, useExisting: MockMortgageApiAdapter },
    { provide: LOCALE_ID, useValue: 'es-CO' },
  ],
};
