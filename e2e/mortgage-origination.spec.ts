import { expect, Page, test } from '@playwright/test';

async function completeForm(page: Page, requestedAmount = '400000000'): Promise<void> {
  await page.getByLabel('Código de cliente').fill('1001');
  await page.getByLabel('Valor de la vivienda (COP)').fill('500000000');
  await page.getByLabel('Monto solicitado (COP)').fill(requestedAmount);
  await page.getByRole('checkbox').check();
}

async function getSubmittedReference(page: Page): Promise<string> {
  const successMessage = page.getByText('Solicitud radicada').locator('..');

  await expect(successMessage).toBeVisible();

  const referenceText = successMessage.locator('p').nth(1);

  await expect(referenceText).toContainText(/HYP-[A-F0-9]{8}/);

  const text = await referenceText.textContent();
  const match = text?.match(/HYP-[A-F0-9]{8}/);

  expect(match).not.toBeNull();

  return match![0];
}

test('aplica la frontera inclusiva del 80% y descarta resultados obsoletos', async ({ page }) => {
  await page.goto('/originacion');

  await completeForm(page);

  await page.getByRole('button', { name: 'Consultar viabilidad' }).click();

  await expect(page.getByText('Apta para estudio').first()).toBeVisible();

  await page.getByLabel('Monto solicitado (COP)').fill('400000001');

  await expect(
    page.getByText(/Los datos cambiaron\. El resultado anterior ya no se considera vigente/i),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Consultar viabilidad' }).click();

  await expect(page.getByText('Requiere ajuste').first()).toBeVisible();

  await expect(page.getByText(/supera el 80%/i)).toBeVisible();
});

test('mantiene el resultado más reciente cuando las respuestas llegan fuera de orden', async ({
  page,
}) => {
  await page.goto('/originacion?scenario=out-of-order');

  await completeForm(page, '450000000');

  await page.getByRole('button', { name: 'Consultar viabilidad' }).click();

  await page.getByLabel('Monto solicitado (COP)').fill('350000000');

  await page.getByRole('button', { name: 'Consultar viabilidad' }).click();

  await expect(page.getByText('Apta para estudio').first()).toBeVisible();

  await page.waitForTimeout(800);

  await expect(page.getByText('Apta para estudio').first()).toBeVisible();
});

test('recupera una confirmación perdida con la misma referencia', async ({ page }) => {
  await page.goto('/originacion?scenario=lost-confirmation');

  await completeForm(page);

  await page.getByRole('button', { name: 'Radicar solicitud' }).click();

  await expect(page.getByText(/pudo registrarse, pero no llegó la confirmación/i)).toBeVisible();

  await page.getByRole('button', { name: 'Reintentar radicación' }).click();

  await expect(page.getByText('Solicitud radicada')).toBeVisible();

  const reference = await getSubmittedReference(page);

  await page.getByLabel('Buscar solicitud').fill(reference);

  await expect(page.getByRole('cell', { name: reference })).toHaveCount(1);
});

test('varios envíos demorados crean un solo registro', async ({ page }) => {
  await page.goto('/originacion?scenario=submission-delay');

  await completeForm(page);

  const submit = page.getByRole('button', {
    name: 'Radicar solicitud',
  });

  await submit.click();

  await expect(page.getByText(/Radicando intento 1/i)).toBeVisible();

  await submit.click();

  await expect(page.getByText('Solicitud radicada')).toBeVisible();

  const reference = await getSubmittedReference(page);

  await page.getByLabel('Buscar solicitud').fill(reference);

  await expect(page.getByRole('cell', { name: reference })).toHaveCount(1);
});

test('busca entre los 5000 registros y diferencia una lista vacía', async ({ page }) => {
  await page.goto('/originacion');

  await expect(
    page.getByText('Solicitudes encontradas').locator('..').getByText('5000'),
  ).toBeVisible();

  await page.getByLabel('Buscar solicitud').fill('HYP-2026-000001');

  await expect(
    page.getByText('Solicitudes encontradas').locator('..').getByText('1'),
  ).toBeVisible();

  await expect(page.getByRole('cell', { name: 'HYP-2026-000001' })).toBeVisible();

  await page.getByLabel('Buscar solicitud').fill('SIN-COINCIDENCIAS');

  await expect(page.getByText('No hay solicitudes para mostrar.')).toBeVisible();
});
