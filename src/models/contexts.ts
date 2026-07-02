import {createContext} from "react";
import type {BudgetsWithSpentById} from "@/stores/budgets.ts";
import type {WrappedSpendingActions} from "./spendingActionsWrapper.ts";
import type {SpendingsStoreApi} from "@/stores/spendings.ts";

export const BudgetsContext = createContext<BudgetsWithSpentById>({});

export const SpendingsContext = createContext<SpendingsStoreApi>({} as SpendingsStoreApi);

export const SpendingActionsContext = createContext<WrappedSpendingActions>({} as WrappedSpendingActions)

