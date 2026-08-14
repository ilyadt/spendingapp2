import {dateISO} from "@/helpers/date.ts";
import {formatAmount, toMajorUnits} from "@/helpers/money.ts";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheck, faXmark} from "@fortawesome/free-solid-svg-icons";
import {type Budget, isNew, type SpendingRow} from "@/models/models.ts";
import {type KeyboardEvent, use, useRef} from "react";
import {BudgetsContext} from "@/models/contexts.ts";
import {budgetsSortFn} from "@/helpers/helper.ts";
import styles from "../styles.module.css"
import moduleStyles from "./SpendingEditForm.module.css"
import SpTableColgroup from "./SpTableColgroup.tsx";
import {createSpendingFormData, isEmpty, isEqual, type SpendingFormData, validate} from "@/models/spendingFormData.ts";
import type {SubmitEvent, MouseEvent} from "react";

export type SpendingRowExt = SpendingRow & { rowIdx: number };

type Props = {
  sp: SpendingRowExt;
  budget?: Budget|undefined;
  save(fd: SpendingFormData): void;
  cancel(): void;
}

export default function SpendingEditForm({sp, budget, save, cancel}: Props) {
  const budgets = use(BudgetsContext)
  const crossBudget = !budget
  const spFormElem = useRef<HTMLFormElement>(null)

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    trySave(createFormData(e.currentTarget))
  }

  function onCancelClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    tryCancel(createFormData(e.currentTarget.form!))
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        trySave(createFormData(e.currentTarget.form!))
        break

      case 'Escape':
        tryCancel(createFormData(e.currentTarget.form!))
        break
    }
  }

  function onOverlayClick() {
    const spFormData = createFormData(spFormElem.current!);

    if (isNew(sp) && isEmpty(spFormData) || !isNew(sp) && isEqual(spFormData, sp))
      cancel()
    else
      trySave(spFormData)
  }

  function createFormData(formElement: HTMLFormElement): SpendingFormData {
    return createSpendingFormData(
      new FormData(formElement),
      budget ? {[budget.id] : budget} : budgets,
    );
  }

  function trySave(f: SpendingFormData) {
    const error = validate(f)
    if (error) {
      window.alert(error)
      return
    }

    save(f)
  }

  function tryCancel(fd: SpendingFormData) {
    if (isNew(sp) && !isEmpty(fd) || !isNew(sp) && !isEqual(fd,sp)) {
      if (!window.confirm(`Отменить изменение "${fd.description}" ?`)) {
        return
      }
    }

    cancel()
  }

  return (
    <>
      <form
        ref={spFormElem}
        onSubmit={onSubmit}
        aria-label='spending edit form'
        className={`${styles.spEditForm}`}
        style={{top: sp.rowIdx * 40 + 'px'}}
      >
        <input name="date" defaultValue={dateISO(sp.date)} style={{display: 'none'}}/>
        {budget && (
          <input name="budgetId" defaultValue={budget.id} style={{display: 'none'}}/>
        )}
        <table role="grid" className={`table table-bordered table-sm align-middle ${styles.spDayTable}`}>
          <SpTableColgroup crossBudget={crossBudget}/>
          <tbody>
          <tr>
            <td>
              <input
                autoFocus={isNew(sp)}
                name="amount"
                role="textbox"
                aria-label="amount"
                step="0.01"
                className={`form-control cell-input ${moduleStyles.inputField} text-end`}
                type="number"
                defaultValue={toMajorUnits(sp.amount, sp.currency) || ''}
                onKeyDown={onKeyDown}
              />
            </td>
            <td>
              <input
                name="description"
                aria-label="description"
                className={`form-control cell-input ${moduleStyles.inputField}`}
                defaultValue={sp.description}
                onKeyDown={onKeyDown}
              />
            </td>

            {crossBudget && (
              <td>
                <select
                  name="budgetId"
                  style={{backgroundImage: 'none'}}
                  className={`form-select cell-input ${moduleStyles.inputField}`}
                  defaultValue={sp.budgetId}
                >
                  <option key="0" value="0"></option>
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
                onClick={onCancelClick}
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
      <div id="overlay" role="button" aria-label="overlay" onClick={onOverlayClick} className={styles.overlay}/>
    </>
  )
}
