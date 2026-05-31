import {isToday} from 'date-fns'
import {dateFormat, dateISO, dayName} from '@src/helpers/date'
import {type Currency, formatAmount, toMajorUnits} from '@src/helpers/money'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faCheck, faReceipt, faXmark} from '@fortawesome/free-solid-svg-icons'
import {faGripDotsVertical} from '@src/helpers/icons'
import {useImmer} from "use-immer";
import {type Budget, type SpendingRow, createSpendingEditForm, isNew} from "@src/models/models.ts";
import {
  deleteSpending,
  saveSpendingChanges,
  updateSpending
} from "@src/models/facadewrapper.ts";
import {useRef, useState} from "react";
import {budgetsSortFn, colorFromReceiptId, genReceiptId, receiptTotals} from "@src/helpers/helper.ts";
import styles from './SpendingTable.module.css'
import {createPortal} from "react-dom";
import type {KeyboardEvent} from "react"
import {useBudgetsWithSpent} from "@src/stores/budgets.ts";
import {useSpendingRows} from "@src/stores/spendingRowsState.ts";

type Props = {
  date: Date
  budget?: Budget,
  initSpendings: SpendingRow[]
}

export default function SpendingTable({date, budget, initSpendings}: Props) {
  const [spendings, spRowsActions] = useSpendingRows(initSpendings)

  const budgets = useBudgetsWithSpent(s => s.budgets)

  const tblMode = useTableMode()

  const [pendingRow, setPendingRow] = useImmer<SpendingRow | null>(null)
  const pendingSpForm = useRef<HTMLFormElement>(null)

  function delSpending(s: SpendingRow) {
    if (!window.confirm(`Удалить запись "${s.description}" ?`)) {
      return
    }

    deleteSpending(s, new Date())
    spRowsActions.deleteSpendingRow(s.rowId)
  }

  function uniteReceipt() {
    _setReceiptIdForSelectedItems(genReceiptId(date))
  }

  function separateReceipt() {
    _setReceiptIdForSelectedItems(0)
  }

  function _setReceiptIdForSelectedItems(receiptId: number) {
    const now = new Date()

    for (const spId of tblMode.selectedItems) {
      _updateReceiptId(spId, receiptId, now)
    }

    tblMode.setViewMode()
  }

  function _updateReceiptId(spId: string, receiptId: number, updatedAt: Date) {
    const spRow = spendings.find(s => (s.id == spId) && (dateISO(s.date) == dateISO(date)))!
    const newSp = updateSpending(spRow, {receiptId: receiptId}, updatedAt)
    spRowsActions.patchSpendingRow(spRow.rowId, {...newSp})
  }

  function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    const f = createSpendingEditForm(new FormData(e.currentTarget!), budgets)
    const sp = pendingRow!

    // Do nothing
    const error = f.validate()
    if (error) {
      window.alert(error)
      return
    }

    // Nothing changed
    if (f.isEqual(sp)) {
      setPendingRow(null)
      return
    }

    const newSp = saveSpendingChanges(date, sp, f.data(), new Date())

    spRowsActions.patchSpendingRow(sp.rowId, {...newSp, budgetId: f.budget!.id})
    setPendingRow(null)
  }

  function onCancel(e: React.KeyboardEvent<HTMLInputElement>|React.MouseEvent<HTMLButtonElement>) {
    const f = createSpendingEditForm(new FormData(e.currentTarget.form!), budgets)
    const sp = pendingRow!

    if (f.isEmpty() && isNew(sp)) {
      setPendingRow(null)
      spRowsActions.deleteSpendingRow(sp.rowId)
      return
    }

    if (f.isEqual(sp)) {
      setPendingRow(null)
      return
    }

    const fd = f.data()

    if (!window.confirm(`Отменить изменение "${fd.description}" ?`)) {
      return
    }

    if (isNew(sp)) {
      spRowsActions.deleteSpendingRow(sp.rowId)
    }

    setPendingRow(null)
  }

  function onOverlayClick() {
    const f = createSpendingEditForm(new FormData(pendingSpForm.current!), budgets)
    const sp = pendingRow!

    if (f.isEmpty() && isNew(sp)) {
      setPendingRow(null)
      spRowsActions.deleteSpendingRow(sp.rowId)
      return
    }

    const error = f.validate()
    if (error) {
      window.alert(error)
      return
    }

    if (f.isEqual(sp)) {
      setPendingRow(null)
      return
    }

    const newSp = saveSpendingChanges(date, sp, f.data(), new Date())

    spRowsActions.patchSpendingRow(sp.rowId, {...newSp, budgetId: f.budget!.id})
    setPendingRow(null)
  }

  function addNewSpending() {
    const spRow = spRowsActions.createSpendingRow(0, {
      id: '',
      version: '',
      date: date, // TODO: сделать State по дням ?
      amount: 0,
      currency: '' as Currency,
      description: '',
      sort: Date.now(),
      createdAt: new Date(0),
      updatedAt: new Date(0),
      receiptGroupId: 0,
    })

    setPendingRow(spRow)
  }

  const budgetsSorted = Object.values(budgets).sort(budgetsSortFn)
  const spendingsSorted = [...spendings].sort((a, b) => a.sort - b.sort)
  const receiptTotal = receiptTotals(spendingsSorted)
  const crossBudget = !budget

  function dayTotal(cur: Currency): number {
    const res: Partial<Record<Currency, number>> = {}

    for (const {currency, amount} of spendings) {
      res[currency] = (res[currency] ?? 0) + amount
    }

    return res[cur] ?? 0
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'Enter':
        // handles naturally
        break

      case 'Escape':
        onCancel(e)
        break
    }
  }

  function rowIdx(rowId: number): number {
    return spendingsSorted.findIndex(s => s.rowId == rowId)
  }

  return (
    <div className="row">
      <p style={{position: 'relative', marginBottom: 0}}>
        <span style={{padding: 5, marginLeft: 6, cursor: 'pointer'}} onClick={tblMode.setGroupSelectMode}>
          <FontAwesomeIcon icon={faReceipt}/>
        </span>

        <span style={{position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap'}}>
          <b><i>{dateFormat(date)} ({dayName(date)})</i></b>
        </span>
      </p>

      <div style={{position: 'relative'}}>
        <table
          className="table table-bordered table-sm align-middle"
          style={{tableLayout: 'fixed', minWidth: 350, opacity: isToday(date) ? 1 : 0.5, marginBottom: 20}}
        >
          <tbody>

          {spendingsSorted.map((sp) => (
            <tr
              key={sp.rowId}
              className={sp.receiptGroupId ? styles.bgRow : ''}
              style={{
                ['--row-bg-color' as string]: '#' + colorFromReceiptId(sp.receiptGroupId).toString(16),
              }}
            >
              <td style={{position: 'relative', textAlign: 'right'}}>

                <span onClick={() => setPendingRow(sp)}>
                  {receiptTotal[sp.rowId] && `${toMajorUnits(receiptTotal[sp.rowId], sp.currency)} \\ `}
                  {toMajorUnits(sp.amount, sp.currency)}
                </span>

                {tblMode.isGroupSelectMode && (
                  <input
                    onChange={() => tblMode.toggleSelected(sp.id)}
                    style={{position: 'absolute', top: '10px', left: '10px'}}
                    type="checkbox"
                    checked={tblMode.selectedItems.has(sp.id)}
                  />
                )}
              </td>

              <td>
                <span onClick={() => setPendingRow(sp)}>{sp.description}</span>
              </td>

              {crossBudget &&
                  <td>
                      <span onClick={() => setPendingRow(sp)}>{
                        isNew(sp)
                          ? ''
                          : budgets[sp.budgetId].alias}
                      </span>
                  </td>
              }

              <td>
                <button className="btn btn-warning btn-sm p-1 m-1" onClick={() => delSpending(sp)}>
                  <FontAwesomeIcon icon={faXmark}/>
                </button>
                <button className="btn btn-sm p-1 m-1">
                  <FontAwesomeIcon icon={faGripDotsVertical}/>
                </button>
              </td>
            </tr>
          ))}

          <tr key="sp-add">
            <td>
              <button type="button" onClick={addNewSpending} className="btn btn-success btn-small"> +</button>
            </td>
            <td/>
            {crossBudget && <td/>}
            <td>{toMajorUnits(dayTotal("RUB"), 'RUB')} ₽</td>
          </tr>

          </tbody>
        </table>

        {pendingRow &&
            <>
                <form ref={pendingSpForm} onSubmit={onSubmit}>
                  { budget &&
                      <input name="budgetId" defaultValue={budget.id} style={{visibility: 'hidden'}} />
                  }
                    <table
                        className={`table table-bordered table-sm align-middle ${styles.modalTable}`}
                        style={{top: rowIdx(pendingRow.rowId) * 37.25 + 'px', background: 'white'}}
                    >
                      {crossBudget ? (
                        <colgroup>
                          <col style={{width: '50px'}}/>
                          <col style={{width: '160px'}}/>
                          <col style={{width: '50px'}}/>
                          <col style={{width: '55px'}}/>
                        </colgroup>
                      ) : (
                        <colgroup>
                          <col style={{width: '70px'}}/>
                          <col style={{width: '190px'}}/>
                          <col style={{width: '65px'}}/>
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
                                    defaultValue={toMajorUnits(pendingRow.amount, pendingRow.currency) || ''}
                                    onKeyDown={onKeyDown}
                                />
                            </td>
                            <td>
                                <input
                                    name="description"
                                    className="form-control cell-input"
                                    defaultValue={pendingRow.description}
                                    onKeyDown={onKeyDown}
                                />
                            </td>

                          {crossBudget &&
                              <td>
                                  <select name="budgetId" className="form-select cell-input" defaultValue={pendingRow.budgetId}>
                                      <option disabled key="0" value="0">бюджет</option>
                                    {
                                      budgetsSorted.map(b =>
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
                                    type="button"
                                    className="btn btn-danger btn-sm p-1 m-1"
                                    style={{minWidth: '20px', lineHeight: 1}}
                                    onClick={onCancel}
                                >
                                    <FontAwesomeIcon icon={faXmark}/>
                                </button>
                                <button
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
        }

        {tblMode.isGroupSelectMode &&
            <div>
                <button onClick={uniteReceipt} className="btn btn-success btn-small">Объединить в чек</button>
                <button onClick={separateReceipt} className="btn btn-success btn-small">Разъединить чек</button>
                <button onClick={tblMode.setViewMode} className="btn btn-warning btn-small">Отменить</button>
            </div>
        }
      </div>
    </div>
  )
}

function useTableMode() {
  type Mode = 'view' | 'groupSelect'

  const [mode, setMode] = useState<Mode>('view')

  const [selectedItems, setSelectedItems] = useState<Set<string>>(() => new Set())

  return {
    isViewMode: mode === 'view',
    isGroupSelectMode: mode === 'groupSelect',

    setViewMode() {
      setMode('view')
    },

    setGroupSelectMode() {
      setSelectedItems(new Set())
      setMode('groupSelect')
    },

    toggleSelected(item: string) {
      setSelectedItems(prev => {
        const next = new Set(prev)

        if (next.has(item)) {
          next.delete(item)
        } else {
          next.add(item)
        }

        return next
      })
    },

    selectedItems,
  }
}

function Overlay({onClick}: {onClick: () => void}) {
  return createPortal(
    <div
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
