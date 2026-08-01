import {expect, test} from '@playwright/experimental-ct-react';
import {SpendingEditFormTest} from "@/app/components/SpendingTable/components/SpendingEditForm.story.tsx";
import {type BudgetsWithSpentById} from "@/stores/budgets.ts";
import type {SpendingRowExt} from "@/app/components/SpendingTable/components/SpendingEditForm.tsx";

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

  await mount(<SpendingEditFormTest budgets={budgets} spending={spending}/>)

  expect(page.getByText('мороженое')).not.toBeNull()

  // TODO: role form
  await expect(page.getByRole('grid')).toHaveScreenshot('sp-edit-form.png');
})
