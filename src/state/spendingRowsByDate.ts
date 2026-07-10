import {useImmer} from "use-immer";
import {dateISO} from "@/helpers/date.ts";
import type {Spending, SpendingRow} from "@/models/models.ts";
import {genRandInt} from "@/helpers/helper.ts";

type DateISO = string

type SpendingsByDate = Record<DateISO,SpendingRow[]>

export default function useSpendingRowsByDate(initSps: Record<number, Spending[]>) {
  const [initSpendings, updateSpendings] = useImmer<SpendingsByDate>(() => {
    const grouped: SpendingsByDate = {}

    for (const [bid, sps] of Object.entries(initSps)) {
      for (const s of sps) {
        const key = dateISO(s.date)

        grouped[key] ??= []
        grouped[key].push({
          rowId: genRandInt(),
          budgetId: Number(bid),
          ...s,
        })
      }
    }

    return grouped
  })

  function setInitSpending(date: DateISO, spRow: SpendingRow) {
    updateSpendings(initSpendings => {
      initSpendings[date] = [spRow];
    })
  }

  function clearSpendings(date: DateISO) {
    updateSpendings(initSpendings => { delete initSpendings[date] })
  }

  return [initSpendings, setInitSpending, clearSpendings] as const
}
