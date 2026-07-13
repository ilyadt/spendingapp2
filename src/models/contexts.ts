import {createContext} from "react";
import type {BudgetsWithSpentById} from "@/stores/budgets.ts";
import type {SpendingsStoreApi} from "@/stores/spendings.ts";
import type {StatusStore} from "@/stores/status.ts";
import type {StoreApi} from "zustand/vanilla";
import type {ConflictVersionStore} from "@/stores/conflictVersions.ts";
import type {SpendingActions} from "@/models/models.ts";

export const BudgetsContext = createContext<BudgetsWithSpentById>({});

export const SpendingsContext = createContext<SpendingsStoreApi>({} as SpendingsStoreApi);

export const SpendingActionsContext = createContext<SpendingActions>({} as SpendingActions)

export const StatusStoreContext = createContext<StoreApi<StatusStore>>(null as never)

export const ConflictVersionsStoreContext = createContext<StoreApi<ConflictVersionStore>>(null as never)
