import {dateISO} from "@src/helpers/date.ts";
import {formatAmount, toMajorUnits} from "@src/helpers/money.ts";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheck, faXmark} from "@fortawesome/free-solid-svg-icons";
import {type Budget, isNew, spendingFormValidator, type SpendingRow} from "@src/models/models.ts";
import {createPortal} from "react-dom";
import {type KeyboardEvent, useContext, useRef} from "react";
import {BudgetsContext} from "@src/models/contexts.ts";
import {budgetsSortFn} from "@src/helpers/helper.ts";
import styles from "@src/components/SpendingTable.module.css"

type Props = {
  sp: SpendingRow & {rowIdx: number};
  budget?: Budget;
  save(fd: FormData): void;
  cancel(fd: FormData): void;
}

export default function SpendingEditForm({sp, budget, save, cancel}: Props) {
  const budgets = useContext(BudgetsContext)
  const crossBudget = !budget
  const spFormElem = useRef<HTMLFormElement>(null)

  function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    save(new FormData(e.currentTarget))
  }

  function onCancel(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    cancel(new FormData(e.currentTarget.form!))
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        save(new FormData(e.currentTarget.form!))
        break

      case 'Escape':
        cancel(new FormData(e.currentTarget.form!))
        break
    }
  }

  function onOverlayClick() {
    const f = spendingFormValidator(
      new FormData(spFormElem.current!),
      budgets,
      {selectBudget: !budget, selectDate: false},
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    (f.isEmpty() && isNew(sp!))
      ? cancel(new FormData(spFormElem.current!))
      : save(new FormData(spFormElem.current!))
  }

  return (
    <>
      <form ref={spFormElem} onSubmit={onSubmit} data-testid='edit-form' style={{height: 0}}>
        <input name="date" defaultValue={dateISO(sp.date)} style={{visibility: 'hidden'}} />
        { budget &&
          <input name="budgetId" defaultValue={budget.id} style={{visibility: 'hidden'}} />
        }
        <table
          className={`table table-bordered table-sm align-middle ${styles.spDayTable} ${styles.modalTable}`}
          style={{top: sp.rowIdx * 40 + 'px'}}
        >
          {crossBudget ? (
            <colgroup>
              <col style={{width: '15%'}}/>
              <col style={{width: '48%'}}/>
              <col style={{width: '20%'}}/>
              <col style={{width: '17%'}}/>
            </colgroup>
          ) : (
            <colgroup>
              <col style={{width: '21%'}}/>
              <col style={{width: '58%'}}/>
              <col style={{width: '21%'}}/>
            </colgroup>
          )}
          <tbody>
          <tr>
            <td className="text-end">
              <input
                name="amount"
                step="0.01"
                className="form-control cell-input"
                type="number"
                defaultValue={toMajorUnits(sp.amount, sp.currency) || ''}
                onKeyDown={onKeyDown}
              />
            </td>
            <td>
              <input
                name="description"
                className="form-control cell-input"
                defaultValue={sp.description}
                onKeyDown={onKeyDown}
              />
            </td>

            {crossBudget &&
              <td>
                <select name="budgetId" className="form-select cell-input" defaultValue={sp.budgetId}>
                  <option disabled key="0" value="0">бюджет</option>
                  {
                    Object.values(budgets).sort(budgetsSortFn).map(b =>
                      <option key={b.id} value={b.id}>
                        {b.alias}: {formatAmount(b.amount - b.amountSpent, b.currency)}
                      </option>
                    )
                  }
                </select>
              </td>
            }

            <td style={{padding: '2px'}}>
              <button
                data-testid="cancel-pending"
                type="button"
                className="btn btn-danger btn-sm p-1 m-1"
                style={{minWidth: '20px', lineHeight: 1}}
                onClick={onCancel}
              >
                <FontAwesomeIcon icon={faXmark}/>
              </button>
              <button
                data-testid="submit-pending"
                type="submit"
                className="btn btn-success btn-sm p-1 m-1"
                style={{minWidth: '20px', lineHeight: 1}}
              >
                <FontAwesomeIcon icon={faCheck}/>
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </form>
      <Overlay onClick={onOverlayClick}/>
    </>
  )
}

function Overlay({onClick}: {onClick: () => void}) {
  return createPortal(
    <div
      id="overlay"
      onClick={onClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'aqua',
        opacity: 0.5,
        zIndex: 2000,
      }}
    />, document.body)
}
