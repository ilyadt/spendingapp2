import type {Spending, SpendingRow} from "@src/models/models.ts";
import {genRandInt} from "@src/helpers/helper.ts";
import {useImmer} from "use-immer";

export interface SpendingRowsActions {
  createSpendingRow: (bid: number, sp: Spending) => SpendingRow
  patchSpendingRow: (internalRowId: number, patch: Partial<SpendingRow>) => void
  deleteSpendingRow: (internalRowId: number) => void
}

export function useSpendingRows(initSps: SpendingRow[], onEmpty?: () => void) {
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
    updateSpendings(sps => {
      const idx = sps.findIndex(s => s.rowId === rowId)

      if (idx < 0) {
        return
      }

      sps.splice(idx, 1)

      if (sps.length === 0) {
        onEmpty?.()
      }
    })
  }

  const actions = {
    createSpendingRow,
    patchSpendingRow,
    deleteSpendingRow,
  }

  return [spendings, actions] as const
}
