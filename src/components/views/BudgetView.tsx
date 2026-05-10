import { Facade } from '@src/facade'
import {dateFormat, dateISO, dateRangePlusFromItems} from '@src/helpers/date'
import { moneyToString, minus, moneyFormat, from } from '@src/helpers/money'
import { genSpendingID, genVersion, type Budget, type Spending } from '@src/models/models'
import { type SpendingRow } from '@src/models/viewmodels'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons'
import SpendingTable from '@src/components/SpendingTable'
import {useState,type SubmitEvent} from "react";
import styles from './BudgetView.module.css'

type Props = {
  budget: Budget
}

export function BudgetView({budget}: Props) {
  const [spendings, setSpendings] = useState<Spending[]>(Facade.spendingsByBudgetId(budget.id))

  let moneyLeft = budget.money

  for (const sp of spendings) {
    moneyLeft = minus(moneyLeft, sp.money)
  }

  const spendingsByDate: Record<string, SpendingRow[]> = {}

  for (const s of spendings) {
    const key = dateISO(s.date)

    spendingsByDate[key] ??= []
    spendingsByDate[key].push({
      amountFull: moneyFormat(s.money),
      budgetId: budget.id,
      createdAt: s.createdAt,
      currency: s.money.currency,
      date: s.date,
      description: s.description,
      id: s.id,
      receiptGroupId: s.receiptGroupId,
      sort: s.sort,
      updatedAt: s.updatedAt,
      version: s.version,
    })
  }

  const dates = dateRangePlusFromItems(budget.dateFrom, budget.dateTo, spendings)

  function saveTopForm(e: SubmitEvent<HTMLFormElement>) {
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

    const sendData: Spending = {
      id: genSpendingID(),
      version: genVersion(null),
      date: new Date(date),
      sort: now.getTime(),
      money: from(amount, budget.money.currency),
      description: description,
      createdAt: now,
      updatedAt: now,
      receiptGroupId: 0,
    }

    Facade.createSpending(budget.id, sendData)
    setSpendings(spendings => [...spendings, sendData])

    // clear form
    form.reset()

    alert('Сохранено!')
  }

  return (
    <>
      { /* Отображение бюджета с тратами */ }
      <div>
        <p>
          <b>Бюджет #{ budget.id }: { budget.name }</b> <br />
          <b
          >{ dateFormat(budget.dateFrom) } &mdash;
            { dateFormat(budget.dateTo) }</b
          ><br />
          <b>{ moneyToString(moneyLeft) } { moneyLeft.currency }</b> (из
          <b>{ moneyToString(budget.money) } { budget.money.currency }</b
          >)
        </p>
        <p v-if="budget?.description" style={{whiteSpace: 'pre'}}>{budget.description }</p>
      </div>
      <form className="d-flex align-items-center gap-1 mb-5" onSubmit={saveTopForm}>
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
          showBudgetCol={false}
        />
      ))}
    </>
  )
}
