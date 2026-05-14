import {
  type Currency,
  formatAmount,
  toMajorUnits
} from '@src/helpers/money'
import {dateFormat, daysLeft, percentPassed} from '@src//helpers/date'
import { Facade } from '@src/facade'
import type { Budget } from '@src/models/models'

interface Props {
  budgets: Budget[]
}

interface TemplateBudget {
  id: number
  name: string
  sort: number
  dateFrom: Date
  dateTo: Date
  amount: number
  currency: Currency
  description?: string
  amountSpent: number
  showPerDay: boolean
}

export default function HomeView({
  budgets,
}: Props) {
  const todayDate = new Date()

  const templateBudgets = (() => {
      const result: TemplateBudget[] = []

      for (const b of budgets) {
        const sps =
          Facade.spendingsByBudgetId(b.id)

        let spentAmount = 0

        for (const sp of sps) {
          spentAmount += sp.amount
        }

        result.push({
          id: b.id,
          name: b.name,
          sort: b.sort ? b.sort : 1e6,
          dateFrom: new Date(b.dateFrom),
          dateTo: new Date(b.dateTo),
          amount: b.amount,
          currency: b.currency,
          description: b.description,
          amountSpent: spentAmount,
          showPerDay: Boolean(b.params['perDay']),
        })
      }

      result.sort((a, b) => a.sort - b.sort)

      return result
    })()


  function percentAmount(b: TemplateBudget): number {
    return Math.floor((b.amountSpent / b.amount) * 100)
  }

  const buildCommit = import.meta.env.VITE_BUILD_COMMIT

  return (
    <>
      <h1>Love you so much ♥{' '} <span style={{fontSize: 'small'}}> {buildCommit.slice(0, 7)} </span> </h1>

      {templateBudgets.map((b) => (
        <div key={b.id} style={{borderTop: 'outset', marginTop: '5px', opacity: b.dateTo >= todayDate ? 1 : 0.5}}>
          <h4 style={{marginBottom: 0}}>
            {b.name} #{b.id}
          </h4>

          <p style={{marginBottom: 0,}}>
            {dateFormat(b.dateFrom)}-
            {dateFormat(b.dateTo)}
          </p>

          <p style={{marginBottom: '2px'}}>
            {formatAmount(b.amount, b.currency)}
          </p>

          <p style={{whiteSpace: 'pre', fontSize: '0.6rem', marginBottom: 0, fontStyle: 'italic'}}>
            {b.description}
          </p>

          <div className="row">
            <div className="col-5" style={{fontSize: '0.7rem'}}>
              <b>{formatAmount(b.amount - b.amountSpent, b.currency)}</b>{' '} {b.currency} left. Money:
              <br />
              <b>{daysLeft(todayDate, b.dateTo)}</b>{' '} days left. Days:
              <br />
              {b.showPerDay &&
                todayDate <= b.dateTo && (
                  <p>
                      <b>{Math.floor(toMajorUnits(b.amount - b.amountSpent, b.currency) / daysLeft(todayDate, b.dateTo))}</b>
                      {' '} {b.currency}/Day left
                  </p>
                )}
            </div>

            <div className="dual-progress-container col-6">
              <div className="progress">
                <div className="progress-bar bg-success" role="progressbar" style={{width: `${percentAmount(b)}%`}}>
                  {percentAmount(b) >= 50 && (<span>{percentAmount(b)}{' '}%</span>)}
                </div>

                {percentAmount(b) < 50 && (<span>{percentAmount(b)} %</span>)}
              </div>

              <div className="progress">
                <div className="progress-bar" role="progressbar" style={{width: `${percentPassed(todayDate, b)}%`}}>
                  {percentPassed(todayDate, b) >= 50 && (<span>{percentPassed(todayDate, b)}{' '}%</span>)}
                </div>

                {percentPassed(todayDate, b) < 50 && (<span>{percentPassed(todayDate, b)}{' '}%</span>)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}