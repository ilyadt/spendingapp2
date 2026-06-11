import {createContext} from "react";
import type {BudgetsWithSpentById} from "@src/stores/budgets.ts";
import {
  type createSpending,
  type deleteSpending,
  type saveSpendingChanges,
  type updateSpending
} from "@src/models/facadewrapper.ts";

export const BudgetsContext = createContext<BudgetsWithSpentById>({});

interface spendingsStoreActions {
  createSpending: typeof createSpending,
  updateSpending: typeof updateSpending,
  deleteSpending: typeof deleteSpending,
  saveSpendingChanges: typeof saveSpendingChanges,
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export const SpendingsStoreActionsContext = createContext<spendingsStoreActions>(null)

