import {dateFormat, dateISO, dateRangePlusFromItems} from '@src/helpers/date'
import {toMajorUnits, fromMajorUnits} from '@src/helpers/money'
import {type Budget} from '@src/models/models'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons'
import SpendingTable from '@src/components/SpendingTable'
import {type SubmitEvent} from "react";
import styles from './BudgetView.module.css'
import {createSpending, type SpendingRow} from "@src/models/viewmodels.ts";
import type {BudgetWithSpent} from "@src/stores/budgets.ts";
import {type SpendingRowsActions, useSpendingRows} from "@src/stores/spendingRowsState.ts";

function topForm(b: Budget, spRowsActions: SpendingRowsActions) {
  return {
    save(e: SubmitEvent<HTMLFormElement>) {
      e.preventDefault()

      const form = e.currentTarget
      const formData = new FormData(form)

      const date = formData.get('date')?.toString();
      const amount = Number(formData.get('amount'));
      const description = formData.get('description')?.toString();

      if (!date || !amount || !description) {
        alert('Заполните все поля')
        return
      }

      const newSpending = createSpending(b, new Date(date), {
        amount: fromMajorUnits(amount, b.currency),
        description: description,
      }, new Date())

      spRowsActions.createSpendingRow(b.id, newSpending)

      // clear form
      form.reset()
      setTimeout(() => { alert('Сохранено!') }, 0)
    }
  }
}

export function BudgetView({budget}: {budget: BudgetWithSpent}) {
  const {spendings, actions} = useSpendingRows([budget.id])

  const tf = topForm(budget, actions)

  const spendingsByDate: Record<string, SpendingRow[]> = {}

  for (const s of spendings) {
    const key = dateISO(s.date)

    spendingsByDate[key] ??= []
    spendingsByDate[key].push(s)
  }

  const dates = dateRangePlusFromItems(budget.dateFrom, budget.dateTo, spendings)

  return (
    <>
      { /* Отображение бюджета с тратами */ }
      <div>
        <p>
          <b>Бюджет #{ budget.id }: { budget.name }</b> <br />
          <b>{ dateFormat(budget.dateFrom) } &mdash; { dateFormat(budget.dateTo) }</b>
          <br />
          <b>{ toMajorUnits(budget.amount - budget.amountSpent, budget.currency) } { budget.currency }</b> (из
          <b>{ toMajorUnits(budget.amount, budget.currency) } { budget.currency }</b
          >)
        </p>
        <p v-if="budget?.description" style={{whiteSpace: 'pre'}}>{budget.description }</p>
      </div>
      <form className="d-flex align-items-center gap-1 mb-5" onSubmit={tf.save}>
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
          spendings={spendingsByDate[date] ?? []}
          spRowsActions={actions}
          budget={budget}
        />
      ))}
    </>
  )
}
