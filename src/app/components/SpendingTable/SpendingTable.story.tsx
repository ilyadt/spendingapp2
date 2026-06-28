import {createCudSpendingWrapper} from "@/models/cudSpendingWrapper.ts";
import type {CudSpending} from "@/facade.ts";
import {type BudgetWithSpent, createBudgetsWithSpentStore} from "@/stores/budgets.ts";
import {SpendingsStoreActionsContext} from "@/models/contexts.ts";
import SpendingTable from "@/app/components/SpendingTable/SpendingTable.tsx";
import type {SpendingRow} from "@/models/models.ts";
import {BudgetsContextProvider} from "@/facilities/BudgetsContextProvider.tsx";

export function SpendingTableForTest() {
  const initBudgets = {
    1: {id: 1, description: 'еда', alias: 'food', currency: 'RUB', amount: 25000_00, amountSpent: 3000_00} as BudgetWithSpent
  }

  const budgetsStore = createBudgetsWithSpentStore(initBudgets)

  const spActions: CudSpending = {
    createSpending: budgetsStore.getState().createSpending,
    updateSpending: budgetsStore.getState().updateSpending,
    deleteSpending: budgetsStore.getState().deleteSpending,
  }

  return (
    <SpendingsStoreActionsContext value={createCudSpendingWrapper(spActions)}>
      <BudgetsContextProvider store={budgetsStore}>
        <SpendingTable date={new Date('2026-06-24')} initSpendings={[
          {
            rowId: 933,
            budgetId: 1,
            id: 'id-1',
            version: '1',
            date: new Date('2026-06-10'),
            amount: 100_00,
            currency: 'RUB',
            description: 'something',
            sort: 1,
          } as SpendingRow
        ]} />
      </BudgetsContextProvider>
    </SpendingsStoreActionsContext>
  )
}
