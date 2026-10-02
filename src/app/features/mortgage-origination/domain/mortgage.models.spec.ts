import {
  applicationFingerprint,
  assertValidApplication,
  evaluateViability,
  MortgageApplicationData,
} from './mortgage.models';

const base: MortgageApplicationData = {
  clientCode: '1001',
  propertyValue: 500_000_000,
  requestedAmount: 400_000_000,
  termYears: 15,
  consent: true,
};

describe('reglas hipotecarias', () => {
  it('acepta exactamente el 80% y exige ajuste un peso por encima', () => {
    expect(evaluateViability(base).decision).toBe('eligible-for-study');
    expect(evaluateViability({ ...base, requestedAmount: 400_000_001 })).toEqual({
      decision: 'requires-adjustment',
      reason: 'El monto solicitado supera el 80% del valor de la vivienda.',
    });
  });

  it.each([10, 15, 20] as const)('no cambia la regla para un plazo de %i años', (termYears) => {
    expect(evaluateViability({ ...base, termYears }).decision).toBe('eligible-for-study');
  });

  it('rechaza enteros no positivos y falta de consentimiento', () => {
    expect(() => assertValidApplication({ ...base, requestedAmount: 0 })).toThrow();
    expect(() => assertValidApplication({ ...base, propertyValue: 1.5 })).toThrow();
    expect(() => assertValidApplication({ ...base, consent: false })).toThrow();
  });

  it('produce fingerprints estables y sensibles a los datos', () => {
    expect(applicationFingerprint(base)).toBe(applicationFingerprint({ ...base }));
    expect(applicationFingerprint(base)).not.toBe(
      applicationFingerprint({ ...base, requestedAmount: 399_000_000 }),
    );
  });
});
