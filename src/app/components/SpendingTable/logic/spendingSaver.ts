import {isNew, type Spending, type SpendingActions, type SpendingPrev, type SpendingRow} from "@/models/models.ts";
import {
  buildCreateSpObj,
  buildDeleteSpObj,
  buildUpdateSpObj,
  type SpendingData
} from "@/helpers/spendingBuilder.ts";

export type SavedSpending = Spending & {prev?: SpendingPrev}

export const createSpendingSaver = (spActions: SpendingActions) => ({
  save(oldRow: SpendingRow, data: SpendingData, now: Date): SavedSpending {
    const isNewSp = isNew(oldRow)
    const budgetChanged = (oldRow.budgetId !== data.budget.id)

    if (!isNewSp && budgetChanged) {
      spActions.deleteSpending(oldRow.budgetId, buildDeleteSpObj(oldRow, now))
    }

    const spData: SpendingData = {
      sort: oldRow.sort ?? undefined,
      receiptId: oldRow.receiptGroupId ?? undefined,
      ...data,
    }

    let spObj: Spending

    if (isNewSp || budgetChanged) {
      spObj =  buildCreateSpObj(spData, now)
      spActions.createSpending(spData.budget.id, spObj)
    } else {
      const updSp = buildUpdateSpObj(oldRow, spData, now)
      spActions.updateSpending(oldRow.budgetId, updSp)

      spObj = updSp
    }

    return spObj
  }
})
