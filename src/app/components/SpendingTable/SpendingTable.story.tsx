import {type BudgetsWithSpentById, createBudgetsWithSpentStore} from "@/stores/budgets.ts";
import {SpendingActionsContext} from "@/models/contexts.ts";
import SpendingTable from "@/app/components/SpendingTable/SpendingTable.tsx";
import type {SpendingRow} from "@/models/models.ts";
import {BudgetsContextProvider} from "@/app/facilities/BudgetsContextProvider.tsx";
import {composeSpActions} from "@/helpers/helper.ts";

type Props = {
  initBudgets: BudgetsWithSpentById
  initSpendings: SpendingRow[]
}

export function SpendingTableForTest({initBudgets, initSpendings}: Props) {
  const budgetsStore = createBudgetsWithSpentStore(initBudgets)
  const spActions = composeSpActions([budgetsStore.getState()])

  return (
    <SpendingActionsContext value={spActions}>
      <BudgetsContextProvider store={budgetsStore}>
        <SpendingTable date={new Date('2026-06-24')} initSpendings={initSpendings} />
      </BudgetsContextProvider>
    </SpendingActionsContext>
  )
}
