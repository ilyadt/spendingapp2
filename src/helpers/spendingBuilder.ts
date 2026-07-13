import {
  type Budget,
  type DelSpending,
  type Spending,
  type SpendingRow,
} from "@/models/models.ts";
import {genSpendingID, genVersion} from "@/helpers/helper.ts";

export interface SpendingData {
  budget: Budget,
  date: Date,
  amount: number,
  description: string,
  receiptId?: number,
  sort?: number,
}

export function buildCreateSpObj(data: SpendingData, createdAt: Date): Spending {
  return {
    id: genSpendingID(),
    version: genVersion(null),
    amount: data.amount,
    currency: data.budget.currency,
    description: data.description,
    updatedAt: createdAt,
    createdAt: createdAt,
    date: data.date,
    sort: data.sort ?? createdAt.getTime(),
    receiptGroupId: data.receiptId  ?? 0,
  }
}

export function buildUpdateSpObj(old: SpendingRow, data: Partial<SpendingData>, updatedAt: Date): Spending {
  const amount = data.amount ? data.amount: old.amount
  const description = data.description ? data.description : old.description
  const receiptId = (data.receiptId != null) ? data.receiptId : old.receiptGroupId

  return {
    id: old.id,
    version: genVersion(old.version),
    amount: amount,
    currency: old.currency,
    description: description,
    updatedAt: updatedAt,
    createdAt: old.createdAt,
    date: old.date,
    sort: old.sort,
    receiptGroupId: receiptId,
    prev: {
      version: old.version,
      amount: old.amount,
      currency: old.currency,
      description: old.description,
    }
  }
}

export function buildDeleteSpObj(oldRow: SpendingRow, deletedAt: Date): DelSpending {
  return {
    id: oldRow.id,
    version: genVersion(oldRow.version),
    updatedAt: deletedAt,
    prev: {
      version: oldRow.version,
      amount: oldRow.amount,
      currency: oldRow.currency,
      description: oldRow.description,
    },
  }
}
