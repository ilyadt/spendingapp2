import {useImmer} from "use-immer";
import {dateISO} from "@/helpers/date.ts";
import type {SpendingRow} from "@/models/models.ts";

type DateISO = string

type SpendingsByDate = Record<DateISO,SpendingRow[]>

export default function useSpendingRowsByDate(initSps: SpendingRow[]) {
  const [spRowsByDate, updateSpendings] = useImmer<SpendingsByDate>(() => {
    const grouped: SpendingsByDate = {}

    for (const sp of initSps) {
      const key = dateISO(sp.date)

      grouped[key] ??= []
      grouped[key].push(sp)
    }

    return grouped
  })

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
