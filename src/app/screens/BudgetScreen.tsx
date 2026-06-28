import {dateFormat, dateISO, dateRangePlusItemSet} from '@/helpers/date'
import {toMajorUnits} from '@/helpers/money'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons'
import SpendingTable, {type SpendingTableHandle} from '../components/SpendingTable/SpendingTable'
import styles from './BudgetScreen.module.css'
import type {BudgetWithSpent} from "@/stores/budgets.ts";
import useSpendingRowsByDate from "@/state/spendingRowsByDate.ts";
import {Facade} from "@/facade.ts";
import {createSpendingFormValidator, type SpendingRow} from "@/models/models.ts";
import {useContext, useRef} from "react";
import {genRandInt} from "@/helpers/helper.ts";
import {SpendingsStoreActionsContext} from "@/models/contexts.ts";

export function BudgetScreen({budget}: {budget: BudgetWithSpent}) {
  const spStoreActions = useContext(SpendingsStoreActionsContext)
  const tableRefs = useRef<Record<string, SpendingTableHandle|null>>({})

  const [initSpendingsByDate, addSpendingRow, clearSpendings] = useSpendingRowsByDate({
      [budget.id]: Facade.spendingsByBudgetId(budget.id)
  })

  function onSubmitTopForm(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    const form = e.currentTarget
    const f = createSpendingFormValidator(
      new FormData(form),
      {[budget.id]: budget},
      {selectBudget: false, selectDate: true},
  )

    const err = f.validate()
    if (err) {
      alert(err)
      return
    }

    const dateStr = dateISO(f.data.date)

    const tbl = tableRefs?.current[dateStr]

    const newSpRow: SpendingRow = {
      ...spStoreActions.createSpending(f.data, new Date()),
      rowId: genRandInt(),
      budgetId: budget.id,
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    tbl ? tbl.addSpendingRow(newSpRow) : addSpendingRow(newSpRow)

    // clear form
    form.reset()
    setTimeout(() => { alert('Сохранено!') }, 0)
  }

  const dates = dateRangePlusItemSet(
    budget.dateFrom,
    budget.dateTo,
    new Set(Object.keys(initSpendingsByDate)),
  )

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
      <form className="d-flex align-items-center gap-1 mb-5" onSubmit={onSubmitTopForm}>
        <input type="hidden" name="budgetId" value={budget.id}/>
        <input
          type="date"
          name="date"
          className="form-control form-control-sm p-1"
          placeholder="дата"
          style={{width: '16ch'}}
        />
        <input
          type="number"
          name="amount"
          className={`form-control form-control-sm ${styles.noSpinner} text-end p-1`}
          placeholder="сумма"
          style={{width: '10ch'}}
        />
        <input
          type="text"
          name="description"
          className="form-control form-control-sm flex-grow-1 p-1"
          placeholder="описание"
        />
        <button className="btn btn-warning btn-sm">
          <FontAwesomeIcon icon={faFloppyDisk} />
        </button>
      </form>
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
