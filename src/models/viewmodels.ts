import type { Currency } from '@src/helpers/money.ts'

export interface SpendingRow {
  internalRowId: number
  id: string
  version: string
  budgetId: number
  date: Date
  amount: number
  currency: Currency
  description: string
  sort: number
  createdAt: Date
  updatedAt: Date
  receiptGroupId: number
}
