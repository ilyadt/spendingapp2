import { Facade } from '@src/facade'
import {dateFormat, dateISO, dateRangePlusFromItems} from '@src/helpers/date'
import {toMajorUnits, fromMajorUnits} from '@src/helpers/money'
import {type Budget, genSpendingID, genVersion, type Spending} from '@src/models/models'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons'
import SpendingTable from '@src/components/SpendingTable'
import {type SubmitEvent} from "react";
import styles from './BudgetView.module.css'
import {type Updater, useImmer} from "use-immer";
import type {SpendingRow} from "@src/models/viewmodels.ts";
import type {BudgetWithSpent} from "@src/stores/budgets.ts";
import {genRandInt} from "@src/helpers/helper.ts";

function topForm(b: Budget, stateUpdater: Updater<SpendingRow[]>) {
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

      const now = new Date();

      const newSpending: Spending = {
        id: genSpendingID(),
        version: genVersion(null),
        date: new Date(date),
        sort: now.getTime(),
        amount: fromMajorUnits(amount, b.currency),
        currency: b.currency,
        description: description,
        createdAt: now,
        updatedAt: now,
        receiptGroupId: 0,
      }

      Facade.createSpending(b.id, newSpending)
      stateUpdater(prev => {
        prev.push({
          ...newSpending,
          budgetId: b.id,
          internalRowId: genRandInt(),
        })
      })

      // clear form
      form.reset()
      setTimeout(() => { alert('Сохранено!') }, 0)
    }
  }
}

export function BudgetView({budget}: {budget: BudgetWithSpent}) {
  const [spendings, updateSpendings] = useImmer<SpendingRow[]>(() =>
    Facade.spendingsByBudgetId(budget.id).map(s => ({
      ...s,
      budgetId: budget.id,
      internalRowId: genRandInt(),
    }))
  )

  const tf = topForm(budget, updateSpendings)

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
          updateSpendings={updateSpendings}
          showBudgetCol={false}
        />
      ))}
    </>
  )
}
