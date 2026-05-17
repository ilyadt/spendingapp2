import { isToday } from 'date-fns'
import { dateFormat, dayName } from '@src/helpers/date'
import { type Currency } from '@src/helpers/money'
import {type SpendingRow} from '@src/models/viewmodels'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faReceipt, faXmark } from '@fortawesome/free-solid-svg-icons'

type Props = {
    date: Date
    spendings: SpendingRow[]
    showBudgetCol: boolean
}

export default function SpendingTable({ date, spendings, showBudgetCol }: Props) {
    const dayTotal: Partial<Record<Currency, number>> = {}
    for (const { currency, amountFull } of spendings) {
        dayTotal[currency!] = (dayTotal[currency!] ?? 0) + amountFull
    }

    function colorFromReceiptId(rId: number) {
        return rId & 0xffffff
    }

    function rgbToCss(color: number) {
        if (!color) return undefined
        return `#${color.toString(16).padStart(6, '0')}`
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
                                  {sp.amountFull}
                              </span>
                            </td>

                            <td>{sp.description}</td>

                            {showBudgetCol && (<td>{sp.budgetId}</td>)}

                            <td>
                                <button className="btn btn-warning btn-sm">
                                    <FontAwesomeIcon icon={faXmark} />
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
                        <td>{dayTotal.RUB ?? 0} ₽</td>
                    </tr>

                    </tbody>
                </table>
            </div>
        </div>
    )
}