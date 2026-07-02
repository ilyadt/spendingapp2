import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App.tsx'
import {createFetcher, createUploader} from "@/api.ts";
import { HashRouter } from "react-router";
import {createSpendingActionsWrapper} from "./models/spendingActionsWrapper.ts";
import {SpendingActionsContext, SpendingsContext} from "@/models/contexts.ts";
import {BudgetsContextProvider} from "@/facilities/BudgetsContextProvider.tsx";
import {createBudgetsWithSpentStore} from "@/stores/budgets.ts";
import {createBudgetsAndSpendingsRepository} from "@/repository.ts";
import {createSpendingsStore} from "@/stores/spendings.ts";
import {composeSpActions, getAllBudgetsAndSpendings} from "@/helpers/helper.ts";

import 'bootstrap/dist/css/bootstrap.min.css'
import '@/app/global.css'

const budgetsAndSpendingsRepository = createBudgetsAndSpendingsRepository(localStorage)

const fetcher = createFetcher(budgetsAndSpendingsRepository)
const uploader = createUploader(budgetsAndSpendingsRepository)

await fetcher.initAndStart()
uploader.init()

const {budgetsById, spendingsByBid} = getAllBudgetsAndSpendings(budgetsAndSpendingsRepository)

const budgetsStore = createBudgetsWithSpentStore(budgetsById)
const spendingsStore = createSpendingsStore(spendingsByBid)

const spActions = composeSpActions([
  budgetsAndSpendingsRepository,
  uploader,
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
