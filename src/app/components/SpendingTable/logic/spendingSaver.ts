import {isNew, type Spending, type SpendingActions, type SpendingRow} from "@/models/models.ts";
import {
  buildCreateSpObj,
  buildDeleteSpObj,
  buildUpdateSpObj,
  type SpendingData
} from "@/helpers/spendingBuilder.ts";

export const createSpendingSaver = (spActions: SpendingActions) => ({
  save(oldRow: SpendingRow, data: SpendingData, now: Date): Spending {
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
      spObj = buildUpdateSpObj(oldRow, spData, now)
      spActions.updateSpending(oldRow.budgetId, spObj)
    }

    return spObj
  }
})
