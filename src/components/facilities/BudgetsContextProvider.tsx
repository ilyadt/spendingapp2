import {type BudgetsStore} from "@/stores/budgets.ts";
import {BudgetsContext} from "@/models/contexts.ts";
import {type ReactNode} from "react";
import {useStore} from "zustand/react";
import type {StoreApi} from "zustand/vanilla";

type Props = {
  store: StoreApi<BudgetsStore>
  children: ReactNode
}

export function BudgetsContextProvider({store, children}: Props) {
  const budgets = useStore(store, (s) => s.budgets)

  return (
    <BudgetsContext value={budgets}>
      {children}
    </BudgetsContext>
  )
}
