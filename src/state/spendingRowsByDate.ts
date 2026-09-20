import {useImmer} from "use-immer";
import type {SpendingRow} from "@/models/models.ts";

type DateISO = string

export type SpendingsByDate = Record<DateISO,SpendingRow[]>

export default function useSpendingRowsByDate(initSps: () => SpendingsByDate) {
  const [spRowsByDate, updateSpendings] = useImmer<SpendingsByDate>(initSps)

  function setDateSpendingRows(date: DateISO, spRows: SpendingRow[]) {
    updateSpendings(spendingRows => {
      if (spRows.length === 0) {
         delete spendingRows[date]
         return
      }
      spendingRows[date] = spRows;
    })
  }

  return [spRowsByDate, setDateSpendingRows] as const
}
