import {create, type StateCreator} from 'zustand'
import { persist } from 'zustand/middleware'

import {immer} from "zustand/middleware/immer";

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
    ["zustand/immer", never],
  ]>

export const conflictVersionStateCreator: StateWithPersist =
  persist(
    immer(
      (set, get) => ({
        conflictVersions: {},

        add: (...vers) =>
          set((state) => {
            for (const v of vers) {
              if (state.conflictVersions[v.version]) {
                throw new Error(`Conflict version ${v.version} already exists`)
              }

              state.conflictVersions[v.version] = v
            }
          }),

        remove: (ver) =>
          set((state) => {
            delete state.conflictVersions[ver]
          }),
        conflictVersionsArr: () => Object.values(get().conflictVersions)
      }),
    ),
    {
        name: 'conflictVersionsV2',
    }
)

export const useConflictVersionStore = create(conflictVersionStateCreator)
