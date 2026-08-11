import type {SpendingFormData} from "@/models/spendingFormData.ts";
import {type BudgetsWithSpentById, createBudgetsWithSpentStore} from "@/stores/budgets.ts";
import {BudgetsContextProvider} from "@/app/facilities/BudgetsContextProvider.tsx";
import SpendingEditForm, {type SpendingRowExt} from "@/app/components/SpendingTable/components/SpendingEditForm.tsx";

type Props = {
  spending: SpendingRowExt,
  budgets: BudgetsWithSpentById
  onSave: (fd: SpendingFormData) => void
}

export function SpendingEditFormTest({spending, budgets, onSave}: Props) {
  const onCancel = (_fd: SpendingFormData) => undefined;
  const budgetsStore = createBudgetsWithSpentStore(budgets)

  return (
    <BudgetsContextProvider store={budgetsStore}>
      <SpendingEditForm sp={spending} save={onSave} cancel={onCancel} />
    </BudgetsContextProvider>
  )
}
