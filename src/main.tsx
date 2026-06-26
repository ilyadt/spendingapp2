import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import {Fetcher, Uploader} from "@/api.ts";
import { HashRouter } from "react-router";
import {createCudSpendingWrapper} from "./models/cudSpendingWrapper.ts";
import {SpendingsStoreActionsContext} from "@/models/contexts.ts";
import {Facade} from "@/facade.ts";
import {BudgetsContextProvider} from "@/components/facilities/BudgetsContextProvider.tsx";
import {budgetsWithSpentStore} from "@/stores/budgets.ts";

import 'bootstrap/dist/css/bootstrap.min.css'

await Fetcher.initAndStart()
Uploader.init()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SpendingsStoreActionsContext value={createCudSpendingWrapper(Facade)}>
      <BudgetsContextProvider store={budgetsWithSpentStore}>
        <HashRouter>
          <App />
        </HashRouter>
      </BudgetsContextProvider>
    </SpendingsStoreActionsContext>
  </StrictMode>,
)
