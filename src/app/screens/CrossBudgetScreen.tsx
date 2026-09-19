import SpendingTable from '../components/SpendingTable/SpendingTable'
import {dateISO, dateRangePlusItemSet} from '@/helpers/date'
import {use, useEffect, useMemo, useRef} from "react";
import useSpendingRowsByDate from "@/state/spendingRowsByDate.ts";
import type {Spending} from "@/models/models.ts";
import {BudgetsContext, SpendingsContext} from "@/models/contexts.ts";

export function CrossBudgetScreen() {
  const budgetsById = use(BudgetsContext)
  const spendingsStore = use(SpendingsContext)

  const budgets = Object.values(budgetsById)

  const spendingsByBudgetId: Record<number, Spending[]> = {}
  for (const b of budgets) {
    spendingsByBudgetId[b.id] = spendingsStore.spendingsByBudgetId(b.id)
  }

  const [initSpendingsByDate, , clearSpendings] = useSpendingRowsByDate(spendingsByBudgetId)

  const budgetsDatesSorted = budgets
    .map(b => b.dateFrom)
    .sort((a, b) => a.getTime() - b.getTime())

  const dates = dateRangePlusItemSet(
    budgetsDatesSorted.at(0)!,
    budgetsDatesSorted.at(-1)!,
    new Set(Object.keys(initSpendingsByDate)),
  )

  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => { todayRef.current?.scrollIntoView({behavior: 'smooth', block: 'center'}) }, [])

  const today = useMemo(() => dateISO(new Date()), [])

  return (
    <div>
      {dates.map(date => (
        <div key={date} ref={date == today ? todayRef : undefined}>
          <SpendingTable
            key={date}
            date={new Date(date)}
            initSpendings={initSpendingsByDate[date] ?? []}
            onEmpty={() => clearSpendings(date)}
            opacity={today === date ? 1 : 0.5}
          />
        </div>
      ))}
    </div>
  )
}
