import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import {Fetcher, Uploader} from "@src/api.ts";

import 'bootstrap/dist/css/bootstrap.min.css'

await Fetcher.initAndStart()
Uploader.init()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <App />
  </StrictMode>,
)
