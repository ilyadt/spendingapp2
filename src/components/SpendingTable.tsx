import { isToday } from 'date-fns'
import {dateFormat, dateISO, dayName, daysFrom2000UTC} from '@src/helpers/date'
import {type Currency, toMajorUnits} from '@src/helpers/money'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import { faReceipt, faXmark} from '@fortawesome/free-solid-svg-icons'
import { faGripDotsVertical } from '@src/helpers/icons'
import type {Updater} from "use-immer";
import {genVersion, type Spending} from "@src/models/models.ts";
import {Facade} from "@src/facade.ts";
import type {SpendingRow} from "@src/models/viewmodels.ts";
import {useState} from "react";
import {randomSoftRGB} from "@src/helpers/helper.ts";
import styles from './SpendingTable.module.css'

type Mode = 'view' | 'groupSelect'

type Props = {
    date: Date
    spendings: SpendingRow[]
    updateSpendings: Updater<SpendingRow[]>
    showBudgetCol: boolean
}

function receiptIdUpdater(date: Date, spendings: SpendingRow[], updateSpendings: Updater<SpendingRow[]>) {
  return function (spId: string, receiptId: number, updatedAt: Date) {
    const spRow = spendings.find(s => (s.id == spId) && (dateISO(s.date) == dateISO(date)))!

    const newSp: Spending = {
      ...spRow,
      version: genVersion(spRow.version),
      receiptGroupId: receiptId,
      updatedAt: updatedAt,
      prev: {
        version: spRow.version,
        amount: spRow.amount,
        currency: spRow.currency,
        description: spRow.description,
      },
    }

    Facade.updateSpending(spRow.budgetId, newSp)

    updateSpendings(prev => {
      const idx = prev.findIndex(s =>
        (s.id == spId) && (s.version == spRow.version) && (dateISO(s.date) == dateISO(date)) && (s.budgetId == spRow.budgetId)
      )!

      prev[idx] = {
        ...newSp,
        budgetId: spRow.budgetId,
      }
    })
  }
}

export default function SpendingTable({ date, spendings, updateSpendings, showBudgetCol }: Props) {
  const rIdUpdater = receiptIdUpdater(date, spendings, updateSpendings)

    const dayTotal: Partial<Record<Currency, number>> = {}
    for (const { currency, amount } of spendings) {
        dayTotal[currency!] = (dayTotal[currency!] ?? 0) + amount
    }

    function colorFromReceiptId(rId: number) {
        return rId & 0xffffff
    }

    function rgbToCss(color: number) {
        if (!color) return undefined
        return `#${color.toString(16).padStart(6, '0')}`
    }

    function delSpending(s: SpendingRow) {
      if (!window.confirm(`Удалить запись "${s.description}" ?`)) {
        return
      }

      const now = new Date()
      const newVer = genVersion(s.version)

      Facade.deleteSpending(s.budgetId!, {
        id: s.id,
        version: newVer,
        prev: {
          version: s.version,
          amount: s.amount,
          currency: s.currency,
          description: s.description,
        },
        updatedAt: now,
      })

      updateSpendings(prev => {
        const idx = prev.findIndex(sp => sp.id === s.id)
        prev.splice(idx, 1)
      })
    }

    const [mode, setMode] = useState<Mode>('view')
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set<string>())

    function setGroupSelectMode() {
      setMode('groupSelect')
      setSelectedItems(new Set())
    }

    function onReceiptClick() {
      setGroupSelectMode()
    }

    function cancelGroupOperation() {
      setMode('view')
    }

    function uniteReceipt() {
      const days = daysFrom2000UTC(date)
      const color = randomSoftRGB()

      // 3byte + 3byte
      const receiptId: number = Number(BigInt(days) << 24n | BigInt(color))
      const now = new Date()

      for (const spId of selectedItems) {
        rIdUpdater(spId, receiptId, now)
      }

      setMode('view')
    }

    function separateReceipt() {
      const now = new Date()
      for (const spId of selectedItems) {
        rIdUpdater(spId, 0, now)
      }

      setMode('view')
    }

  function toggleSelected(spId: string) {
    setSelectedItems(prev => {
      const next = new Set(prev)

      if (next.has(spId)) {
        next.delete(spId)
      } else {
        next.add(spId)
      }

      return next
    })
  }

    return (
        <div className="row">
            <p style={{ position: 'relative', marginBottom: 0 }}>
            <span style={{ padding: 5, marginLeft: 6, cursor: 'pointer' }} onClick={onReceiptClick}>
              <FontAwesomeIcon icon={faReceipt} />
            </span>

            <span
                style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                }}
            >
              <b>
                <i>
                  {dateFormat(date)} ({dayName(date)})
                </i>
              </b>
            </span>
            </p>

            <div style={{ position: 'relative' }}>
                <table
                    className="table table-bordered table-sm align-middle"
                    style={{
                        tableLayout: 'fixed',
                        minWidth: 350,
                        opacity: isToday(date) ? 1 : 0.5,
                        marginBottom: 20,
                    }}
                >
                    <tbody>
                    {spendings.sort((a,b) => a.sort - b.sort).map((sp) => (
                        <tr
                          key={sp.id}
                          className={sp.receiptGroupId ? styles.bgRow : ''}
                          style={{
                            ['--row-bg-color' as string]: rgbToCss(colorFromReceiptId(sp.receiptGroupId)),
                          }}
                        >
                          <td style={{position: 'relative', textAlign: 'right'}}>
                            <span>{toMajorUnits(sp.amount, sp.currency)}</span>
                            {mode === 'groupSelect' && (
                                <input
                                  onChange={() => toggleSelected(sp.id)}
                                  style={{position: 'absolute', top: '10px', left: '10px'}}
                                  type="checkbox"
                                  checked={selectedItems.has(sp.id)}
                                />
                              )
                            }
                          </td>

                          <td>{sp.description}</td>

                          {showBudgetCol && <td>{sp.budgetId}</td>}

                          <td>
                            <button className="btn btn-warning btn-sm p-1 m-1" onClick={() => delSpending(sp)}>
                              <FontAwesomeIcon icon={faXmark}/>
                            </button>
                            <button className="btn btn-sm p-1 m-1">
                              <FontAwesomeIcon icon={faGripDotsVertical} />
                            </button>
                          </td>
                        </tr>
                    ))}

                    <tr>
                      <td>
                        <button className="btn btn-success btn-small"> + </button>
                        </td>
                        <td />
                        {showBudgetCol && <td />}
                        <td>{toMajorUnits(dayTotal.RUB ?? 0, 'RUB') } ₽</td>
                    </tr>

                    </tbody>
                </table>

              { mode === 'groupSelect' &&
                <div>
                  <button onClick={uniteReceipt} className="btn btn-success btn-small">Объединить в чек</button>
                  <button onClick={separateReceipt} className="btn btn-success btn-small">Разъединить чек</button>
                  <button onClick={cancelGroupOperation} className="btn btn-warning btn-small">Отменить</button>
                </div>
              }
            </div>
        </div>
    )
}