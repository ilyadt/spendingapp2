import { alphanumeric } from 'nanoid-dictionary'
import { customAlphabet } from 'nanoid/non-secure'

import {type Currency, fromMajorUnits} from '@src/helpers/money'
import type { components, paths } from '@src/models/oaschema'
import { v7 as uuidv7 } from 'uuid'
import type {SpendingRow} from "@src/models/viewmodels.ts";

export const genSpendingID = (): string => uuidv7()

const hexSymbols5 = customAlphabet('0123456789abcdef', 5)

// null    -> v1-xxxxx
// xxxxx   -> yyyyy
// v1-3829f -> v2-xxxxx
export const genVersion = (prevVer: string | null): string => {
  if (prevVer === null) {
    return `v1-${hexSymbols5()}`
  }

  const match = prevVer.match(/^v(\d+)-([0-9a-f]{5})$/i)
  if (!match) {
    return customAlphabet(alphanumeric, 5)()
  }

  const nextNum = parseInt(match[1]!, 10) + 1

  return `v${nextNum}-${hexSymbols5()}`
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

export interface ConflictVersion {
  version: string
  budgetId: number
  spendingId: string
  versionDt: Date
  conflictedAt: Date
  from: string | null // null - created
  to: string | null // null - deleted
  reason: string | null
}


export interface spendingEditForm {
  budget: Budget|undefined,
  isEmpty():boolean
  isEqual(sp: SpendingRow): boolean
  validate(): string|null
  data(): {
    amount: number,
    description: string,
    budget: Budget,
  },
}

export function createSpendingEditForm(fd: FormData, bs: Record<number, Budget>): spendingEditForm {
  const budget: Budget|undefined = bs[Number(fd.get('budgetId'))]

  const amountFull = Number(fd.get('amount'))
  const amount = budget ? fromMajorUnits(amountFull, budget.currency) : 0
  const description = fd.get('description')?.toString() ?? ''

  return {
    budget,
    data: () => ({amount, description, budget}),
    isEmpty: (): boolean => !amountFull && !description, // TODO: split form for cross-budget / not
    validate: function () {
      if (!budget) {
        return 'не выбран бюджет'
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
      && amount === s.amount
      && description === s.description,
  }
}