import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type StatusState = {
    statusGetSpendings: string
    statusUpdateSpendings: string
    pendingEvents: number

    setUpdateSpendingStatus: (s: string) => void
    setGetSpendingStatus: (s: string) => void
    setPendingEvents: (n: number) => void
}

export const useStatusStore = create<StatusState>()(
    persist(
        (set) => ({
        statusGetSpendings: '',
        statusUpdateSpendings: '',
        pendingEvents: 0,

        setUpdateSpendingStatus: (s) =>
            set({ statusUpdateSpendings: s }),

        setGetSpendingStatus: (s) =>
            set({ statusGetSpendings: s }),

        setPendingEvents: (n) =>
            set({ pendingEvents: n }),
        }),
        {
            name: 'statusV2',
        }
    )
)
