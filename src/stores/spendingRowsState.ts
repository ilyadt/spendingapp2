import type {Spending} from "@src/models/models.ts";
import type {SpendingRow} from "@src/models/viewmodels.ts";
import {genRandInt} from "@src/helpers/helper.ts";
import {useImmer} from "use-immer";

export interface SpendingRowsActions {
  createSpendingRow: (bid: number, sp: Spending) => SpendingRow
  patchSpendingRow: (internalRowId: number, patch: Partial<SpendingRow>) => void
  deleteSpendingRow: (internalRowId: number) => void
}

export function useSpendingRows(initSps: SpendingRow[]) {
  const [spendings, updateSpendings] = useImmer<SpendingRow[]>(() => initSps)

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

  const actions = {
    createSpendingRow,
    patchSpendingRow,
    deleteSpendingRow,
  }

  return [spendings, actions] as const
}
