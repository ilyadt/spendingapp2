import { isToday } from 'date-fns'
import { dateFormat, dayName } from '@src/helpers/date'
import {type Currency, toMajorUnits} from '@src/helpers/money'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faReceipt, faXmark} from '@fortawesome/free-solid-svg-icons'
import { faGripDotsVertical } from '@src/helpers/icons'
import type {Updater} from "use-immer";
import {genVersion} from "@src/models/models.ts";
import {Facade} from "@src/facade.ts";
import type {SpendingRow} from "@src/models/viewmodels.ts";

type Props = {
    date: Date
    spendings: SpendingRow[]
    updateSpendings: Updater<SpendingRow[]>
    showBudgetCol: boolean
}

export default function SpendingTable({ date, spendings, updateSpendings, showBudgetCol }: Props) {
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

  return (
        <div className="row">
            <p style={{ position: 'relative', marginBottom: 0 }}>
            <span style={{ padding: 5, marginLeft: 6, cursor: 'pointer' }}>
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
                    {spendings.map((sp) => (
                        <tr
                            key={sp.id}
                            className={sp.receiptGroupId ? 'bg-row' : ''}
                            style={{
                                background: rgbToCss(colorFromReceiptId(sp.receiptGroupId)),
                            }}
                        >
                            <td style={{ position: 'relative', textAlign: 'right' }}>
                              <span>
                                  {toMajorUnits(sp.amount, sp.currency)}
                              </span>
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
            </div>
        </div>
    )
}