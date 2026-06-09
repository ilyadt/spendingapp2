import { alphanumeric } from 'nanoid-dictionary'
import { customAlphabet } from 'nanoid/non-secure'

import {type Currency, fromMajorUnits} from '@src/helpers/money'
import type { components, paths } from '@src/models/oaschema'
import { v7 as uuidv7 } from 'uuid'

export const genSpendingID = (): string => uuidv7()

// null    -> v1-xxxxx
// xxxxx   -> yyyyy
// v1-3829f -> v2-xxxxx
export const genVersion = (prevVer: string | null): string => {
  const versionSuffix = customAlphabet(alphanumeric, 7)

  if (prevVer === null) {
    return `v1-${versionSuffix()}`
  }

  const match = prevVer.match(/^v(\d+)-/i)
  if (!match) {
    return versionSuffix()
  }

  const nextNum = parseInt(match[1]!, 10) + 1

  return `v${nextNum}-${versionSuffix()}`
}

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
    chooseBudget: boolean
    chooseDate: boolean
  }) {
  const budget: Budget|undefined = bs[Number(fd.get('budgetId'))]

  const amount = budget ? fromMajorUnits(Number(fd.get('amount')), budget.currency) : 0
  const description = fd.get('description')?.toString() ?? ''
  const d = new Date(fd.get('date')?.toString() ?? '')
  const date = d.getTime() ? d : null

  return {
    data: {amount, description, budget, date: date!},
    isEmpty: (): boolean => {
      let userFilled = Boolean(amount) || Boolean(description)

      if (cfg.chooseBudget) {
        userFilled ||= Boolean(budget)
      }

      if (cfg.chooseDate) {
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
