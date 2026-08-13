import {fromMajorUnits} from "@/helpers/money.ts";
import type {Budget, SpendingRow} from "@/models/models.ts";

export type SpendingFormData = ReturnType<typeof createSpendingFormData>;

export function createSpendingFormData(fd: FormData, budgets: Record<number, Budget>) {
  const budget: Budget|undefined = budgets[Number(fd.get('budgetId'))]

  const amountFull = Number(fd.get('amount')?.toString() ?? '')
  const amount = budget ? fromMajorUnits(amountFull, budget.currency) : 0
  const description = fd.get('description')?.toString() ?? ''
  const d = new Date(fd.get('date')?.toString() ?? '')
  const date = d.getTime() ? d : null

  return {
    date: date!,
    budgetId: budget?.id,
    amount,
    amountFull,
    description
  }
}

export const isEmpty = (data: SpendingFormData) => !data.amountFull && !data.description

export const isEqual = (data: SpendingFormData, s: SpendingRow) =>
  data.budgetId === s.budgetId
  && data.date?.getTime() === s.date?.getTime()
  && data.amount === s.amount
  && data.description === s.description

export const validate = (data: SpendingFormData): string|null => {
  if (!data.budgetId) {
    return 'не выбран бюджет'
  }

  if (!data.date) {
    return  'не выбрана дата'
  }

  if (!data.amount) {
    return 'пустая сумма'
  }

  if (!data.description) {
    return 'пустое описание'
  }

  return null
}
