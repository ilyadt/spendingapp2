import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App.tsx'
import {createFetcher, createUploader} from "@/api.ts";
import { HashRouter } from "react-router";
import {createSpendingActionsWrapper} from "./models/spendingActionsWrapper.ts";
import {
  ConflictVersionsStoreContext,
  SpendingActionsContext,
  SpendingsContext,
  StatusStoreContext
} from "@/models/contexts.ts";
import {BudgetsContextProvider} from "@/facilities/BudgetsContextProvider.tsx";
import {createBudgetsWithSpentStore} from "@/stores/budgets.ts";
import {createBudgetsAndSpendingsRepository} from "@/repository.ts";
import {createSpendingsStore} from "@/stores/spendings.ts";
import {composeSpActions, getAllBudgetsAndSpendings} from "@/helpers/helper.ts";

import 'bootstrap/dist/css/bootstrap.min.css'
import '@/app/global.css'
import {createPersistentStatusStore} from "@/stores/status.ts";
import {createPersistentConflictVersionStore} from "@/stores/conflictVersions.ts";

const budgetsAndSpendingsRepository = createBudgetsAndSpendingsRepository(localStorage)

const serverUrl = import.meta.env.VITE_SERVER_URL

const statusStore = createPersistentStatusStore()
const conflictVersionsStore = createPersistentConflictVersionStore()

const fetcher = createFetcher(
  localStorage,
  serverUrl,
  budgetsAndSpendingsRepository,
  statusStore.getState(),
  conflictVersionsStore.getState(),
)

const uploader = createUploader(
  localStorage,
  serverUrl,
  budgetsAndSpendingsRepository,
  statusStore.getState(),
  conflictVersionsStore.getState(),
)

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
    <StatusStoreContext value={statusStore}>
      <ConflictVersionsStoreContext value={conflictVersionsStore}>
        <SpendingActionsContext value={createSpendingActionsWrapper(spActions)}>
          <BudgetsContextProvider store={budgetsStore}>
            <SpendingsContext value={spendingsStore}>
              <HashRouter>
                <App />
              </HashRouter>
            </SpendingsContext>
          </BudgetsContextProvider>
        </SpendingActionsContext>
      </ConflictVersionsStoreContext>
    </StatusStoreContext>
  </StrictMode>,
)
