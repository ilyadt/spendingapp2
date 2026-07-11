import {dateFormat, dateISO, dateRangePlusItemSet} from '@/helpers/date'
import {toMajorUnits} from '@/helpers/money'
import SpendingTable, {type SpendingTableHandle} from '../components/SpendingTable/SpendingTable'
import type {BudgetWithSpent} from "@/stores/budgets.ts";
import useSpendingRowsByDate from "@/state/spendingRowsByDate.ts";
import {useContext, useRef} from "react";
import {SpendingsContext} from "@/models/contexts.ts";
import type {SpendingRow} from "@/models/models.ts";
import AddSpendingForm from "@/app/components/AddSpendingForm.tsx";

export function BudgetScreen({budget}: {budget: BudgetWithSpent}) {
  const spendingsStore = useContext(SpendingsContext)

  const [initSpendingsByDate, setInitSpending, clearSpendings] = useSpendingRowsByDate({
      [budget.id]: spendingsStore.spendingsByBudgetId(budget.id)
  })

  const tableRefs = useRef<Record<string, SpendingTableHandle|null>>({})

  function addSpendingRow(sp: SpendingRow) {
    const dateStr = dateISO(sp.date)
    const table = tableRefs.current[dateStr]
    if (table) {
      table.addSpendingRow(sp)
    } else {
      setInitSpending(dateStr, sp)
    }
  }

  const dates = dateRangePlusItemSet(budget.dateFrom, budget.dateTo, new Set(Object.keys(initSpendingsByDate)))

  return (
    <div>
      <div>
        <p>
          <b>Бюджет #{ budget.id }: { budget.name }</b> <br />
          <b>{ dateFormat(budget.dateFrom) } &mdash; { dateFormat(budget.dateTo) }</b>
          <br />
          <b>{ toMajorUnits(budget.amount - budget.amountSpent, budget.currency) } { budget.currency }</b>
          &nbsp; из &nbsp;
          <b>{ toMajorUnits(budget.amount, budget.currency) } { budget.currency }</b>
        </p>
        <p style={{whiteSpace: 'pre'}}>{ budget.description }</p>
      </div>

      <AddSpendingForm onCreate={addSpendingRow} budget={budget} />

      {dates.map((date) => (
        <SpendingTable
          key={date}
          date={new Date(date)}
          initSpendings={initSpendingsByDate[date] ?? []}
          budget={budget}
          ref={r => {tableRefs.current[date] = r}}
          onEmpty={() => clearSpendings(date)}
        />
      ))}
    </div>
  )
}
