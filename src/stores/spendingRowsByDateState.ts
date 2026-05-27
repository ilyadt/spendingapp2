import type {SpendingRow} from "@src/models/viewmodels.ts";
import {useImmer} from "use-immer";
import {dateISO} from "@src/helpers/date.ts";
import type {Spending} from "@src/models/models.ts";
import {genRandInt} from "@src/helpers/helper.ts";

type SpendingsByDate = Record<
  string,
  {
    key: number
    values: SpendingRow[]
  }
>

export function useSpendingRowsByDate(initSps: Record<number, Spending[]>) {
  const [spendings, updateSpendings] = useImmer<SpendingsByDate>(() => {
    const grouped: SpendingsByDate = {}

    for (const [bid, sps] of Object.entries(initSps)) {
      for (const s of sps) {
        const key = dateISO(s.date)

        grouped[key] ??= {key: s.date.getTime(), values: []}
        grouped[key].values.push({
          rowId: genRandInt(),
          budgetId: Number(bid),
          ...s,
        })
      }
    }

    return grouped
  })

  function addSpendingRow(bid: number, sp: Spending): SpendingRow {
    const spRow: SpendingRow = {
      rowId: genRandInt(),
      budgetId: bid,
      ...sp,
    }

    const dateStr = dateISO(spRow.date)

    updateSpendings(draft => {
      draft[dateStr] ??= { key: spRow.date.getTime(), values: [] }

      draft[dateStr].key++;
      draft[dateStr].values.push(spRow)
    })

    return spRow
  }

  return [spendings, addSpendingRow] as const
}
