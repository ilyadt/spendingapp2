import {useImmer} from "use-immer";
import {dateISO} from "@src/helpers/date.ts";
import type {Spending, SpendingRow} from "@src/models/models.ts";
import {genRandInt} from "@src/helpers/helper.ts";
import type {SpendingTableHandle} from "@src/components/SpendingTable.tsx";
import {useRef} from "react";

type DateISO = string

type SpendingsByDate = Record<DateISO,SpendingRow[]>

export function useSpendingRowsByDate(initSps: Record<number, Spending[]>) {
  const tableRefs = useRef<Record<DateISO, SpendingTableHandle | null>>({})

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

  function addSpendingRow(bid: number, sp: Spending) {
    const dateStr = dateISO(sp.date)

    const tbl = tableRefs.current[dateStr]

    if (tbl) {
      tbl.addSpendingRow({
        ...sp,
        rowId: genRandInt(),
        budgetId: bid,
      })
      return
    }

    updateSpendings(draft => {
      if (!draft[dateStr]) {
        const spRow: SpendingRow = {
          rowId: genRandInt(),
          budgetId: bid,
          ...sp,
        }

        draft[dateStr] = [spRow]
      }
    })
  }

  function emptyDate(date: DateISO) {
    updateSpendings(draft => { delete draft[date] })
  }

  return [initSpendings, addSpendingRow, emptyDate, tableRefs] as const
}
