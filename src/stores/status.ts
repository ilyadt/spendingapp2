import {createStore, type StateCreator} from 'zustand'
import {persist} from 'zustand/middleware'

export type StatusStore = {
  statusGetSpendings: string
  statusUpdateSpendings: string
  pendingEvents: number

  setUpdateSpendingStatus: (s: string) => void
  setGetSpendingStatus: (s: string) => void
  setPendingEvents: (n: number) => void
}

export const statusStoreCreator: StateCreator<StatusStore> =
  (set): StatusStore => ({
    statusGetSpendings: '',
    statusUpdateSpendings: '',
    pendingEvents: 0,

    setUpdateSpendingStatus: (s) => set({statusUpdateSpendings: s}),
    setGetSpendingStatus: (s) => set({statusGetSpendings: s}),
    setPendingEvents: (n) => set({pendingEvents: n})
  })

export const createPersistentStatusStore = () => createStore<StatusStore>()(
  persist(
    statusStoreCreator,
    {name: 'statusV2'}
  )
)

export const createStatusStore = () => createStore<StatusStore>(statusStoreCreator)
