import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, finalize, map, of, startWith, Subject, switchMap } from 'rxjs';

import {
  CheckViabilityUseCase,
  SearchHistoryUseCase,
  SubmitApplicationUseCase,
} from '../application/mortgage.use-cases';
import {
  ApplicationRecord,
  applicationFingerprint,
  ConfirmationLostError,
  HistorySearchResult,
  MortgageApplicationData,
  ReferenceConflictError,
  ViabilityResult,
} from '../domain/mortgage.models';

export type ViabilityState =
  | { kind: 'idle' }
  | { kind: 'loading'; data: MortgageApplicationData }
  | { kind: 'success'; data: MortgageApplicationData; result: ViabilityResult }
  | { kind: 'stale' }
  | { kind: 'error'; message: string };

export type SubmissionState =
  | { kind: 'idle' }
  | { kind: 'loading'; attempts: number }
  | { kind: 'success'; record: ApplicationRecord }
  | { kind: 'uncertain'; message: string }
  | { kind: 'conflict' | 'error'; message: string };

export type HistoryState =
  | { kind: 'loading' }
  | { kind: 'success'; result: HistorySearchResult }
  | { kind: 'error'; message: string };

@Injectable({ providedIn: 'root' })
export class MortgageOriginationFacade {
  private readonly checkUseCase = inject(CheckViabilityUseCase);
  private readonly submitUseCase = inject(SubmitApplicationUseCase);
  private readonly searchUseCase = inject(SearchHistoryUseCase);
  private readonly searchTerms = new Subject<string>();
  private latestViabilityRequest = 0;
  private activeSnapshot: MortgageApplicationData | null = null;
  private submissionAttempts = 0;

  readonly reference = signal(createReference());
  readonly viability = signal<ViabilityState>({ kind: 'idle' });
  readonly submission = signal<SubmissionState>({ kind: 'idle' });
  readonly history = signal<HistoryState>({ kind: 'loading' });
  readonly pendingViability = signal(0);
  readonly currentSearch = signal('');
  readonly page = signal(1);
  readonly pageSize = 50;
  readonly pageCount = computed(() => {
    const state = this.history();
    return state.kind === 'success' ? Math.max(1, Math.ceil(state.result.total / this.pageSize)) : 1;
  });
  readonly visibleHistory = computed(() => {
    const state = this.history();
    if (state.kind !== 'success') return [];
    const start = (this.page() - 1) * this.pageSize;
    return state.result.items.slice(start, start + this.pageSize);
  });

  constructor() {
    this.searchTerms
      .pipe(
        startWith(''),
        debounceTime(220),
        switchMap((term) => {
          this.currentSearch.set(term);
          this.page.set(1);
          this.history.set({ kind: 'loading' });
          return this.searchUseCase.execute(term).pipe(
            map((result): HistoryState => ({ kind: 'success', result })),
            catchError((error: Error) =>
              of<HistoryState>({ kind: 'error', message: error.message }),
            ),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.history.set(state));
  }

  checkViability(data: MortgageApplicationData): void {
    const requestId = ++this.latestViabilityRequest;
    const snapshot = { ...data };
    this.pendingViability.update((count) => count + 1);
    this.viability.set({ kind: 'loading', data: snapshot });

    this.checkUseCase
      .execute(snapshot)
      .pipe(finalize(() => this.pendingViability.update((count) => count - 1)))
      .subscribe({
        next: (result) => {
          if (requestId === this.latestViabilityRequest) {
            this.viability.set({ kind: 'success', data: snapshot, result });
          }
        },
        error: (error: Error) => {
          if (requestId === this.latestViabilityRequest) {
            this.viability.set({ kind: 'error', message: error.message });
          }
        },
      });
  }

  formChanged(data: MortgageApplicationData | null): void {
    const state = this.viability();
    if (state.kind !== 'loading' && state.kind !== 'success') return;
    if (!data || applicationFingerprint(data) !== applicationFingerprint(state.data)) {
      this.latestViabilityRequest += 1;
      this.viability.set({ kind: 'stale' });
    }
  }

  submit(data: MortgageApplicationData): void {
    this.activeSnapshot ??= { ...data };
    this.submissionAttempts += 1;
    this.submission.set({ kind: 'loading', attempts: this.submissionAttempts });

    this.submitUseCase.execute(this.reference(), this.activeSnapshot).subscribe({
      next: (record) => {
        this.submission.set({ kind: 'success', record });
        this.search(this.currentSearch());
      },
      error: (error: Error) => {
        if (error instanceof ConfirmationLostError) {
          this.submission.set({ kind: 'uncertain', message: error.message });
        } else if (error instanceof ReferenceConflictError) {
          this.submission.set({ kind: 'conflict', message: error.message });
        } else {
          this.submission.set({ kind: 'error', message: error.message });
        }
      },
    });
  }

  newApplication(): void {
    this.reference.set(createReference());
    this.activeSnapshot = null;
    this.submissionAttempts = 0;
    this.submission.set({ kind: 'idle' });
    this.viability.set({ kind: 'idle' });
  }

  search(term: string): void {
    this.searchTerms.next(term);
  }

  setPage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.pageCount()));
  }
}

function createReference(): string {
  return `HYP-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
}
