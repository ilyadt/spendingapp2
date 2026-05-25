import SpendingTable from '@src/components/SpendingTable'
import {dateISO, dateRangePlusItemSet} from '@src/helpers/date'
import {useEffect, useRef} from "react";
import {useBudgetsWithSpent} from "@src/stores/budgets.ts";
import type {SpendingRow} from "@src/models/viewmodels.ts";
import {useSpendingRows} from "@src/stores/spendingRowsState.ts";

export function CrossBudgetView() {
  const budgets = Object.values(useBudgetsWithSpent(s => s.budgets))

  const {spendings, actions} = useSpendingRows(budgets.map(b => b.id))

  const spendingsByDate: Record<string, SpendingRow[]> = {}
  const spendingsDateSet = new Set<string>()

  // fill
  for (const s of spendings) {
      const key = dateISO(s.date)

      spendingsDateSet.add(dateISO(s.date))

      spendingsByDate[key] ??= []
      spendingsByDate[key].push(s)
  }

  const dates = dateRangePlusItemSet(
    budgets.map(b => b.dateFrom).sort().at(0)!,
    budgets.map(b => b.dateTo).sort().at(-1)!,
    spendingsDateSet,
  )

  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => todayRef.current?.scrollIntoView({behavior: 'smooth', block: 'center'}), [])

  const today = dateISO(new Date())

  return (
    <>
      {dates.map(date => (
        <div key={date} ref={date == today ? todayRef : undefined}>
          <SpendingTable
            date={new Date(date)}
            spendings={spendingsByDate[date] ?? []}
            spRowsActions={actions}
          ></SpendingTable>
        </div>
      ))}
    </>
  )
}