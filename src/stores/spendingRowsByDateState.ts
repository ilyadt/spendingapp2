import {useImmer} from "use-immer";
import {dateISO} from "@src/helpers/date.ts";
import type {Spending, SpendingRow} from "@src/models/models.ts";
import {genRandInt} from "@src/helpers/helper.ts";
import type {SpendingTableHandle} from "@src/components/SpendingTable.tsx";
import {type RefObject} from "react";

type DateISO = string

type SpendingsByDate = Record<DateISO,SpendingRow[]>

export function useSpendingRowsByDate(initSps: Record<number, Spending[]>, tableRefs?: RefObject<Record<DateISO, SpendingTableHandle|null>>) {
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

    const tbl = tableRefs?.current[dateStr]

    if (tbl) {
      tbl.addSpendingRow({
        ...sp,
        rowId: genRandInt(),
        budgetId: bid,
      })
      return
    }

    updateSpendings(initSpendings => {
      if (!initSpendings[dateStr]) {
        const spRow: SpendingRow = {
          rowId: genRandInt(),
          budgetId: bid,
          ...sp,
        }

        initSpendings[dateStr] = [spRow]
      }
    })
  }

  function clearSpendings(date: DateISO) {
    updateSpendings(initSpendings => { delete initSpendings[date] })
  }

  return [initSpendings, addSpendingRow, clearSpendings] as const
}
