import {dateISO} from "@/helpers/date.ts";
import {formatAmount, toMajorUnits} from "@/helpers/money.ts";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheck, faXmark} from "@fortawesome/free-solid-svg-icons";
import {type Budget, isNew, type SpendingRow} from "@/models/models.ts";
import {createPortal} from "react-dom";
import {type KeyboardEvent, useContext, useRef} from "react";
import {BudgetsContext} from "@/models/contexts.ts";
import {budgetsSortFn} from "@/helpers/helper.ts";
import styles from "../styles.module.css"
import SpTableColgroup from "./SpTableColgroup.tsx";
import {createSpendingFormData, type SpendingFormData} from "@/app/components/SpendingTable/logic/spendingFormData.ts";

type Props = {
  sp: SpendingRow & { rowIdx: number };
  budget?: Budget;
  save(fd: SpendingFormData): void;
  cancel(fd: SpendingFormData): void;
}

export default function SpendingEditForm({sp, budget, save, cancel}: Props) {
  const budgets = useContext(BudgetsContext)
  const crossBudget = !budget
  const spFormElem = useRef<HTMLFormElement>(null)

  function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    save(createValidator(e.currentTarget))
  }

  function onCancel(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    cancel(createValidator(e.currentTarget.form!))
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        save(createValidator(e.currentTarget.form!))
        break

      case 'Escape':
        cancel(createValidator(e.currentTarget.form!))
        break
    }
  }

  function onOverlayClick() {
    const f = createValidator(spFormElem.current!);

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    (f.isEmpty() && isNew(sp!))
      ? cancel(f)
      : save(f)
  }

  function createValidator(formElement: HTMLFormElement): SpendingFormData {
    return createSpendingFormData(
      new FormData(formElement),
      budgets,
      {selectBudget: !budget, selectDate: false},
    );
  }

  return (
    <>
      <form ref={spFormElem} onSubmit={onSubmit} aria-label='spending edit form' style={{height: 0}}>
        <input name="date" defaultValue={dateISO(sp.date)} style={{visibility: 'hidden'}}/>
        {budget && (
          <input name="budgetId" defaultValue={budget.id} style={{visibility: 'hidden'}}/>
        )}
        <table
          role="grid"
          className={`table table-bordered table-sm align-middle ${styles.spDayTable} ${styles.modalTable}`}
          style={{top: sp.rowIdx * 40 + 'px'}}
        >
          <SpTableColgroup crossBudget={crossBudget}/>
          <tbody>
          <tr>
            <td className="text-end">
              <input
                autoFocus={isNew(sp)}
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

            {crossBudget && (
              <td>
                <select name="budgetId" className="form-select cell-input" defaultValue={sp.budgetId}>
                  <option key="0" value="0">бюджет</option>
                  {Object.values(budgets).sort(budgetsSortFn).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.alias}: {formatAmount(b.amount - b.amountSpent, b.currency)}
                    </option>
                  ))}
                </select>
              </td>
            )}

            <td style={{padding: '2px'}}>
              <button
                aria-label="cancel pending spending"
                type="button"
                className="btn btn-danger btn-sm p-1 m-1"
                style={{minWidth: '20px', lineHeight: 1}}
                onClick={onCancel}
              >
                <FontAwesomeIcon icon={faXmark}/>
              </button>
              <button
                aria-label="submit pending spending"
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

function Overlay({onClick}: { onClick: () => void }) {
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
