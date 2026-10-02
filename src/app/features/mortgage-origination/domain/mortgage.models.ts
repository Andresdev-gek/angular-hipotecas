export type TermYears = 10 | 15 | 20;
export type ViabilityDecision = 'eligible-for-study' | 'requires-adjustment';

export interface MortgageApplicationData {
  clientCode: string;
  propertyValue: number;
  requestedAmount: number;
  termYears: TermYears;
  consent: boolean;
}

export interface ViabilityResult {
  decision: ViabilityDecision;
  reason: string | null;
}

export interface ApplicationRecord {
  reference: string;
  data: MortgageApplicationData;
  submittedAt: string;
  status: 'submitted';
  viability: ViabilityResult;
}

export interface SubmissionCommand {
  reference: string;
  data: MortgageApplicationData;
}

export interface HistorySearchResult {
  items: ApplicationRecord[];
  total: number;
}

export class ReferenceConflictError extends Error {
  constructor() {
    super('La referencia ya fue procesada con datos diferentes. Se conservó el registro original.');
  }
}

export class ConfirmationLostError extends Error {
  constructor() {
    super('La solicitud pudo registrarse, pero no llegó la confirmación. Reintenta con la misma referencia.');
  }
}

export class SimulatedServiceError extends Error {
  constructor(message = 'El servicio simulado no respondió. Puedes intentarlo de nuevo.') {
    super(message);
  }
}

export function assertValidApplication(data: MortgageApplicationData): void {
  const validAmount = (value: number) => Number.isSafeInteger(value) && value > 0;
  if (
    !data.clientCode.trim() ||
    !validAmount(data.propertyValue) ||
    !validAmount(data.requestedAmount) ||
    !([10, 15, 20] as number[]).includes(data.termYears) ||
    !data.consent
  ) {
    throw new Error('Los datos de la solicitud no son válidos.');
  }
}

export function evaluateViability(data: MortgageApplicationData): ViabilityResult {
  assertValidApplication(data);
  return data.requestedAmount <= data.propertyValue * 0.8
    ? { decision: 'eligible-for-study', reason: null }
    : {
        decision: 'requires-adjustment',
        reason: 'El monto solicitado supera el 80% del valor de la vivienda.',
      };
}

export function applicationFingerprint(data: MortgageApplicationData): string {
  return JSON.stringify([
    data.clientCode.trim(),
    data.propertyValue,
    data.requestedAmount,
    data.termYears,
    data.consent,
  ]);
}
