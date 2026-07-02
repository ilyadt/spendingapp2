import {createSpendingActionsWrapper} from "@/models/spendingActionsWrapper.ts";
import {type BudgetsWithSpentById, createBudgetsWithSpentStore} from "@/stores/budgets.ts";
import {SpendingActionsContext} from "@/models/contexts.ts";
import SpendingTable from "@/app/components/SpendingTable/SpendingTable.tsx";
import type {SpendingActions, SpendingRow} from "@/models/models.ts";
import {BudgetsContextProvider} from "@/facilities/BudgetsContextProvider.tsx";
import {composeSpActions} from "@/helpers/helper.ts";

type Props = {
  initBudgets: BudgetsWithSpentById
  initSpendings: SpendingRow[]
}

export function SpendingTableForTest({initBudgets, initSpendings}: Props) {
  const budgetsStore = createBudgetsWithSpentStore(initBudgets)
  const spActions: SpendingActions = composeSpActions([budgetsStore.getState()])

  return (
    <SpendingActionsContext value={createSpendingActionsWrapper(spActions)}>
      <BudgetsContextProvider store={budgetsStore}>
        <SpendingTable date={new Date('2026-06-24')} initSpendings={initSpendings} />
      </BudgetsContextProvider>
    </SpendingActionsContext>
  )
}
