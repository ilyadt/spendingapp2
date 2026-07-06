import {test, expect} from '@playwright/experimental-ct-react';
import {SpendingTableForTest} from "./SpendingTable.story.tsx";
import type {SpendingRow} from "@/models/models.ts";
import type {BudgetsWithSpentById, BudgetWithSpent} from "@/stores/budgets.ts";


test('SpendingTable', async ({ mount, page }) => {
  page.on('dialog', () => null); // prevents auto-dismissing dialog

  const initBudgets: BudgetsWithSpentById = {
    1: {id: 1, description: 'еда', alias: 'food', currency: 'RUB', amount: 25000_00, amountSpent: 3000_00} as BudgetWithSpent,
  }

  const date = new Date('2026-06-24')

  const initSpendings = [
    {rowId: 1, budgetId: 1, id: 'id-1', version: '1', date, amount: 100_00, currency: 'RUB', description: 'чай', sort: 1} as SpendingRow,
    {rowId: 2, budgetId: 1, id: 'id-2', version: '1', date, amount: 50_00, currency: 'RUB', description: 'кофе', sort: 2} as SpendingRow,
    {rowId: 3, budgetId: 1, id: 'id-3', version: '1', date, amount: 70_00, currency: 'RUB', description: 'печенье', sort: 3} as SpendingRow,
  ]

  await mount(
    <SpendingTableForTest initBudgets={initBudgets} initSpendings={initSpendings} />
  )

  await page.getByText('кофе').click()

  await page.pause()

  await expect(page.getByRole('table')).toHaveScreenshot('table-edit-row.png');

  const rowBox = await page.getByRole('table').getByRole('row').nth(1).boundingBox()
  const formBox = await page.getByRole('form').getByRole('grid').boundingBox()

  expect(rowBox).not.toBeNull()
  expect(formBox).not.toBeNull()

  expectBoxEq(formBox!, rowBox!)
})


type Box = {x: number, y: number, width: number, height: number}

function expectBoxEq(act: Box, exp: Box) {
  expectWithin(act.x, exp.x)
  expectWithin(act.y, exp.y)
  expectWithin(act.width, exp.width)
  expectWithin(act.height, exp.height)
}

function expectWithin(actual: number, expected: number, delta = 1) {
  expect(actual).toBeGreaterThanOrEqual(expected - delta)
  expect(actual).toBeLessThanOrEqual(expected + delta)
}
