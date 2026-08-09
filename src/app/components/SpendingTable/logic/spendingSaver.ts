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

    if (isNewSp || budgetChanged) {
      const createSp =  buildCreateSpObj(spData, now)
      spActions.createSpending(spData.budget.id, createSp)

      return createSp
    } else {
      const updSp = buildUpdateSpObj(oldRow, spData, now)
      spActions.updateSpending(oldRow.budgetId, updSp)

      return updSp
    }
  }
})
