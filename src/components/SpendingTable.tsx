import {isToday} from 'date-fns'
import {dateFormat, dateISO, dayName} from '@/helpers/date'
import {type Currency, toMajorUnits, totals} from '@/helpers/money'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faReceipt, faXmark} from '@fortawesome/free-solid-svg-icons'
import {faGripDotsVertical} from '@/helpers/icons'
import {
  type Budget,
  type SpendingRow,
  type SpendingFormValidator,
  isNew,
} from "@/models/models.ts";
import {type Ref, useContext, useImperativeHandle, useState} from "react";
import {
  colorFromReceiptId,
  genRandInt,
  genReceiptId,
  receiptTotals
} from "@/helpers/helper.ts";
import styles from './SpendingTable.module.css'
import useSpendingRows from "@/state/spendingRows.ts";
import {BudgetsContext, SpendingsStoreActionsContext} from "@/models/contexts.ts";
import SpendingEditForm from "@/components/SpendingEditForm.tsx";
import SpTableColgroup from "@/components/anemic/SpTableColgroup.tsx";
import useTableGroupMode from "@/state/tableGroupMode.ts";

type Props = {
  date: Date
  budget?: Budget,
  initSpendings: SpendingRow[]
  onEmpty?: () => void
  ref?: Ref<SpendingTableHandle>
}

export type SpendingTableHandle = {
  addSpendingRow(sp: SpendingRow): void
}

