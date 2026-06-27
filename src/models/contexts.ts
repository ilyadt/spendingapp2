import {createContext} from "react";
import type {BudgetsWithSpentById} from "@/stores/budgets.ts";
import type {SpendingsStoreActions} from "./cudSpendingWrapper.ts";

export const BudgetsContext = createContext<BudgetsWithSpentById>({});

export const SpendingsStoreActionsContext = createContext<SpendingsStoreActions>({} as SpendingsStoreActions)

