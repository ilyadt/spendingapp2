import SpendingTable from '../components/SpendingTable/SpendingTable'
import {dateISO, dateRangePlusItemSet} from '@/helpers/date'
import {use, useEffect, useMemo, useRef} from "react";
import useSpendingRowsByDate from "@/state/spendingRowsByDate.ts";
import type {SpendingRow} from "@/models/models.ts";
import {BudgetsContext, SpendingsContext} from "@/models/contexts.ts";
import { genRandInt } from '@/helpers/helper';

export function CrossBudgetScreen() {
  const budgetsById = use(BudgetsContext)
  const spendingsStore = use(SpendingsContext)

  const budgets = Object.values(budgetsById)

  const spRows: SpendingRow[] = []
  for (const b of budgets) {
    for (const sp of spendingsStore.spendingsByBudgetId(b.id)) {
      spRows.push({rowId: genRandInt(), budgetId: b.id, ...sp})
    }
  }

  const [spRowsByDate, setDateSpendingRows] = useSpendingRowsByDate(spRows)

  const budgetsDatesSorted = budgets
    .map(b => b.dateFrom)
    .sort((a, b) => a.getTime() - b.getTime())

  const dates = dateRangePlusItemSet(
    budgetsDatesSorted.at(0)!,
    budgetsDatesSorted.at(-1)!,
    new Set(Object.keys(spRowsByDate)),
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
            initSpendings={spRowsByDate[date] ?? []}
            onEmpty={() => setDateSpendingRows(date, [])}
            opacity={today === date ? 1 : 0.5}
          />
        </div>
      ))}
    </div>
  )
}
