import {create, type StateCreator} from 'zustand'
import { persist } from 'zustand/middleware'

import type { ConflictVersion } from '@src/models/models'
import {immer} from "zustand/middleware/immer";

type ConflictVersionState = {
    conflictVersions: Record<string, ConflictVersion>

    add: (...ver: ConflictVersion[]) => void
    remove: (ver: string) => void

    conflictVersionsArr: () => ConflictVersion[]
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
