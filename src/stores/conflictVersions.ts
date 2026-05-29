import {create, type StateCreator} from 'zustand'
import { persist } from 'zustand/middleware'

import type { ConflictVersion } from '@src/models/models'

type ConflictVersionState = {
    conflictVersions: ConflictVersion[]

    add: (...ver: ConflictVersion[]) => void
    remove: (ver: string) => void
    reset: () => void
}

type StateWithPersist = StateCreator<ConflictVersionState, [], [['zustand/persist', unknown]]>

export const conflictVersionStateCreator: StateWithPersist =
  persist(
    set => ({
        conflictVersions: [],

        add: (...ver) =>
            set((state) => ({
                conflictVersions: [...state.conflictVersions, ...ver],
            })),

        remove: (ver) =>
            set((state) => ({
                conflictVersions: state.conflictVersions.filter(
                    (v) => v.version !== ver
                ),
            })),

        reset: () => set({ conflictVersions: [] }),
    }),
    {
        name: 'conflictVersionsV2',
    }
)

export const useConflictVersionStore = create(conflictVersionStateCreator)
