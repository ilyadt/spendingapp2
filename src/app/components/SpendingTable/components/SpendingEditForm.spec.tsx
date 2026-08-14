import {expect, test} from '@playwright/experimental-ct-react';
import {SpendingEditFormTest} from "@/app/components/SpendingTable/components/SpendingEditForm.story.tsx";
import {type BudgetsWithSpentById} from "@/stores/budgets.ts";
import type {SpendingRowExt} from "@/app/components/SpendingTable/components/SpendingEditForm.tsx";
import {vi, expect as viExpect} from "vitest";
import type {SpendingFormData} from "@/models/spendingFormData.ts";

test('SpendingEditForm', async ({mount, page}) => {
  page.on('dialog', () => null); // prevents auto-dismissing dialog

  const spending: SpendingRowExt = {
    budgetId: 1,
    id: "sp123-fs-d",
    version: "v1-xxx",
    date: new Date("2026-06-15"),
    amount: 342_00,
    currency: 'RUB',
    description: "мороженое",
    createdAt: new Date(),
    updatedAt: new Date(),
    receiptGroupId: 0,
    rowId: 23234989,
    rowIdx: 0,
    sort: 340,
  }

  const budgets: BudgetsWithSpentById = {
    1: {
      id: 1,
      dateFrom: new Date(),
      dateTo: new Date(),
      alias: 'food',
      name: 'еда',
      amount: 70_000,
      amountSpent: 7_000,
      currency: 'RUB',
      sort: 33,
      params: {},
    },
  }

  const onSave = vi.fn()

  await mount(<SpendingEditFormTest budgets={budgets} spending={spending} onSave={onSave}/>)

  const amount = page.getByRole('textbox', {name: 'amount'})
  const description = page.getByRole('textbox', {name: 'description'})

  await expect(amount).toHaveValue('342')
  await expect(description).toHaveValue('мороженое')

  await expect(page.getByRole('form')).toHaveScreenshot('sp-edit-form.png');

  await description.clear();

  page.once('dialog', async dialog => {
    expect(dialog.type()).toBe('alert');
    expect(dialog.message()).toBe('пустое описание')
    await dialog.accept();
  });

  await page.getByRole('button', {name: 'overlay'}).click();
  viExpect(onSave).not.toHaveBeenCalled()

  await amount.fill('350')
  await description.fill('ля-фам')
  await page.getByRole('button', {name: 'overlay'}).click();
  viExpect(onSave).toHaveBeenCalledWith(
    viExpect.objectContaining({
      amount: 350_00,
      description: 'ля-фам',
      date: new Date('2026-06-15'),
      budgetId: 1,
    } as SpendingFormData)
  )
})
