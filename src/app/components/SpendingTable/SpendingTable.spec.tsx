import { test, expect } from '@playwright/experimental-ct-react';
import SpendingTable from "./SpendingTable.tsx";
import {BudgetsContext, SpendingsStoreActionsContext} from "@/models/contexts.ts";
import type {BudgetWithSpent} from "@/stores/budgets.ts";
import type {CudSpending} from "@/facade.ts";
import {createCudSpendingWrapper} from "@/models/cudSpendingWrapper.ts";
import { vi } from 'vitest'

test('SpendingTable', async ({ mount, page }) => {
  page.on('dialog', () => null); // prevents auto-dismissing dialog

  const spActions = createCudSpendingWrapper({
    createSpending: vi.fn(),
    updateSpending: vi.fn(),
    deleteSpending: vi.fn(),
  } as CudSpending)

  const budgets = {1: {id: 1, description: 'еда', alias: 'food', currency: 'RUB', amount: 25000_00, amountSpent: 3000_00} as BudgetWithSpent}

  const component = await mount(
    <SpendingsStoreActionsContext value={spActions}>
      <BudgetsContext value={budgets}>
        <SpendingTable date={new Date('2026-06-24')} initSpendings={[]} />
      </BudgetsContext>
    </SpendingsStoreActionsContext>
  );

  await component.page().pause()
  await expect(page).toHaveScreenshot();
});
