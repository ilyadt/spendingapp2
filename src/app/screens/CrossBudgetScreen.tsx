import SpendingTable from '../components/SpendingTable/SpendingTable'
import {dateISO, dateRangePlusItemSet} from '@/helpers/date'
import {useContext, useEffect, useRef} from "react";
import {Facade} from "@/facade.ts";
import useSpendingRowsByDate from "@/state/spendingRowsByDate.ts";
import type {Spending} from "@/models/models.ts";
import {BudgetsContext} from "@/models/contexts.ts";

export function CrossBudgetScreen() {
  const budgets = Object.values(useContext(BudgetsContext))

  const spendingsByBudgetId: Record<number, Spending[]> = {}
  for (const b of budgets) {
    spendingsByBudgetId[b.id] = Facade.spendingsByBudgetId(b.id)
  }

  const [initSpendingsByDate, , clearSpendings] = useSpendingRowsByDate(spendingsByBudgetId)

  const dates = dateRangePlusItemSet(
    budgets.map(b => b.dateFrom).sort().at(0)!,
    budgets.map(b => b.dateTo).sort().at(-1)!,
    new Set(Object.keys(initSpendingsByDate)),
  )

  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => todayRef.current?.scrollIntoView({behavior: 'smooth', block: 'center'}), [])

  const today = dateISO(new Date())

  return (
    <div>
      {dates.map(date => (
        <div key={date} ref={date == today ? todayRef : undefined}>
          <SpendingTable
            key={date}
            date={new Date(date)}
            initSpendings={initSpendingsByDate[date] ?? []}
            onEmpty={() => clearSpendings(date)}
          />
        </div>
      ))}
    </div>
  )
}
