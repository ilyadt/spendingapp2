import { alphanumeric } from 'nanoid-dictionary'
import { customAlphabet } from 'nanoid/non-secure'

import type {Currency, Money} from '@src/helpers/money'
import type { components, paths } from '@src/models/oaschema'
import { v7 as uuidv7 } from 'uuid'
import type { SpendingRow } from '@src/models/view'

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
  money: Money
  description: string
  createdAt: Date
  updatedAt: Date
  receiptGroupId: number
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
  money: Money
  dateFrom: Date
  dateTo: Date
  params: {
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

// TODO: move
export function receiptTotals(tableRows: SpendingRow[]): Array<number> {
  const rId2total: Record<number, [number, number] > = {}

  for (const [i, sp] of tableRows.entries()) {
    if (sp.receiptGroupId == 0) {
      continue
    }

    const oldTotal = rId2total[sp.receiptGroupId] ?? [-1, 0]
    rId2total[sp.receiptGroupId] = [i, oldTotal[1] + sp.amountFull]
  }

  const res = Array.from({length: tableRows.length}, () => 0)
  for (const [rowIdx, totalRecept] of  Object.values(rId2total)) {
    res[rowIdx] = totalRecept
  }

  return res
}
