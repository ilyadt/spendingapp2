import {createContext} from "react";
import type {BudgetsWithSpentById} from "@src/stores/budgets.ts";
import type {SpendingsStoreActions} from "./cudSpendingWrapper.ts";

export const BudgetsContext = createContext<BudgetsWithSpentById>({});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export const SpendingsStoreActionsContext = createContext<SpendingsStoreActions>(null)

