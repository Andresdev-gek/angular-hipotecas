import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const output = resolve('public/data/applications.json');
const terms = [10, 15, 20];
const records = Array.from({ length: 5_000 }, (_, index) => {
  const id = index + 1;
  const propertyValue = 180_000_000 + ((id * 7_919) % 620_000_000);
  const eligible = id % 4 !== 0;
  const requestedAmount = eligible
    ? Math.floor(propertyValue * (0.55 + (id % 26) / 100))
    : Math.floor(propertyValue * (0.81 + (id % 10) / 100));

  return {
    reference: `HYP-2026-${String(id).padStart(6, '0')}`,
    data: {
      clientCode: `CLI-${String(((id * 37) % 9_997) + 1).padStart(6, '0')}`,
      propertyValue,
      requestedAmount,
      termYears: terms[id % terms.length],
      consent: true,
    },
    submittedAt: new Date(Date.UTC(2026, 0, 1, 12, id % 60, id % 60)).toISOString(),
    status: 'submitted',
    viability: {
      decision: eligible ? 'eligible-for-study' : 'requires-adjustment',
      reason: eligible ? null : 'El monto solicitado supera el 80% del valor de la vivienda.',
    },
  };
});

if (new Set(records.map(({ reference }) => reference)).size !== 5_000) {
  throw new Error('Las referencias generadas no son únicas.');
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
console.log(`Generated ${records.length} deterministic records at ${output}`);
