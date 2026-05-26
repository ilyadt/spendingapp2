import type {Spending} from "@src/models/models.ts";
import type {SpendingRow} from "@src/models/viewmodels.ts";
import {genRandInt} from "@src/helpers/helper.ts";
import {useImmer} from "use-immer";
import {Facade} from "@src/facade.ts";

export interface SpendingRowsActions {
  createSpendingRow: (bid: number, sp: Spending) => SpendingRow
  patchSpendingRow: (internalRowId: number, patch: Partial<SpendingRow>) => void
  deleteSpendingRow: (internalRowId: number) => void
}

export function useSpendingRows(bids: number[]) {
  const [spendings, updateSpendings] = useImmer<SpendingRow[]>(() =>
    bids.flatMap(bid =>
      Facade.spendingsByBudgetId(bid).map((s):SpendingRow => ({
        ...s,
        budgetId: bid,
        rowId: genRandInt(),
      }))
    )
  )

  function createSpendingRow(bid: number, sp: Spending): SpendingRow {
    const spRow: SpendingRow = {
      rowId: genRandInt(),
      budgetId: bid,
      ...sp,
    }

    updateSpendings(prev => { prev.push(spRow) })

    return spRow
  }

  function patchSpendingRow(rowId: number, patch: Partial<SpendingRow>) {
    updateSpendings((sps) => {
      Object.assign(
        sps.find((s) => s.rowId === rowId)!,
        patch,
      )
    })
  }

  function deleteSpendingRow(rowId: number) {
    updateSpendings(sps => sps.filter(s => s.rowId != rowId))
  }

  return {
    spendings,
    actions: {
      createSpendingRow,
      patchSpendingRow,
      deleteSpendingRow,
    }
  }
}
