import {dateFormat, dateRangePlusItemSet} from '@src/helpers/date'
import {toMajorUnits, fromMajorUnits} from '@src/helpers/money'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons'
import SpendingTable from '@src/components/SpendingTable'
import styles from './BudgetView.module.css'
import {createSpending} from "@src/models/facadewrapper.ts";
import type {BudgetWithSpent} from "@src/stores/budgets.ts";
import {useSpendingRowsByDate} from "@src/stores/spendingRowsByDateState.ts";
import {Facade} from "@src/facade.ts";

export function BudgetView({budget}: {budget: BudgetWithSpent}) {
  const dbSps = Facade.spendingsByBudgetId(budget.id)

  const [spendingsByDate, addSpendingRow] = useSpendingRowsByDate({
    [budget.id]: dbSps,
  })

  function onSubmitTopForm(e: React.SubmitEvent<HTMLFormElement>) {
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

    const newSpending = createSpending(new Date(date), {
      budget: budget,
      amount: fromMajorUnits(amount, budget.currency),
      description: description,
    }, new Date())

    addSpendingRow(budget.id, newSpending)

    // clear form
    form.reset()
    setTimeout(() => { alert('Сохранено!') }, 0)
  }

  const dates = dateRangePlusItemSet(budget.dateFrom, budget.dateTo, new Set(Object.keys(spendingsByDate)))

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
      <form className="d-flex align-items-center gap-1 mb-5" onSubmit={onSubmitTopForm}>
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
          key={spendingsByDate[date]?.key ?? date}
          date={new Date(date)}
          initSpendings={spendingsByDate[date]?.values ?? []}
          budget={budget}
        />
      ))}
    </>
  )
}
