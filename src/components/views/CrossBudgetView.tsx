import SpendingTable from '@src/components/SpendingTable'
import { Facade } from '@src/facade'
import { dateISO, dateRange} from '@src/helpers/date'
import { moneyFormat } from '@src/helpers/money'
import { type Budget} from '@src/models/models'
import {type SpendingRow} from "@src/models/viewmodels.ts";
import {useEffect, useState} from "react";

type Props = {
  budgets: Budget[]
}

export function CrossBudgetView({budgets} : Props) {
  const { dateFrom, dateTo } = budgets.reduce(
    (acc, { dateFrom: df, dateTo: dt }) => {
      return {
        dateFrom: df < acc.dateFrom ? df : acc.dateFrom,
        dateTo: dt > acc.dateTo ? dt : acc.dateTo,
      }
    },
    { dateFrom: new Date(8640000000000000), dateTo: new Date(-8640000000000000) },
  )

  type SpendingsByDate = {
    [date: string]: SpendingRow[]
  }

  const [spsByDates] = useState<SpendingsByDate>(() => {
    const spendingsByDate: Record<string, SpendingRow[]> = {}

    // init
    for (const date of dateRange(dateFrom, dateTo)) {
      spendingsByDate[dateISO(date)] = []
    }

    // fill
    for (const b of budgets) {
      const spendings = Facade.spendingsByBudgetId(b.id)

      for (const s of spendings) {
        const key = dateISO(s.date)

        spendingsByDate[key] ??= []
        spendingsByDate[key].push({
          amountFull: moneyFormat(s.money),
          budgetId: b.id,
          createdAt: s.createdAt,
          currency: s.money.currency,
          date: s.date,
          description: s.description,
          id: s.id,
          receiptGroupId: s.receiptGroupId,
          sort: s.sort,
          updatedAt: s.updatedAt,
          version: s.version,
        })
      }
    }

    return  spendingsByDate
  })

  useEffect(() => {
    const el = document.getElementById('todayDate')

    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [])

  return (
    <>
      {Object.entries(spsByDates).map(([date, sps]) => (
        <div key={date} id={date == dateISO(new Date()) ? 'todayDate' : undefined}>
          <SpendingTable
            date={new Date(date)}
            spendings={sps}
            showBudgetCol={false}
          ></SpendingTable>
        </div>
      ))}
    </>
  )
}