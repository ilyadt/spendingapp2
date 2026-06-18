import {create, type StateCreator} from 'zustand'
import { persist } from 'zustand/middleware'

// Spending version id
type SpVersionId = string

export interface ConflictSpendingVersion {
  version: SpVersionId
  budgetId: number
  spendingId: string
  versionDt: Date
  conflictedAt: Date
  from: string | null // null - created
  to: string | null // null - deleted
  reason: string | null
}

type ConflictVersionState = {
    conflictVersions: Record<SpVersionId, ConflictSpendingVersion>

    add: (...ver: ConflictSpendingVersion[]) => void
    remove: (ver: SpVersionId) => void

    conflictVersionsArr: () => ConflictSpendingVersion[]
}

type StateWithPersist = StateCreator<
  ConflictVersionState,
  [],
  [
    ['zustand/persist', unknown],
  ]>

export const conflictVersionStateCreator: StateWithPersist =
  persist(
      (set, get) => ({
        conflictVersions: {},

        add: (...vers) =>
          set((state) => {
            const newVersions = {...state.conflictVersions}

            for (const v of vers) {
              if (state.conflictVersions[v.version]) {
                throw new Error(`Conflict version ${v.version} already exists`)
              }

              newVersions[v.version] = v
            }

            return {conflictVersions: newVersions}
          }),

        remove: (ver) =>
          set((state) => {
            if (!state.conflictVersions[ver]) {
              return state
            }

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [ver]: _, ...remaining } = state.conflictVersions
            return { conflictVersions: remaining }
          }),
        conflictVersionsArr: () => Object.values(get().conflictVersions)
      }),
    {
        name: 'conflictVersionsV2',
    }
)

export const useConflictVersionStore = create(conflictVersionStateCreator)
