import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import {Fetcher, Uploader} from "@src/api.ts";
import { HashRouter } from "react-router";
import {
  createSpending,
  updateSpending,
  deleteSpending,
  saveSpendingChanges
} from "@src/models/facadewrapper.ts";
import {SpendingsStoreActionsContext} from "@src/models/contexts.ts";

import 'bootstrap/dist/css/bootstrap.min.css'

await Fetcher.initAndStart()
Uploader.init()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SpendingsStoreActionsContext value={{createSpending, updateSpending, deleteSpending, saveSpendingChanges}}>
      <HashRouter>
        <App />
      </HashRouter>
    </SpendingsStoreActionsContext>
  </StrictMode>,
)
