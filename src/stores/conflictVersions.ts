import {create, type StateCreator} from 'zustand'
import { persist } from 'zustand/middleware'

import type { ConflictVersion } from '@src/models/models'
import {immer} from "zustand/middleware/immer";

type ConflictVersionState = {
    conflictVersions: ConflictVersion[]

    add: (...ver: ConflictVersion[]) => void
    remove: (ver: string) => void
    reset: () => void
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
      set => ({
        conflictVersions: [],

        add: (...vers) =>
          set((state) => {
            state.conflictVersions.push(...vers)
          }),

        remove: (ver) =>
          set((state) => {
            const idx = state.conflictVersions.findIndex((v) => v.version === ver)

            if (idx === -1) {
              return
            }

            state.conflictVersions.splice(idx, 1)
          }),

        reset: () => set({ conflictVersions: [] }),
      }),
    ),
    {
        name: 'conflictVersionsV2',
    }
)

export const useConflictVersionStore = create(conflictVersionStateCreator)
