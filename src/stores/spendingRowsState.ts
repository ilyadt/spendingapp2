import type {SpendingRow} from "@src/models/models.ts";
import {useImmer} from "use-immer";
export function useSpendingRows(initSps: SpendingRow[], onEmpty?: () => void) {
  const [spendings, updateSpendings] = useImmer<SpendingRow[]>(() => initSps)

  function addSpendingRow(spRow: SpendingRow) {
    updateSpendings(prev => { prev.push(spRow) })
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
    addSpendingRow,
    patchSpendingRow,
    deleteSpendingRow,
  }

  return [spendings, actions] as const
}
