import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  MortgageApplicationData,
  TermYears,
} from '../../domain/mortgage.models';
import { SubmissionState } from '../mortgage-origination.facade';
import { StatusBadgeComponent } from '../atoms/status-badge.component';

@Component({
  selector: 'app-mortgage-application-form',
  imports: [ReactiveFormsModule, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mortgage-application-form.component.html',
})
export class MortgageApplicationFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly reference = input.required<string>();
  readonly submission = input.required<SubmissionState>();

  readonly check = output<MortgageApplicationData>();
  readonly submitRequest = output<MortgageApplicationData>();
  readonly changed = output<MortgageApplicationData | null>();
  readonly newApplication = output<void>();

  protected readonly submitted = signal(false);

  protected readonly form = this.fb.group({
    clientCode: ['', Validators.required],
    propertyValue: [
      0,
      [
        Validators.required,
        Validators.min(1),
        Validators.pattern(/^\d+$/),
      ],
    ],
    requestedAmount: [
      0,
      [
        Validators.required,
        Validators.min(1),
        Validators.pattern(/^\d+$/),
      ],
    ],
    termYears: this.fb.control<TermYears>(15, Validators.required),
    consent: [false, Validators.requiredTrue],
  });

  ngOnInit(): void {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.changed.emit(
          this.form.valid ? this.form.getRawValue() : null,
        );
      });
  }

  protected formatAmount(
    controlName: 'propertyValue' | 'requestedAmount',
    event: Event,
  ): void {
    const input = event.target as HTMLInputElement;

    const numericValue = input.value.replace(/\D/g, '');

    const value = numericValue ? Number(numericValue) : 0;

    this.form.controls[controlName].setValue(value);

    queueMicrotask(() => {
      input.value = numericValue
        ? this.formatNumber(value)
        : '';
    });
  }

  protected formatNumber(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      maximumFractionDigits: 0,
      useGrouping: true,
    }).format(value);
  }

  protected consult(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();

    if (this.form.valid) {
      this.check.emit(this.form.getRawValue());
    }
  }

  protected submit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();

    if (this.form.valid) {
      this.submitRequest.emit(this.form.getRawValue());
    }
  }

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];

    return control.invalid && (control.touched || this.submitted());
  }

  protected loadingAttempts(): number {
    const state = this.submission();

    return state.kind === 'loading' ? state.attempts : 0;
  }

  protected submissionMessage(): string {
    const state = this.submission();

    return state.kind === 'uncertain' ||
      state.kind === 'conflict' ||
      state.kind === 'error'
      ? state.message
      : '';
  }

  protected submittedRecord() {
    const state = this.submission();

    return state.kind === 'success' ? state.record : null;
  }
}
