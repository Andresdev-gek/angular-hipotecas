import { expect, Page, test } from '@playwright/test';

async function completeForm(page: Page, requestedAmount = '400000000') {
  await page.getByLabel('Código de cliente').fill('1001');
  await page.getByLabel('Valor de la vivienda (COP)').fill('500000000');
  await page.getByLabel('Monto solicitado (COP)').fill(requestedAmount);
  await page.getByRole('checkbox').check();
}

test('aplica la frontera inclusiva del 80% y descarta resultados obsoletos', async ({ page }) => {
  await page.goto('/originacion');
  await completeForm(page);

  await page.getByRole('button', { name: 'Consultar viabilidad' }).click();
  await expect(page.getByText('Apta para estudio').first()).toBeVisible();

  await page.getByLabel('Monto solicitado (COP)').fill('400000001');
  await expect(page.getByText(/resultado anterior ya no se considera vigente/i)).toBeVisible();
  await page.getByRole('button', { name: 'Consultar viabilidad' }).click();
  await expect(page.getByText('Requiere ajuste').first()).toBeVisible();
  await expect(page.getByText(/supera el 80%/i)).toBeVisible();
});

test('mantiene B visible cuando A llega después', async ({ page }) => {
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
  const reference = (await page.getByText(/^HYP-[A-F0-9]{8}$/).textContent())!;

  await page.getByRole('button', { name: 'Radicar solicitud' }).click();
  await expect(page.getByText(/pudo registrarse, pero no llegó la confirmación/i)).toBeVisible();
  await page.getByRole('button', { name: 'Reintentar radicación' }).click();
  await expect(page.getByText('Solicitud radicada')).toBeVisible();
  await expect(page.getByText(reference).last()).toBeVisible();

  await page.getByLabel('Buscar por cliente o referencia').fill(reference);
  await expect(page.getByRole('cell', { name: reference })).toHaveCount(1);
});

test('varios envíos demorados crean un solo registro', async ({ page }) => {
  await page.goto('/originacion?scenario=submission-delay');
  await completeForm(page);
  const reference = (await page.getByText(/^HYP-[A-F0-9]{8}$/).textContent())!;
  const submit = page.getByRole('button', { name: 'Radicar solicitud' });

  await submit.click();
  await submit.click();
  await page.getByLabel('Monto solicitado (COP)').fill('300000000');
  await expect(page.getByText('Solicitud radicada')).toBeVisible();

  await page.getByLabel('Buscar por cliente o referencia').fill(reference);
  await expect(page.getByRole('cell', { name: reference })).toHaveCount(1);
});

test('busca 5.000 registros y diferencia lista vacía', async ({ page }) => {
  await page.goto('/originacion');
  await expect(page.getByText('5000 coincidencias')).toBeVisible();

  await page.getByLabel('Buscar por cliente o referencia').fill('HYP-2026-000001');
  await expect(page.getByText('1 coincidencias')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'HYP-2026-000001' })).toBeVisible();

  await page.getByLabel('Buscar por cliente o referencia').fill('SIN-COINCIDENCIAS');
  await expect(page.getByText(/No hay solicitudes/)).toBeVisible();
});
