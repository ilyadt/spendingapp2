import {isToday} from 'date-fns'
import {dateFormat, dateISO, dayName} from '@src/helpers/date'
import {type Currency, toMajorUnits, totals} from '@src/helpers/money'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faReceipt, faXmark} from '@fortawesome/free-solid-svg-icons'
import {faGripDotsVertical} from '@src/helpers/icons'
import {
  type Budget,
  type SpendingRow,
  spendingFormValidator,
  isNew,
} from "@src/models/models.ts";
import {type Ref, useContext, useImperativeHandle, useState} from "react";
import {
  colorFromReceiptId,
  genRandInt,
  genReceiptId,
  receiptTotals
} from "@src/helpers/helper.ts";
import styles from './SpendingTable.module.css'
import {useSpendingRows} from "@src/stores/spendingRowsState.ts";
import {BudgetsContext, SpendingsStoreActionsContext} from "@src/models/contexts.ts";
import SpendingEditForm from "@src/components/SpendingEditForm.tsx";

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

  const tblMode = useTableMode()

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
    const now = new Date()

    for (const spId of tblMode.selectedItems) {
      _updateReceiptId(spId, receiptId, now)
    }

    tblMode.setViewMode()
  }

  function _updateReceiptId(spId: string, receiptId: number, updatedAt: Date) {
    const spRow = spendings.find(s => (s.id == spId) && (dateISO(s.date) == dateISO(date)))!
    const newSp = spStoreActions.updateSpending(spRow, {receiptId: receiptId}, updatedAt)
    spRowsActions.patchSpendingRow(spRow.rowId, {...newSp})
  }

  function onSubmit(fd: FormData) {
    const f = spendingFormValidator(
      fd,
      budgets,
      {selectBudget: !budget, selectDate: false},
    )

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

  function onCancel(fd: FormData) {
    const f = spendingFormValidator(
      fd,
      budgets,
      {selectBudget: !budget, selectDate: false},
    )

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
        <span style={{padding: 5, marginLeft: 6, cursor: 'pointer'}} onClick={tblMode.setGroupSelectMode}>
          <FontAwesomeIcon icon={faReceipt}/>
        </span>

        <span style={{position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap'}}>
          <b><i>{dateFormat(date)} ({dayName(date)})</i></b>
        </span>
      </p>

      <div style={{position: 'relative', padding: 0}}>
        <table
          className="table table-bordered table-sm align-middle"
          style={{
            tableLayout: 'fixed',
            minWidth: 350,
            opacity: isToday(date) ? 1 : 0.5,
            marginBottom: 20,
            lineHeight: '20px',
          }}
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

          {spendingsSorted.map((sp, idx) => (
            <tr
              key={sp.rowId}
              className={sp.receiptGroupId ? styles.bgRow : ''}
              style={{
                height: '45px',
                ['--row-bg-color' as string]: '#' + colorFromReceiptId(sp.receiptGroupId).toString(16),
              }}
            >
              <td style={{textAlign: 'right'}}>

                <span onClick={() => setPendingRow({...sp, rowIdx: idx})}>
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

              <td style={{overflow: "hidden", whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>
                <span onClick={() => setPendingRow({...sp, rowIdx: idx})}>{sp.description}</span>
              </td>

              {crossBudget &&
                  <td>
                      <span onClick={() => setPendingRow({...sp, rowIdx: idx})}>
                        {!isNew(sp) && budgets[sp.budgetId].alias}
                      </span>
                  </td>
              }

              <td>
                <button className="btn btn-warning btn-sm" onClick={() => delSpending(sp)}>
                  <FontAwesomeIcon icon={faXmark}/>
                </button>
                <button className="btn btn-sm">
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
                data-testid='add-new-button'
              >+</button>
            </td>
            <td/>
            {crossBudget && <td/>}
            <td data-testid="totals">{ totals(spendings).join(', ') }</td>
          </tr>

          </tbody>
        </table>

        {pendingRow &&
          <SpendingEditForm sp={pendingRow} save={onSubmit} cancel={onCancel} budget={budget}/>
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
