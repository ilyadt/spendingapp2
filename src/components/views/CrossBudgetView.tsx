import SpendingTable from '@src/components/SpendingTable'
import {dateISO, dateRangePlusItemSet} from '@src/helpers/date'
import {useEffect, useRef} from "react";
import {useBudgetsWithSpent} from "@src/stores/budgets.ts";
import {Facade} from "@src/facade.ts";
import {useSpendingRowsByDate} from "@src/stores/spendingRowsByDateState.ts";
import type {Spending} from "@src/models/models.ts";

export function CrossBudgetView() {
  const budgets = Object.values(
    useBudgetsWithSpent(s => s.budgets)
  )

  const spendingsByBudgetId: Record<number, Spending[]> = {}
  for (const b of budgets) {
    spendingsByBudgetId[b.id] = Facade.spendingsByBudgetId(b.id)
  }

  const [initSpendingsByDate, , emptyDate] = useSpendingRowsByDate(spendingsByBudgetId)

  const dates = dateRangePlusItemSet(
    budgets.map(b => b.dateFrom).sort().at(0)!,
    budgets.map(b => b.dateTo).sort().at(-1)!,
    new Set(Object.keys(initSpendingsByDate)),
  )

  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => todayRef.current?.scrollIntoView({behavior: 'smooth', block: 'center'}), [])

  const today = dateISO(new Date())

  return (
    <>
      {dates.map(date => (
        <div key={date} ref={date == today ? todayRef : undefined}>
          <SpendingTable
            key={date}
            date={new Date(date)}
            initSpendings={initSpendingsByDate[date] ?? []}
            onEmpty={() => emptyDate(date)}
          />
        </div>
      ))}
    </>
  )
}
