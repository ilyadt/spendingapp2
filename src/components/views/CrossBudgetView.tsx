import SpendingTable from '@src/components/SpendingTable'
import { Facade } from '@src/facade'
import {dateISO, dateRangePlusItemSet} from '@src/helpers/date'
import {useEffect, useRef} from "react";
import {useBudgetsWithSpent} from "@src/stores/budgets.ts";
import {useImmer} from "use-immer";
import type {SpendingRow} from "@src/models/viewmodels.ts";
import {genRandInt} from "@src/helpers/helper.ts";

export function CrossBudgetView() {
  const budgets = Object.values(useBudgetsWithSpent(s => s.budgets))

  const [spendings, updateSpendings] = useImmer<SpendingRow[]>(() =>
    budgets.flatMap(b =>
      Facade.spendingsByBudgetId(b.id).map((s):SpendingRow => ({
        ...s,
        budgetId: b.id,
        internalRowId: genRandInt(),
      }))
    )
  )

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
            showBudgetCol={true}
            updateSpendings={updateSpendings}
          ></SpendingTable>
        </div>
      ))}
    </>
  )
}