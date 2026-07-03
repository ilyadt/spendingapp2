import {createContext} from "react";
import type {BudgetsWithSpentById} from "@/stores/budgets.ts";
import type {WrappedSpendingActions} from "./spendingActionsWrapper.ts";
import type {SpendingsStoreApi} from "@/stores/spendings.ts";
import type {StatusStore} from "@/stores/status.ts";
import type {StoreApi} from "zustand/vanilla";

export const BudgetsContext = createContext<BudgetsWithSpentById>({});

export const SpendingsContext = createContext<SpendingsStoreApi>({} as SpendingsStoreApi);

export const SpendingActionsContext = createContext<WrappedSpendingActions>({} as WrappedSpendingActions)

export const StatusContext = createContext<StoreApi<StatusStore>>(null as never)
