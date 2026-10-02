import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'originacion' },
  {
    path: 'originacion',
    loadComponent: () =>
      import(
        './features/mortgage-origination/presentation/pages/mortgage-origination.page'
      ).then((module) => module.MortgageOriginationPage),
  },
  { path: '**', redirectTo: 'originacion' },
];
