import {type Currency} from '@/helpers/money'
import type { components, paths } from '@/models/oaschema'

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
