import type { Currency } from '@src/helpers/money.ts'

export interface SpendingRow {
  id: string
  version: string
  budgetId: number
  date: Date
  amountFull: number
  currency: Currency
  description: string
  sort: number
  createdAt: Date
  updatedAt: Date
  receiptGroupId: number
}
