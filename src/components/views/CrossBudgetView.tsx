import SpendingTable from '@src/components/SpendingTable'
import { Facade } from '@src/facade'
import {dateISO, dateRangePlusItemSet} from '@src/helpers/date'
import {toMajorUnits} from '@src/helpers/money'
import {type SpendingRow} from "@src/models/viewmodels.ts";
import {useEffect, useRef, useState} from "react";
import {useBudgetsWithSpent} from "@src/stores/budgets.ts";

export function CrossBudgetView() {
  const budgets = Object.values(useBudgetsWithSpent(s => s.budgets))

  const [{spendingsByDate, spendingsDateSet}] = useState(() => {
    const spendingsByDate: Record<string, SpendingRow[]> = {}
    const spendingsDateSet = new Set<string>()

    // fill
    for (const b of budgets) {
      const spendings = Facade.spendingsByBudgetId(b.id)

      for (const s of spendings) {
        const key = dateISO(s.date)

        spendingsDateSet.add(dateISO(s.date))

        spendingsByDate[key] ??= []
        spendingsByDate[key].push({
          amountFull: toMajorUnits(s.amount, s.currency),
          budgetId: b.id,
          createdAt: s.createdAt,
          currency: s.currency,
          date: s.date,
          description: s.description,
          id: s.id,
          receiptGroupId: s.receiptGroupId,
          sort: s.sort,
          updatedAt: s.updatedAt,
          version: s.version,
        })
      }
    }

    return {spendingsByDate, spendingsDateSet}
  })

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
            showBudgetCol={false}
          ></SpendingTable>
        </div>
      ))}
    </>
  )
}