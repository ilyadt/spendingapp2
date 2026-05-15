import {
  formatAmount,
  toMajorUnits
} from '@src/helpers/money'
import {dateFormat, daysLeft, percentPassed} from '@src//helpers/date'
import {type BudgetWithSpent, useBudgetsWithSpent} from "@src/stores/budgets.ts";

export default function HomeView() {
  const budgetsById = useBudgetsWithSpent(s => s.budgets)

  const budgets = Object.values(budgetsById)
    .sort((a, b) => {
      if (a.sort === 0 && b.sort === 0) { // by id if sort = 0
        return a.id - b.id
      }

      if (a.sort === 0) return 1
      if (b.sort === 0) return -1

      return a.sort - b.sort
    })

  const percentAmount = (b: BudgetWithSpent) => Math.floor(b.amountSpent/b.amount * 100)

  const todayDate = new Date()
  const buildCommit = import.meta.env.VITE_BUILD_COMMIT

  return (
    <>
      <h1>Love you so much ♥{' '} <span style={{fontSize: 'small'}}> {buildCommit.slice(0, 7)} </span> </h1>

      {budgets.map(b=> (
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
              <b>{toMajorUnits(b.amount - b.amountSpent, b.currency)}</b>{' '} {b.currency} left. Money:
              <br />
              <b>{daysLeft(todayDate, b.dateTo)}</b>{' '} days left. Days:
              <br />
              {b.params?.perDay && todayDate <= b.dateTo && (
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