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
    data: {amount, description, budget, date: date!},
    isEmpty: () => !amountFull && !description,
    validate() {
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
