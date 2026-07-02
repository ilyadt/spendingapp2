import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App.tsx'
import {Fetcher, Uploader} from "@/api.ts";
import { HashRouter } from "react-router";
import {createSpendingActionsWrapper} from "./models/spendingActionsWrapper.ts";
import {SpendingActionsContext, SpendingsContext} from "@/models/contexts.ts";
import {BudgetsContextProvider} from "@/facilities/BudgetsContextProvider.tsx";
import {createBudgetsWithSpentStore, initBudgetsWithSpent} from "@/stores/budgets.ts";
import {budgetsAndSpendingsRepository} from "@/repository.ts";
import {createSpendingsStore, type SpendingsByBudget} from "@/stores/spendings.ts";

import 'bootstrap/dist/css/bootstrap.min.css'
import '@/app/global.css'
import {composeSpActions} from "@/helpers/helper.ts";

await Fetcher.initAndStart()
Uploader.init()

const budgetsStore = createBudgetsWithSpentStore(initBudgetsWithSpent())

export function spendingsByBudgetIds(bids: number[]): SpendingsByBudget {
  const spByBid: SpendingsByBudget = {}
  for (const bid of bids) {
    spByBid[bid] = budgetsAndSpendingsRepository.spendingsByBudgetId(bid)
  }

  return spByBid
}

const spendingsStore = createSpendingsStore(
  spendingsByBudgetIds(
    Object.keys(budgetsStore.getState().budgets).map(Number)
  )
)

const spActions = composeSpActions([
  budgetsAndSpendingsRepository,
  Uploader,
  budgetsStore.getState(),
  spendingsStore,
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SpendingActionsContext value={createSpendingActionsWrapper(spActions)}>
      <BudgetsContextProvider store={budgetsStore}>
        <SpendingsContext value={spendingsStore}>
          <HashRouter>
            <App />
          </HashRouter>
        </SpendingsContext>
      </BudgetsContextProvider>
    </SpendingActionsContext>
  </StrictMode>,
)