export default function SpendingTable({date, budget, initSpendings, onEmpty, ref}: Props) {
  const budgets = useContext(BudgetsContext)
  const spStoreActions = useContext(SpendingsStoreActionsContext)

  const [spendings, spRowsActions] = useSpendingRows(initSpendings, onEmpty)

  const groupMode = useTableGroupMode()

  const [pendingRow, setPendingRow] = useState<SpendingRow & {rowIdx: number} | null>(null)

  useImperativeHandle(ref, () => ({addSpendingRow: spRowsActions.addSpendingRow}))

  function delSpending(s: SpendingRow) {
    if (!window.confirm(`Удалить запись "${s.description}" ?`)) {
      return
    }

    spStoreActions.deleteSpending(s, new Date())
    spRowsActions.deleteSpendingRow(s.rowId)
  }

  function uniteReceipt() {
    _setReceiptIdForSelectedItems(genReceiptId(date))
  }

  function separateReceipt() {
    _setReceiptIdForSelectedItems(0)
  }

  function _setReceiptIdForSelectedItems(receiptId: number) {
    const updatedAt = new Date()

    const spRows = spendings.filter(
      s => groupMode.selectedItems.has(s.id) && dateISO(s.date) === dateISO(date)
    )!

    for (const sp of spRows) {
      const newSp = spStoreActions.updateSpending(sp, {receiptId}, updatedAt)
      spRowsActions.patchSpendingRow(sp.rowId, newSp)
    }

    groupMode.disable()
  }

  function savePendingSp(f: SpendingFormValidator) {
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

    const newSp = spStoreActions.saveSpendingChanges(sp, f.data, new Date())

    spRowsActions.patchSpendingRow(sp.rowId, {...newSp, budgetId: f.data.budget!.id})
    setPendingRow(null)
  }

  function cancelPendingSp(f: SpendingFormValidator) {
    const sp = pendingRow!

    if (f.isEqual(sp)) {
      setPendingRow(null)
      return
    }

    if (!f.isEmpty() && !window.confirm(`Отменить изменение "${f.data.description}" ?`)) {
      return
    }

    if (isNew(sp)) {
      spRowsActions.deleteSpendingRow(sp.rowId)
    }

    setPendingRow(null)
  }

  function addNewSpending() {
    const spRow: SpendingRow = {
      id: '',
      version: '',
      rowId: genRandInt(),
      date: date,
      amount: 0,
      currency: '' as Currency,
      description: '',
      sort: Date.now(),
      budgetId: budget?.id ?? 0,
      receiptGroupId: 0,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }

    spRowsActions.addSpendingRow(spRow)
    setPendingRow({...spRow, rowIdx: spendings.length})
  }

  const spendingsSorted = [...spendings].sort((a, b) => a.sort - b.sort)
  const receiptTotal = receiptTotals(spendingsSorted)
  const crossBudget = !budget

  return (
    <div className="row">
      <p style={{position: 'relative', marginBottom: 0}}>
        <button className="btn btn-link text-black p-0" onClick={groupMode.enable} aria-label="Enable group mode">
          <FontAwesomeIcon icon={faReceipt}/>
        </button>

        <span style={{position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap'}}>
          <b><i>{dateFormat(date)} ({dayName(date)})</i></b>
        </span>
      </p>

      <div style={{position: 'relative', padding: 0}}>
        <table
          className={`table table-bordered table-sm align-middle ${styles.spDayTable}`}
          style={{opacity: isToday(date) ? 1 : 0.5}}
        >

          <SpTableColgroup crossBudget={crossBudget} />

          <tbody>

          {spendingsSorted.map((sp, idx) => (
            <tr
              key={sp.rowId}
              className={sp.receiptGroupId ? styles.bgRow : ''}
              style={{['--row-bg-color' as string]: colorFromReceiptId(sp.receiptGroupId)}}
            >
              <td style={{textAlign: 'right', position: "relative"}}>

                <span aria-label="amount" onClick={() => setPendingRow({...sp, rowIdx: idx})}>
                  {toMajorUnits(sp.amount, sp.currency)}
                </span>

                {receiptTotal[sp.rowId] && !groupMode.enabled && (
                  <span
                    aria-label="receipt total"
                    style={{position: 'absolute', bottom: 0, left: '4px', fontSize: 'small', fontFamily: 'monospace'}}
                  >
                    {toMajorUnits(receiptTotal[sp.rowId], sp.currency)}
                  </span>
                )}

                {groupMode.enabled && (
                  <input
                    aria-label="select item"
                    onChange={() => groupMode.toggleItem(sp.id)}
                    style={{position: 'absolute', top: '10px', left: '10px'}}
                    type="checkbox"
                    checked={groupMode.selectedItems.has(sp.id)}
                  />
                )}
              </td>

              <td>
                <span onClick={() => setPendingRow({...sp, rowIdx: idx})}>{sp.description}</span>
              </td>

              {crossBudget && (
                <td>
                  <span onClick={() => setPendingRow({...sp, rowIdx: idx})}>
                    {!isNew(sp) && budgets[sp.budgetId].alias}
                  </span>
                </td>
              )}

              <td>
                <button className={`btn btn-warning btn-sm ${styles.actionButton}`} onClick={() => delSpending(sp)}>
                  <FontAwesomeIcon icon={faXmark}/>
                </button>
                <button className={`btn btn-sm ${styles.actionButton}`}>
                  <FontAwesomeIcon icon={faGripDotsVertical}/>
                </button>
              </td>
            </tr>
          ))}

          <tr key="sp-add">
            <td>
              <button
                type="button"
                onClick={addNewSpending}
                className="btn btn-success btn-small"
              >+</button>
            </td>
            <td/>
            {crossBudget && <td/>}
            <td>{ totals(spendings).join(', ') }</td>
          </tr>

          </tbody>
        </table>

        {pendingRow &&
          <SpendingEditForm sp={pendingRow} save={savePendingSp} cancel={cancelPendingSp} budget={budget}/>
        }

        {groupMode.enabled &&
          <div role="group" aria-label="group-actions">
            <button onClick={uniteReceipt} className="btn btn-success btn-small">Объединить в чек</button>
            <button onClick={separateReceipt} className="btn btn-success btn-small">Разъединить чек</button>
            <button onClick={groupMode.disable} className="btn btn-warning btn-small">Отменить</button>
          </div>
        }
      </div>
    </div>
  )
}
