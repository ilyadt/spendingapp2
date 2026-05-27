import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { ConflictVersion } from '@src/models/models'

type ConflictVersionState = {
    conflictVersions: ConflictVersion[]

    add: (...ver: ConflictVersion[]) => void
    remove: (ver: string) => void
    reset: () => void
}

export const useConflictVersionStore = create<ConflictVersionState>()(
    persist(
        (set) => ({
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
)