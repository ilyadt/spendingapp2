import {type Currency, fromMajorUnits} from '@src/helpers/money'
import type { components, paths } from '@src/models/oaschema'

export type ApiBudget = components['schemas']['Budget']
export type ApiSpending = components['schemas']['Spending']
export type ApiSpendingEvent = components['schemas']['SpendingEvent']
export type ApiUpdateSpendingsErrorsResponse = components['schemas']['UpdateSpendingsErrorsResponse']
export type ApiUploadError = components['schemas']['UpdateSpendingsError']
export type ApiMoney = components['schemas']['Money']
export type ApiSchemaPaths = paths

export interface Spending {
  id: string
  version: string
  prev?: SpendingPrev
  date: Date
  sort: number
  amount: number
  currency: Currency
  description: string
  createdAt: Date
  updatedAt: Date
  receiptGroupId: number
}

export function isNew(sp: Spending): boolean {
  return !sp.id
}

// Предыдущая версия Spending
export interface SpendingPrev {
  version: string
  amount: number
  currency: Currency
  description: string
}

export type SpendingRow = Spending & {
  rowId: number
  budgetId: number
}

export interface Budget {
  id: number
  alias: string
  name: string
  sort: number
  description?: string
  amount: number,
  currency: Currency,
  dateFrom: Date
  dateTo: Date
  params: {
    perDay?: boolean
    [key: string]: unknown
  }
}

export type DelSpending = Pick<Spending, 'id' | 'version' | 'prev' | 'updatedAt'>

export function spendingFormValidator(
  fd: FormData,
  bs: Record<number, Budget>,
  cfg: {
    selectBudget: boolean
    selectDate: boolean
  }) {
  const budget: Budget|undefined = bs[Number(fd.get('budgetId'))]

  const amountFull = Number(fd.get('amount')?.toString() ?? '')
  const amount = budget ? fromMajorUnits(amountFull, budget.currency) : 0
  const description = fd.get('description')?.toString() ?? ''
  const d = new Date(fd.get('date')?.toString() ?? '')
  const date = d.getTime() ? d : null

  return {
    data: {amount, description, budget, date: date!},
    isEmpty: (): boolean => {
      let userFilled = Boolean(amountFull) || Boolean(description)

      if (cfg.selectBudget) {
        userFilled ||= Boolean(budget)
      }

      if (cfg.selectDate) {
        userFilled ||= Boolean(date)
      }

      return !userFilled
    },
    validate: function () {
      if (!budget) {
        return 'не выбран бюджет'
      }

      if (!date) {
        return  'не выбрана дата'
      }

      if (!amount) {
        return 'пустая сумма'
      }

      if (!description) {
        return 'пустое описание'
      }

      return null
    },
    isEqual: (s: SpendingRow) =>
      budget?.id === s.budgetId
      && date?.getTime() === s.date?.getTime()
      && amount === s.amount
      && description === s.description,
  }
}
